import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, checkOrigin, readJson } from "@/lib/api";
import { eventOwner } from "@/lib/event-owner";
import { defaultDesign, designInput } from "@/lib/card-design";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    const owner = await eventOwner(request, params);
    const saved = await db.cardDesign.findUnique({
      where: { userId_eventId: owner },
    });
    const design = saved
      ? designInput.parse({ theme: saved.theme, stickers: saved.stickers })
      : defaultDesign;
    return NextResponse.json(
      { design },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: Request, { params }: Context) {
  try {
    checkOrigin(request);
    const owner = await eventOwner(request, params);
    const design = designInput.parse(await readJson(request));
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${owner.userId} FOR UPDATE`;
      await tx.cardDesign.upsert({
        where: { userId_eventId: owner },
        create: { ...owner, ...design },
        update: design,
      });
    });
    return NextResponse.json(
      { design },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
