import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createVisitorToken, VISITOR_COOKIE, cookieOptions } from "@/lib/auth";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
import { loginInput } from "@/lib/visitor-validation";
const dummyHash = hashPassword("dummy-visitor-password-for-timing");
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const input = loginInput.parse(await readJson(request));
    const user = await db.user.findUnique({ where: { email: input.email } });
    const valid = await verifyPassword(
      input.password,
      user?.passwordHash ?? (await dummyHash),
    );
    if (!user || !valid || user.role !== "USER")
      throw new ApiError(401, "Invalid email or password.");
    const token = await createVisitorToken(user.id);
    const response = NextResponse.json(
      { token, user: { id: user.id, email: user.email, role: user.role } },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(VISITOR_COOKIE, token, cookieOptions());
    return response;
  } catch (error) {
    return apiError(error);
  }
}
