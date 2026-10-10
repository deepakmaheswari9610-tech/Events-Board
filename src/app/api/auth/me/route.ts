import { NextResponse } from "next/server";
import { getVisitor } from "@/lib/auth";
import { ApiError, apiError } from "@/lib/api";
export async function GET(request: Request) {
  try {
    const user = await getVisitor(request);
    if (!user) throw new ApiError(401, "Please sign in to continue.");
    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
