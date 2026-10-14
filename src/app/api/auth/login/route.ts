import { loginResponse } from "@/lib/authentication";
import { apiError } from "@/lib/api";
export async function POST(request: Request) {
  try {
    return await loginResponse(request, "USER");
  } catch (error) {
    return apiError(error);
  }
}
