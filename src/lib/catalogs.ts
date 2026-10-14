import "server-only";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { ApiError, checkOrigin, readJson } from "@/lib/api";
import { catalogNameInput } from "@/lib/catalog-validation";
import type { CatalogResource } from "@/lib/types";
export const catalogSelect = { id: true, name: true } as const;
export function listCatalog(resource: CatalogResource) {
  const query = { select: catalogSelect, orderBy: { name: "asc" as const } };
  return resource === "categories"
    ? db.category.findMany(query)
    : db.city.findMany(query);
}
export async function requireCatalogEntry(
  resource: CatalogResource,
  id: number,
) {
  const query = { where: { id }, select: { id: true } };
  const found =
    resource === "categories"
      ? await db.category.findUnique(query)
      : await db.city.findUnique(query);
  if (!found)
    throw new ApiError(
      400,
      `Choose an existing ${resource === "categories" ? "category" : "city"}.`,
    );
}
export async function createCatalogResponse(
  request: Request,
  resource: CatalogResource,
) {
  checkOrigin(request);
  if (!(await getAdmin(request)))
    throw new ApiError(401, "Please log in as an admin.");
  const data = catalogNameInput.parse(await readJson(request));
  const singular = resource === "categories" ? "category" : "city";
  try {
    const query = { data, select: catalogSelect };
    const entry =
      resource === "categories"
        ? await db.category.create(query)
        : await db.city.create(query);
    return NextResponse.json({ [singular]: entry }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new ApiError(
        409,
        `That ${singular} already exists. Select it from the list.`,
      );
    throw error;
  }
}
