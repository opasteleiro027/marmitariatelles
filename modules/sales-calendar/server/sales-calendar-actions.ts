"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import {
  saveDeliverySlot,
  saveSalesCalendar,
} from "../application/admin-sales-calendar";

export async function saveSalesCalendarAction(formData: FormData) {
  await requireAdmin();
  const capacity = integer(formData, "totalCapacity");
  await saveSalesCalendar({
    id: required(formData, "id"),
    salesDate: required(formData, "salesDate"),
    orderingOpensAt: localDateTime(required(formData, "orderingOpensAt")),
    orderingClosesAt: localDateTime(required(formData, "orderingClosesAt")),
    totalCapacity: capacity,
    published: formData.get("published") === "on",
    closedManually: formData.get("closedManually") === "on",
  });
  refresh();
}

export async function saveDeliverySlotAction(formData: FormData) {
  await requireAdmin();
  const capacity = integer(formData, "capacity");
  if (capacity === null || capacity < 1) {
    throw new Error("A capacidade da faixa precisa ser maior que zero.");
  }
  await saveDeliverySlot({
    id: required(formData, "id"),
    startsAt: required(formData, "startsAt"),
    endsAt: required(formData, "endsAt"),
    capacity,
    active: formData.get("active") === "on",
  });
  refresh();
}

function required(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatório: ${field}`);
  return value;
}

function integer(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Valor inválido: ${field}`);
  }
  return parsed;
}

function localDateTime(value: string) {
  const date = new Date(`${value}:00-03:00`);
  if (Number.isNaN(date.valueOf())) throw new Error("Data e horário inválidos.");
  return date.toISOString();
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}
