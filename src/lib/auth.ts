import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";
export const SESSION_COOKIE = "board_admin_session";
export const SESSION_SECONDS = 60 * 60 * 8;
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32 || value.startsWith("replace-this-"))
    throw new Error(
      "Set JWT_SECRET to a unique random value of at least 32 characters",
    );
  return new TextEncoder().encode(value);
}
export async function createAdminToken(userId: number) {
  return new SignJWT({ role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuer("community-board")
    .setAudience("community-board-admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());
}
export async function getAdmin(request?: Request) {
  const authorization = request?.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let id: number;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "community-board",
      audience: "community-board-admin",
    });
    if (!payload.sub || payload.role !== "ADMIN") return null;
    if (!/^[1-9]\d*$/.test(payload.sub)) return null;
    id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id > 2147483647) return null;
  } catch {
    return null;
  }
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  return user?.role === "ADMIN" ? user : null;
}
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}
