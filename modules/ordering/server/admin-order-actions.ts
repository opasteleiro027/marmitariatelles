"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { adminActionErrorMessage } from "@/modules/admin/domain/admin-feedback";
import { runAdminMutation } from "@/modules/admin/server/admin-feedback";
import { updateOrderStatus } from "../application/admin-orders";
import {
  addTableConsumption,
  closeTableTab,
} from "../application/table-tabs";
import { resetTestOrderHistory } from "../application/test-order-history-reset/reset-test-order-history";

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  return runAdminMutation(
    "/admin/pedidos",
    "Status do pedido atualizado com sucesso.",
    async () => {
      await updateOrderStatus(
        String(formData.get("orderId") ?? ""),
        String(formData.get("status") ?? ""),
        admin.email,
      );
      revalidatePath("/admin");
      revalidatePath("/admin/pedidos");
      revalidatePath("/admin/comandas-mesa");
    },
  );
}

export type UpdateOrderStatusResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function updateOrderStatusInlineAction(
  orderId: string,
  status: string,
): Promise<UpdateOrderStatusResult> {
  const admin = await requireAdmin();

  try {
    await updateOrderStatus(orderId, status, admin.email);
    revalidatePath("/admin");
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin/comandas-mesa");

    return {
      ok: true,
      message: "Status do pedido atualizado com sucesso.",
    };
  } catch (reason) {
    return {
      ok: false,
      message: adminActionErrorMessage(reason),
    };
  }
}

export async function addTableConsumptionInlineAction(input: {
  orderId: string;
  name: string;
  quantity: number;
  unitPriceInCents: number;
  notes: string | null;
}): Promise<UpdateOrderStatusResult> {
  await requireAdmin();
  try {
    await addTableConsumption(input);
    revalidatePath("/admin");
    revalidatePath("/admin/comandas-mesa");
    return { ok: true, message: "Novo consumo adicionado à comanda." };
  } catch (reason) {
    return { ok: false, message: adminActionErrorMessage(reason) };
  }
}

export async function closeTableTabInlineAction(
  orderId: string,
): Promise<UpdateOrderStatusResult> {
  const admin = await requireAdmin();
  try {
    await closeTableTab(orderId, admin.email);
    revalidatePath("/admin");
    revalidatePath("/admin/comandas-mesa");
    return { ok: true, message: "Pagamento confirmado e comanda fechada." };
  } catch (reason) {
    return { ok: false, message: adminActionErrorMessage(reason) };
  }
}

export async function resetTestOrderHistoryAction(formData: FormData) {
  await requireAdmin();
  return runAdminMutation(
    "/admin/pedidos",
    "Histórico de pedidos de teste excluído com sucesso.",
    async () => {
      await resetTestOrderHistory(String(formData.get("confirmation") ?? ""));
      revalidatePath("/admin");
      revalidatePath("/admin/pedidos");
    },
  );
}
