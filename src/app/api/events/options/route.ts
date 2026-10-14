import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { listCatalog } from "@/lib/catalogs";
export async function GET() {
  try {
    const [categories, cities] = await Promise.all([
      listCatalog("categories"),
      listCatalog("cities"),
    ]);
    return NextResponse.json(
      { categories, cities },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
