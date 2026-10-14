import { NextResponse } from "next/server";
import { listCatalog } from "@/lib/catalogs";
import { apiError } from "@/lib/api";
export async function GET() {
  try {
    return NextResponse.json(
      { cities: await listCatalog("cities") },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
