"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { runAdminMutation } from "@/modules/admin/server/admin-feedback";
import { updateOrderStatus } from "../application/admin-orders";
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
    },
  );
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
