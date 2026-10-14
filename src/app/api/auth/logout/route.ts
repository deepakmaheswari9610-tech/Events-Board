import { logoutResponse } from "@/lib/authentication";
import { apiError } from "@/lib/api";
export async function POST(request: Request) {
  try {
    return await logoutResponse(request, "USER");
  } catch (error) {
    return apiError(error);
  }
}
