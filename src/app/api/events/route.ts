import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const events = await db.event.findMany({
      where: { active: true, startsAt: { gte: new Date() } },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      select: { id: true, title: true, category: true, city: true, startsAt: true, price: true, description: true, imageUrl: true },
    });
    return NextResponse.json({ events: events.map(event => ({ ...event, price: event.price.toFixed(2), startsAt: event.startsAt.toISOString() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Events query failed", error);
    return NextResponse.json({ error: "Events are unavailable right now. Please try again shortly." }, { status: 503 });
  }
}
