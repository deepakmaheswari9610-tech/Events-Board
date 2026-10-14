import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireCatalogEntry, catalogSelect } from "@/lib/catalogs";
import { serializeEvent } from "@/lib/public-events";
import { eventUpdateInput } from "@/lib/event-validation";
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
    const input = eventUpdateInput.parse(await readJson(request));
    const { id: rawId } = await context.params;
    if (!/^[1-9]\d*$/.test(rawId))
      throw new ApiError(400, "Event ID must be a positive integer.");
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id > 2147483647)
      throw new ApiError(400, "Invalid event ID.");
    const data =
      "startsAt" in input
        ? { ...input, startsAt: new Date(input.startsAt) }
        : input;
    if ("categoryId" in input)
      await requireCatalogEntry("categories", input.categoryId);
    if ("cityId" in input) await requireCatalogEntry("cities", input.cityId);
    const event = await db.event.update({
      where: { id },
      data,
      include: {
        category: { select: catalogSelect },
        city: { select: catalogSelect },
      },
    });
    return NextResponse.json({
      event: { ...serializeEvent(event), active: event.active },
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
