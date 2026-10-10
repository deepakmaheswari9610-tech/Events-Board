import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createVisitorToken, VISITOR_COOKIE, cookieOptions } from "@/lib/auth";
import { ApiError, apiError, checkOrigin, readJson } from "@/lib/api";
import { signupInput } from "@/lib/visitor-validation";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const input = signupInput.parse(await readJson(request));
    const passwordHash = await hashPassword(input.password);
    const { user, token } = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: input.email, passwordHash, role: "USER" },
        select: { id: true, email: true, role: true },
      });
      const token = await createVisitorToken(user.id);
      return { user, token };
    });
    const response = NextResponse.json(
      { token, user },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(VISITOR_COOKIE, token, cookieOptions());
    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return apiError(
        new ApiError(409, "This email is already registered. Try signing in."),
      );
    return apiError(error);
  }
}
