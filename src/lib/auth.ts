import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";
export const SESSION_COOKIE = "board_admin_session";
export const VISITOR_COOKIE = "board_visitor_session";
export const SESSION_SECONDS = 60 * 60 * 8;
type SessionRole = "ADMIN" | "USER";
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32 || value.startsWith("replace-this-"))
    throw new Error(
      "Set JWT_SECRET to a unique random value of at least 32 characters",
    );
  return new TextEncoder().encode(value);
}
function audience(role: SessionRole) {
  return role === "ADMIN" ? "community-board-admin" : "community-board-visitor";
}
async function createToken(userId: number, role: SessionRole) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuer("community-board")
    .setAudience(audience(role))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());
}
export function createAdminToken(userId: number) {
  return createToken(userId, "ADMIN");
}
export function createVisitorToken(userId: number) {
  return createToken(userId, "USER");
}
async function getIdentity(role: SessionRole, request?: Request) {
  const authorization = request?.headers.get("authorization");
  const cookie = role === "ADMIN" ? SESSION_COOKIE : VISITOR_COOKIE;
  // A provided Authorization header is authoritative; never fall back to cookies on invalid bearer credentials.
  const token = authorization
    ? authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : null
    : (await cookies()).get(cookie)?.value;
  if (!token) return null;
  let id: number;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "community-board",
      audience: audience(role),
    });
    if (
      !payload.sub ||
      payload.role !== role ||
      !/^[1-9]\d*$/.test(payload.sub)
    )
      return null;
    id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id > 2147483647) return null;
  } catch {
    return null;
  }
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  return user?.role === role ? user : null;
}
export function getAdmin(request?: Request) {
  return getIdentity("ADMIN", request);
}
export function getVisitor(request?: Request) {
  return getIdentity("USER", request);
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
