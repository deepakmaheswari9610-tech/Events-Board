import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
import { eventInput } from "@/lib/event-validation";
export async function GET(request: Request) {
  try {
    if (!(await getAdmin(request)))
      throw new ApiError(401, "Please log in as an admin.");
    const events = await db.event.findMany({
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(
      {
        events: events.map((event) => ({
          ...event,
          price: event.price.toFixed(2),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!(await getAdmin(request)))
      throw new ApiError(401, "Please log in as an admin.");
    const data = eventInput.parse(await readJson(request));
    const event = await db.event.create({
      data: { ...data, startsAt: new Date(data.startsAt), active: true },
    });
    return NextResponse.json(
      { event: { ...event, price: event.price.toFixed(2) } },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
