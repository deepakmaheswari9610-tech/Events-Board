import { NextResponse } from "next/server";
import { z } from "zod";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new ApiError(403, "This request is not allowed.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Send a JSON request.");
  const body = await request.text();
  if (body.length > 32768) throw new ApiError(413, "Request is too large.");
  try {
    return JSON.parse(body);
  } catch {
    throw new ApiError(400, "Invalid JSON.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof z.ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  console.error("Admin API failed", error);
  return NextResponse.json(
    { error: "The service is unavailable. Please try again." },
    { status: 503 },
  );
}
