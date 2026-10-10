import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getVisitor } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
import { favouritesInput } from "@/lib/visitor-validation";
export async function GET(request: Request) {
  try {
    const user = await getVisitor(request);
    if (!user)
      throw new ApiError(401, "Please sign in to choose your favourites.");
    const favourites = await db.favouriteCategory.findMany({
      where: { userId: user.id },
      orderBy: { category: "asc" },
    });
    return NextResponse.json(
      { categories: favourites.map((value) => value.category) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: Request) {
  try {
    checkOrigin(request);
    const user = await getVisitor(request);
    if (!user)
      throw new ApiError(401, "Please sign in to choose your favourites.");
    const input = favouritesInput.parse(await readJson(request));
    await db.$transaction(
      async (tx) => {
        // Serialize replacements per user, including simultaneous requests from separate devices.
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${user.id} FOR UPDATE`;
        await tx.favouriteCategory.deleteMany({ where: { userId: user.id } });
        if (input.categories.length)
          await tx.favouriteCategory.createMany({
            data: input.categories.map((category) => ({
              userId: user.id,
              category,
            })),
          });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
    return NextResponse.json(
      { categories: input.categories },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
