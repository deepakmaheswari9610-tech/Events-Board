/** Browser JSON transport. Authentication redirects and UI state belong to callers. */
export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readApiResponse<T>(
  response: Response,
  fallback = "Please try again.",
): Promise<T> {
  const data = await response.json().catch(() => {
    throw new ClientApiError(response.status, fallback);
  });
  if (!response.ok)
    throw new ClientApiError(
      response.status,
      typeof data?.error === "string" ? data.error : fallback,
    );
  return data as T;
}
export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  fallback?: string,
): Promise<T> {
  return readApiResponse<T>(
    await fetch(url, { cache: "no-store", ...options }),
    fallback,
  );
}
export function jsonBody(
  value: unknown,
): Pick<RequestInit, "headers" | "body"> {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  };
}
