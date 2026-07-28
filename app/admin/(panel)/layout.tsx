import type { ReactNode } from "react";
import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { AdminShell } from "@/modules/admin/ui/admin-shell/AdminShell";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();
  return <AdminShell userName={user.email}>{children}</AdminShell>;
}
