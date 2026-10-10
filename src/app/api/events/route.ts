import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import {
  eventSelect,
  eventWhere,
  parseEventQuery,
  serializeEvent,
} from "@/lib/public-events";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const query = parseEventQuery(request.url);
    const where = eventWhere(query, new Date());
    const result = await db.$transaction(
      async (tx) => {
        const total = await tx.event.count({ where });
        const totalPages = Math.ceil(total / query.pageSize);
        const page = Math.min(query.page, Math.max(1, totalPages));
        const events = await tx.event.findMany({
          where,
          orderBy: [{ startsAt: "asc" }, { id: "asc" }],
          select: eventSelect,
          skip: (page - 1) * query.pageSize,
          take: query.pageSize,
        });
        return {
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
