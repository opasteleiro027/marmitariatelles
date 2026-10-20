"use server";

import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { runAdminMutation } from "@/modules/admin/server/admin-feedback";
import { revalidatePath } from "next/cache";
import {
  createCatalogProduct,
  deleteCatalogProduct,
  setProductSoldOut,
  updateCatalogProduct,
  type UploadedProductImage,
} from "../application/catalog-admin";
import {
  createMarmitaOption,
  createMarmitaSize,
  deleteMarmitaOption,
  updateMarmitaOption,
  updateMarmitaSize,
} from "../application/marmita-admin";
import { parsePriceToCents } from "../domain/parse-price";

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Produto adicionado ao cardápio com sucesso.",
    async () => {
      await createCatalogProduct({
        categoryId: required(formData, "categoryId"),
        name: required(formData, "name"),
        description: required(formData, "description"),
        priceInCents: parsePriceToCents(required(formData, "price")),
        image: await productImage(formData),
      });
      refreshCatalog();
    },
  );
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Produto atualizado com sucesso.",
    async () => {
      await updateCatalogProduct({
        id: required(formData, "id"),
        categoryId: required(formData, "categoryId"),
        name: required(formData, "name"),
        description: required(formData, "description"),
        priceInCents: parsePriceToCents(required(formData, "price")),
        active: formData.get("active") === "on",
        image: await productImage(formData),
        removeImage: formData.get("removeImage") === "on",
      });
      refreshCatalog();
    },
  );
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Produto excluído do cardápio com sucesso.",
    async () => {
      const deleted = await deleteCatalogProduct(required(formData, "id"));
      if (!deleted) {
        throw new Error("Produto não encontrado. Atualize a página e tente novamente.");
      }
      refreshCatalog();
    },
  );
}

export async function toggleSoldOutAction(formData: FormData) {
  await requireAdmin();
  const soldOut = formData.get("soldOut") !== "true";
  return runAdminMutation(
    "/admin/cardapio",
    soldOut
      ? "Produto marcado como esgotado."
      : "Produto liberado para pedidos.",
    async () => {
      await setProductSoldOut(required(formData, "id"), soldOut);
      refreshCatalog();
    },
  );
}

export async function createMarmitaSizeAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Tamanho adicionado com sucesso.",
    async () => {
      await createMarmitaSize({
        name: required(formData, "name"),
        description: required(formData, "description"),
        priceInCents: parsePriceToCents(required(formData, "price")),
        proteinLimit: selectionLimit(formData, "proteinLimit", 8),
        sideLimit: selectionLimit(formData, "sideLimit", 6),
      });
      refreshCatalog();
    },
  );
}

export async function updateMarmitaSizeAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Tamanho atualizado com sucesso.",
    async () => {
      await updateMarmitaSize({
        id: required(formData, "id"),
        name: required(formData, "name"),
        description: required(formData, "description"),
        priceInCents: parsePriceToCents(required(formData, "price")),
        proteinLimit: selectionLimit(formData, "proteinLimit", 8),
        sideLimit: selectionLimit(formData, "sideLimit", 6),
        active: formData.get("active") === "on",
        soldOut: formData.get("soldOut") === "on",
      });
      refreshCatalog();
    },
  );
}

export async function deleteMarmitaSizeAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Tamanho excluído com sucesso.",
    async () => {
      const deleted = await deleteCatalogProduct(required(formData, "id"));
      if (!deleted) {
        throw new Error("Tamanho não encontrado. Atualize a página e tente novamente.");
      }
      refreshCatalog();
    },
  );
}

export async function createMarmitaOptionAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Ingrediente adicionado com sucesso.",
    async () => {
      await createMarmitaOption({
        groupId: required(formData, "groupId"),
        name: required(formData, "name"),
        additionalPriceInCents: parsePriceToCents(
          String(formData.get("additionalPrice") ?? "0"),
        ),
      });
      refreshCatalog();
    },
  );
}

export async function updateMarmitaOptionAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Ingrediente atualizado com sucesso.",
    async () => {
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
    },
  );
}

export async function deleteMarmitaOptionAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/cardapio",
    "Ingrediente excluído com sucesso.",
    async () => {
      const deleted = await deleteMarmitaOption(required(formData, "id"));
      if (!deleted) {
        throw new Error("Ingrediente não encontrado. Atualize a página e tente novamente.");
      }
      refreshCatalog();
    },
  );
}

function required(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatório: ${field}`);
  return value;
}

async function productImage(
  formData: FormData,
): Promise<UploadedProductImage | null> {
  const value = formData.get("image");
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > 4 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 4 MB.");
  }

  const contentType = value.type;
  if (
    contentType !== "image/jpeg" &&
    contentType !== "image/png" &&
    contentType !== "image/webp"
  ) {
    throw new Error("Use uma imagem JPG, PNG ou WebP.");
  }

  const data = Buffer.from(await value.arrayBuffer());
  const isJpeg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const isPng = data.subarray(0, 8).equals(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  const isWebp =
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP";
  if (
    !(contentType === "image/jpeg" && isJpeg) &&
    !(contentType === "image/png" && isPng) &&
    !(contentType === "image/webp" && isWebp)
  ) {
    throw new Error("O arquivo não parece ser uma imagem válida.");
  }

  return {
    data,
    contentType: contentType as UploadedProductImage["contentType"],
  };
}

function selectionLimit(formData: FormData, field: string, maximum: number) {
  const value = Number(required(formData, field));
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`Limite inválido: ${field}`);
  }
  return value;
}

function refreshCatalog() {
  revalidatePath("/");
  revalidatePath("/cardapio");
  revalidatePath("/admin");
  revalidatePath("/admin/cardapio");
}
