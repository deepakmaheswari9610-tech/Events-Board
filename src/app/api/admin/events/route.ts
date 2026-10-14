import { Prisma } from "@prisma/client";
import {
  parseAdminQuery,
  adminEventWhere,
  adminEventOrder,
} from "@/lib/admin-events";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
import { requireCatalogEntry, catalogSelect } from "@/lib/catalogs";
import { serializeEvent } from "@/lib/public-events";
import { eventInput } from "@/lib/event-validation";
export async function GET(request: Request) {
  try {
    if (!(await getAdmin(request)))
      throw new ApiError(401, "Please log in as an admin.");
    const query = parseAdminQuery(request.url);
    const data = await db.$transaction(
      async (tx) => {
        const where = adminEventWhere(query);
        const [total, all, active] = await Promise.all([
          tx.event.count({ where }),
          tx.event.count(),
          tx.event.count({ where: { active: true } }),
        ]);
        const totalPages = Math.ceil(total / query.pageSize);
        const page = Math.min(query.page, Math.max(totalPages, 1));
        const events = await tx.event.findMany({
          where,
          orderBy: adminEventOrder(query.sort),
          skip: (page - 1) * query.pageSize,
          take: query.pageSize,
          include: {
            category: { select: catalogSelect },
            city: { select: catalogSelect },
          },
        });
        return {
          events: events.map((event) => ({
            ...serializeEvent(event),
            active: event.active,
          })),
          pagination: { page, pageSize: query.pageSize, total, totalPages },
          stats: { total: all, active, inactive: all - active },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
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
    await requireCatalogEntry("categories", data.categoryId);
    await requireCatalogEntry("cities", data.cityId);
    const event = await db.event.create({
      data: { ...data, startsAt: new Date(data.startsAt), active: true },
      include: {
        category: { select: catalogSelect },
        city: { select: catalogSelect },
      },
    });
    return NextResponse.json(
      { event: { ...serializeEvent(event), active: event.active } },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
