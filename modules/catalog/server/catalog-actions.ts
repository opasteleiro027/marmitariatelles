"use server";

import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { revalidatePath } from "next/cache";
import {
  createCatalogProduct,
  setProductSoldOut,
  updateCatalogProduct,
} from "../application/catalog-admin";
import { parsePriceToCents } from "../domain/parse-price";

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  await createCatalogProduct({
    categoryId: required(formData, "categoryId"),
    name: required(formData, "name"),
    description: required(formData, "description"),
    priceInCents: parsePriceToCents(required(formData, "price")),
  });
  refreshCatalog();
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  await updateCatalogProduct({
    id: required(formData, "id"),
    categoryId: required(formData, "categoryId"),
    name: required(formData, "name"),
    description: required(formData, "description"),
    priceInCents: parsePriceToCents(required(formData, "price")),
    active: formData.get("active") === "on",
  });
  refreshCatalog();
}

export async function toggleSoldOutAction(formData: FormData) {
  await requireAdmin();
  await setProductSoldOut(
    required(formData, "id"),
    formData.get("soldOut") !== "true",
  );
  refreshCatalog();
}

function required(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatório: ${field}`);
  return value;
}

function refreshCatalog() {
  revalidatePath("/");
  revalidatePath("/admin");
}
