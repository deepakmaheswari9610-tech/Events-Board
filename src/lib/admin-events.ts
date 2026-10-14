import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { parseEventQuery } from "@/lib/public-events";
export const adminSortOptions = [
  "date-asc",
  "date-desc",
  "title-asc",
  "price-asc",
  "price-desc",
] as const;
export function parseAdminQuery(url: string) {
  const params = new URL(url).searchParams;
  const parsedUrl = new URL(url);
  if (!parsedUrl.searchParams.has("pageSize"))
    parsedUrl.searchParams.set("pageSize", "10");
  const { page, pageSize } = parseEventQuery(parsedUrl.toString());
  return z
    .object({
      page: z.number(),
      pageSize: z.number(),
      q: z.string().trim().max(200).default(""),
      status: z.enum(["all", "active", "inactive"]).default("all"),
      sort: z.enum(adminSortOptions).default("date-asc"),
    })
    .parse({
      page,
      pageSize,
      q: params.get("q") ?? "",
      status: params.get("status") ?? undefined,
      sort: params.get("sort") ?? undefined,
    });
}
export function adminEventWhere(
  query: ReturnType<typeof parseAdminQuery>,
): Prisma.EventWhereInput {
  const q = query.q.replace(/[\\%_]/g, "\\$&");
  return {
    ...(query.status === "all" ? {} : { active: query.status === "active" }),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { city: { name: { contains: q } } },
            { category: { name: { contains: q } } },
          ],
        }
      : {}),
  };
}
export function adminEventOrder(
  sort: ReturnType<typeof parseAdminQuery>["sort"],
): Prisma.EventOrderByWithRelationInput[] {
  const order: Prisma.EventOrderByWithRelationInput =
    sort === "title-asc"
      ? { title: "asc" }
      : sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { startsAt: sort === "date-desc" ? "desc" : "asc" };
  return [order, { id: "asc" }];
}
