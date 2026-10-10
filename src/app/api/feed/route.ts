import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getVisitor } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, apiError } from "@/lib/api";
import {
  parseEventQuery,
  eventSelect,
  serializeEvent,
} from "@/lib/public-events";
export async function GET(request: Request) {
  try {
    const user = await getVisitor(request);
    if (!user) throw new ApiError(401, "Please sign in to see your feed.");
    const params = new URL(request.url).searchParams;
    const pageQuery = new URL("http://localhost/feed");
    for (const key of ["page", "pageSize"])
      if (params.has(key)) pageQuery.searchParams.set(key, params.get(key)!);
    const query = parseEventQuery(pageQuery.toString());
    const now = new Date();
    const result = await db.$transaction(
      async (tx) => {
        const favourites = await tx.favouriteCategory.findMany({
          where: { userId: user.id },
          orderBy: { category: "asc" },
        });
        const categories = favourites.map((value) => value.category);
        const where = {
          active: true,
          startsAt: { gte: now },
          category: { in: categories },
        };
        const total = await tx.event.count({ where });
        const totalPages = Math.ceil(total / query.pageSize);
        const page = Math.min(query.page, Math.max(1, totalPages));
        const events = await tx.event.findMany({
          where,
          select: eventSelect,
          orderBy: [{ startsAt: "asc" }, { id: "asc" }],
          skip: (page - 1) * query.pageSize,
          take: query.pageSize,
        });
        return {
          categories,
          events: events.map(serializeEvent),
          pagination: { page, pageSize: query.pageSize, total, totalPages },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
