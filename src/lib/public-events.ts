import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { categories } from "@/lib/event-validation";
export const eventSelect = {
  id: true,
  title: true,
  category: true,
  city: true,
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
  category: z.enum(categories).optional(),
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
      ["category", "city", "q", "page", "pageSize"].map((key) => [
        key,
        params.get(key)?.trim() || undefined,
      ]),
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
    ...(query.category ? { category: query.category } : {}),
    ...(query.city ? { city: query.city } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { city: { contains: search } },
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
    price: event.price.toFixed(2),
    startsAt: event.startsAt.toISOString(),
  };
}
