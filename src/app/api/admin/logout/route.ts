import { NextResponse } from "next/server";
import { SESSION_COOKIE, cookieOptions } from "@/lib/auth";
import { apiError, checkOrigin } from "@/lib/api";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
