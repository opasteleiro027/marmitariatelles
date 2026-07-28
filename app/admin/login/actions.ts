"use server";

import { authenticateAdmin } from "@/modules/admin-auth/server/admin-session";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const authenticated = await authenticateAdmin(email, password);
  if (!authenticated) redirect("/admin/login?error=1");
  redirect("/admin");
}
