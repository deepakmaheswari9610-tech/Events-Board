import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  createAdminToken,
  createVisitorToken,
  SESSION_COOKIE,
  VISITOR_COOKIE,
  cookieOptions,
} from "@/lib/auth";
import { ApiError, checkOrigin, readJson } from "@/lib/api";
import { loginInput } from "@/lib/visitor-validation";
const dummyHash = hashPassword("dummy-password-for-timing");
export async function loginResponse(request: Request, role: "ADMIN" | "USER") {
  checkOrigin(request);
  const credentials = loginInput.parse(await readJson(request));
  const user = await db.user.findUnique({
    where: { email: credentials.email },
  });
  const valid = await verifyPassword(
    credentials.password,
    user?.passwordHash ?? (await dummyHash),
  );
  if (!user || !valid || user.role !== role)
    throw new ApiError(
      401,
      role === "ADMIN"
        ? "Invalid admin email or password."
        : "Invalid email or password.",
    );
  const token = await (role === "ADMIN"
    ? createAdminToken(user.id)
    : createVisitorToken(user.id));
  const response = NextResponse.json(
    { token, user: { id: user.id, email: user.email, role: user.role } },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(
    role === "ADMIN" ? SESSION_COOKIE : VISITOR_COOKIE,
    token,
    cookieOptions(),
  );
  return response;
}
export function logoutResponse(request: Request, role: "ADMIN" | "USER") {
  checkOrigin(request);
  const response = NextResponse.json({ success: true });
  response.cookies.set(role === "ADMIN" ? SESSION_COOKIE : VISITOR_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
  return response;
}
