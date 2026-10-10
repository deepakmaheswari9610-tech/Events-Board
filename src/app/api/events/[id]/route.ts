import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiError, apiError } from "@/lib/api";
import { eventSelect, serializeEvent } from "@/lib/public-events";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (
      !/^[1-9]\d*$/.test(id) ||
      !Number.isSafeInteger(Number(id)) ||
      Number(id) > 2147483647
    )
      throw new ApiError(400, "Event ID must be a positive integer.");
    const event = await db.event.findFirst({
      where: { id: Number(id), active: true, startsAt: { gte: new Date() } },
      select: eventSelect,
    });
    if (!event) throw new ApiError(404, "This event is no longer available.");
    return NextResponse.json(
      { event: serializeEvent(event) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
