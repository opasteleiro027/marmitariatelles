"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { parsePriceToCents } from "@/modules/catalog/domain/parse-price";
import {
  createDeliveryArea,
  saveBusinessSettings,
  setOrdersPaused,
  updateDeliveryArea,
} from "../application/admin-establishment";

export async function saveBusinessSettingsAction(formData: FormData) {
  await requireAdmin();
  await saveBusinessSettings({
    businessName: required(formData, "businessName"),
    whatsapp: required(formData, "whatsapp").replace(/\D/g, ""),
    phone: required(formData, "phone"),
    address: required(formData, "address"),
    welcomeMessage: required(formData, "welcomeMessage"),
    minimumOrderInCents: parsePriceToCents(
      required(formData, "minimumOrder"),
    ),
    ordersPaused: formData.get("ordersPaused") === "on",
  });
  refresh();
}

export async function toggleOrdersPausedAction(formData: FormData) {
  await requireAdmin();
  await setOrdersPaused(formData.get("paused") !== "true");
  refresh();
}

export async function createDeliveryAreaAction(formData: FormData) {
  await requireAdmin();
  await createDeliveryArea({
    city: required(formData, "city"),
    neighborhood: required(formData, "neighborhood"),
    deliveryFeeInCents: parsePriceToCents(required(formData, "deliveryFee")),
    minimumOrderInCents: parsePriceToCents(
      String(formData.get("minimumOrder") ?? "0"),
    ),
    estimatedMinutes: optionalPositiveInteger(formData, "estimatedMinutes"),
  });
  refresh();
}

export async function updateDeliveryAreaAction(formData: FormData) {
  await requireAdmin();
  await updateDeliveryArea({
    id: required(formData, "id"),
    city: required(formData, "city"),
    neighborhood: required(formData, "neighborhood"),
    deliveryFeeInCents: parsePriceToCents(required(formData, "deliveryFee")),
    minimumOrderInCents: parsePriceToCents(
      String(formData.get("minimumOrder") ?? "0"),
    ),
    estimatedMinutes: optionalPositiveInteger(formData, "estimatedMinutes"),
    active: formData.get("active") === "on",
  });
  refresh();
}

function required(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatório: ${field}`);
  return value;
}

function optionalPositiveInteger(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1440) {
    throw new Error("Prazo estimado inválido.");
  }
  return parsed;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}
