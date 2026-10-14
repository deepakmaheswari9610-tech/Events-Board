import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getVisitor } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
import { catalogSelect } from "@/lib/catalogs";
import { favouritesInput } from "@/lib/visitor-validation";
export async function GET(request: Request) {
  try {
    const user = await getVisitor(request);
    if (!user)
      throw new ApiError(401, "Please sign in to choose your favourites.");
    const favourites = await db.favouriteCategory.findMany({
      where: { userId: user.id },
      orderBy: { category: { name: "asc" } },
      include: { category: { select: catalogSelect } },
    });
    return NextResponse.json(
      {
        categories: favourites.map((value) => value.category),
        categoryIds: favourites.map((value) => value.categoryId),
      },
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
        const count = await tx.category.count({
          where: { id: { in: input.categoryIds } },
        });
        if (count !== input.categoryIds.length)
          throw new ApiError(400, "Choose existing categories.");
        await tx.favouriteCategory.deleteMany({ where: { userId: user.id } });
        if (input.categoryIds.length)
          await tx.favouriteCategory.createMany({
            data: input.categoryIds.map((categoryId) => ({
              userId: user.id,
              categoryId,
            })),
          });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
    return NextResponse.json(
      { categoryIds: input.categoryIds },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
