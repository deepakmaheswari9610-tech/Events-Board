import "server-only";
import { getVisitor } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
export async function eventOwner(
  request: Request,
  params: Promise<{ id: string }>,
) {
  const user = await getVisitor(request);
  if (!user) throw new ApiError(401, "Please sign in to save your choices.");
  const { id } = await params;
  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id)) ||
    Number(id) > 2147483647
  )
    throw new ApiError(400, "Event ID must be a positive integer.");
  const eventId = Number(id);
  const event = await db.event.findFirst({
    where: { id: eventId, active: true, startsAt: { gte: new Date() } },
    select: { id: true },
  });
  if (!event) throw new ApiError(404, "This event is no longer available.");
  return { userId: user.id, eventId };
}
