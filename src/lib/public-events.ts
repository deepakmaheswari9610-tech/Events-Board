import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const eventSelect = {
  id: true,
  title: true,
  category: { select: { id: true, name: true } },
  categoryId: true,
  city: { select: { id: true, name: true } },
  cityId: true,
  startsAt: true,
  price: true,
  description: true,
  imageUrl: true,
} satisfies Prisma.EventSelect;
const positiveInteger = (maximum: number) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Use a positive whole number for pagination.")
    .transform(Number)
    .refine(
      (value) => Number.isSafeInteger(value) && value <= maximum,
      "Pagination value is too large.",
    );
const filters = z.object({
  categoryId: positiveInteger(2147483647).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  cityId: positiveInteger(2147483647).optional(),
  city: z.string().trim().max(100).optional(),
  q: z
    .string()
    .trim()
    .max(200, "Keep your search under 200 characters.")
    .optional(),
  page: positiveInteger(1000000).default(1),
  pageSize: positiveInteger(50).default(6),
});
export function parseEventQuery(url: string) {
  const params = new URL(url).searchParams;
  return filters.parse(
    Object.fromEntries(
      ["categoryId", "category", "cityId", "city", "q", "page", "pageSize"].map(
        (key) => [key, params.get(key)?.trim() || undefined],
      ),
    ),
  );
}
export function eventWhere(
  query: ReturnType<typeof parseEventQuery>,
  now: Date,
): Prisma.EventWhereInput {
  const search = query.q?.replace(/[\\%_]/g, "\\$&");
  return {
    active: true,
    startsAt: { gte: now },
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.category ? { category: { name: query.category } } : {}),
    ...(query.cityId ? { cityId: query.cityId } : {}),
    ...(query.city ? { city: { name: query.city } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { city: { name: { contains: search } } },
          ],
        }
      : {}),
  };
}
export function serializeEvent(
  event: Prisma.EventGetPayload<{ select: typeof eventSelect }>,
) {
  return {
    ...event,
    category: event.category.name,
    city: event.city.name,
    price: event.price.toFixed(2),
    startsAt: event.startsAt.toISOString(),
  };
}
