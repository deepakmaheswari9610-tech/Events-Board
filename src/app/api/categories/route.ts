import { NextResponse } from "next/server";
import { listCatalog } from "@/lib/catalogs";
import { apiError } from "@/lib/api";
export async function GET() {
  try {
    return NextResponse.json(
      { categories: await listCatalog("categories") },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
