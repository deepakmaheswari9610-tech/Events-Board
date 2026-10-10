import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, readJson } from "@/lib/api";
import { eventOwner } from "@/lib/event-owner";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    const owner = await eventOwner(request, params);
    const reminder = await db.reminder.findUnique({
      where: { userId_eventId: owner },
    });
    return NextResponse.json(
      { reminded: !!reminder },
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
    const { reminded } = z
      .object({ reminded: z.boolean() })
      .strict()
      .parse(await readJson(request));
    if (reminded)
      await db.reminder.createMany({ data: [owner], skipDuplicates: true });
    else await db.reminder.deleteMany({ where: owner });
    return NextResponse.json(
      { reminded },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
