"use server";

import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { revalidatePath } from "next/cache";
import {
  createCatalogProduct,
  setProductSoldOut,
  updateCatalogProduct,
} from "../application/catalog-admin";
import {
  MARMITA_GROUP_ROLES,
  createMarmitaOption,
  createMarmitaSize,
  updateMarmitaOption,
  updateMarmitaSize,
  type MarmitaGroupRole,
} from "../application/marmita-admin";
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

export async function createMarmitaSizeAction(formData: FormData) {
  await requireAdmin();
  await createMarmitaSize({
    name: required(formData, "name"),
    description: required(formData, "description"),
    priceInCents: parsePriceToCents(required(formData, "price")),
    proteinLimit: selectionLimit(formData, "proteinLimit", 2),
    sideLimit: selectionLimit(formData, "sideLimit", 6),
  });
  refreshCatalog();
}

export async function updateMarmitaSizeAction(formData: FormData) {
  await requireAdmin();
  await updateMarmitaSize({
    id: required(formData, "id"),
    name: required(formData, "name"),
    description: required(formData, "description"),
    priceInCents: parsePriceToCents(required(formData, "price")),
    proteinLimit: selectionLimit(formData, "proteinLimit", 2),
    sideLimit: selectionLimit(formData, "sideLimit", 6),
    active: formData.get("active") === "on",
    soldOut: formData.get("soldOut") === "on",
  });
  refreshCatalog();
}

export async function createMarmitaOptionAction(formData: FormData) {
  await requireAdmin();
  await createMarmitaOption({
    role: builderRole(formData),
    name: required(formData, "name"),
    additionalPriceInCents: parsePriceToCents(
      String(formData.get("additionalPrice") ?? "0"),
    ),
  });
  refreshCatalog();
}

export async function updateMarmitaOptionAction(formData: FormData) {
  await requireAdmin();
  await updateMarmitaOption({
    id: required(formData, "id"),
    name: required(formData, "name"),
    additionalPriceInCents: parsePriceToCents(
      String(formData.get("additionalPrice") ?? "0"),
    ),
    active: formData.get("active") === "on",
    soldOut: formData.get("soldOut") === "on",
  });
  refreshCatalog();
}

function required(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatório: ${field}`);
  return value;
}

function selectionLimit(formData: FormData, field: string, maximum: number) {
  const value = Number(required(formData, field));
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`Limite inválido: ${field}`);
  }
  return value;
}

function builderRole(formData: FormData): MarmitaGroupRole {
  const value = required(formData, "role");
  if (!MARMITA_GROUP_ROLES.includes(value as MarmitaGroupRole)) {
    throw new Error("Etapa da marmita inválida.");
  }
  return value as MarmitaGroupRole;
}

function refreshCatalog() {
  revalidatePath("/");
  revalidatePath("/cardapio");
  revalidatePath("/admin");
  revalidatePath("/admin/cardapio");
}
