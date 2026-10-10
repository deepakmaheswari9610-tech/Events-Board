import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createAdminToken, SESSION_COOKIE, cookieOptions } from "@/lib/auth";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
const input = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(256),
  })
  .strict();
const dummyHash = hashPassword("dummy-password-for-timing");
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const credentials = input.parse(await readJson(request));
    const user = await db.user.findUnique({
      where: { email: credentials.email },
    });
    const valid = await verifyPassword(
      credentials.password,
      user?.passwordHash ?? (await dummyHash),
    );
    if (!user || !valid || user.role !== "ADMIN")
      throw new ApiError(401, "Invalid admin email or password.");
    const token = await createAdminToken(user.id);
    const response = NextResponse.json(
      { token, user: { id: user.id, email: user.email, role: user.role } },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return response;
  } catch (error) {
    return apiError(error);
  }
}
