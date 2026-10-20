"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { runAdminMutation } from "@/modules/admin/server/admin-feedback";
import {
  closeCashRegister,
  openCashRegister,
  recordCashMovement,
} from "../application/cash-register";

const PATH = "/admin/caixa";

export async function openCashRegisterAction(formData: FormData) {
  const admin = await requireAdmin();
  return runAdminMutation(PATH, "Caixa aberto com sucesso.", async () => {
    await openCashRegister(
      parseMoney(String(formData.get("openingFloat") ?? "")),
      admin.email,
      String(formData.get("notes") ?? ""),
    );
    revalidatePath(PATH);
  });
}

export async function registerCashMovementAction(formData: FormData) {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "cash_in" && kind !== "cash_out") {
    throw new Error("Tipo de movimentação inválido.");
  }
  return runAdminMutation(
    PATH,
    kind === "cash_in" ? "Suprimento registrado com sucesso." : "Sangria registrada com sucesso.",
    async () => {
      await recordCashMovement({
        kind,
        amountInCents: parseMoney(String(formData.get("amount") ?? "")),
        description: String(formData.get("description") ?? ""),
        adminEmail: admin.email,
      });
      revalidatePath(PATH);
    },
  );
}

export async function closeCashRegisterAction(formData: FormData) {
  const admin = await requireAdmin();
  return runAdminMutation(PATH, "Caixa fechado. O relatório do expediente está disponível no histórico.", async () => {
    await closeCashRegister(
      parseMoney(String(formData.get("countedCash") ?? "")),
      admin.email,
      String(formData.get("notes") ?? ""),
    );
    revalidatePath(PATH);
  });
}

function parseMoney(value: string) {
  const normalized = value
    .trim()
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    throw new Error("Informe um valor válido.");
  }
  return Math.round(amount * 100);
}
