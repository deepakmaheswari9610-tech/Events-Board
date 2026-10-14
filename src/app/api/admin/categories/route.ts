import { createCatalogResponse } from "@/lib/catalogs";
import { apiError } from "@/lib/api";
export async function POST(request: Request) {
  try {
    return await createCatalogResponse(request, "categories");
  } catch (error) {
    return apiError(error);
  }
}
