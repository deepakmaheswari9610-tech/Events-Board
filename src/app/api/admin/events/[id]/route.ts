import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    if (!(await getAdmin(request)))
      throw new ApiError(401, "Please log in as an admin.");
    const data = z
      .object({ active: z.boolean() })
      .strict()
      .parse(await readJson(request));
    const { id: rawId } = await context.params;
    if (!/^[1-9]\d*$/.test(rawId))
      throw new ApiError(400, "Event ID must be a positive integer.");
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id > 2147483647)
      throw new ApiError(400, "Invalid event ID.");
    const event = await db.event.update({ where: { id }, data });
    return NextResponse.json({
      event: { ...event, price: event.price.toFixed(2) },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      return apiError(new ApiError(404, "Event not found."));
    return apiError(error);
  }
}
