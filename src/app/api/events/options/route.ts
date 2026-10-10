import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { categories } from "@/lib/event-validation";
export async function GET() {
  try {
    const cities = await db.event.findMany({
      where: { active: true, startsAt: { gte: new Date() } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });
    return NextResponse.json(
      { categories, cities: cities.map((event) => event.city) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
