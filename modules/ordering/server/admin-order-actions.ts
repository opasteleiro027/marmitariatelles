"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { updateOrderStatus } from "../application/admin-orders";

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  await updateOrderStatus(
    String(formData.get("orderId") ?? ""),
    String(formData.get("status") ?? ""),
    admin.email,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}
