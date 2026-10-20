import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { clearAdminSession } from "@/modules/admin-auth/server/admin-session";
import { BrandLogo } from "@/modules/brand/ui/brand-logo/BrandLogo";
import { AdminOrderMonitor } from "@/modules/ordering/ui/admin-order-monitor/AdminOrderMonitor";
import { AdminFeedbackToast } from "../admin-feedback-toast/AdminFeedbackToast";
import { AdminNavigation } from "../admin-navigation/AdminNavigation";
import styles from "./admin-shell.module.css";

async function logoutAction() {
  "use server";
  await clearAdminSession();
  redirect("/admin/login");
}

export function AdminShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  return (
    <main className={styles.shell}>
      <Suspense fallback={null}>
        <AdminFeedbackToast />
      </Suspense>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/admin">
          <BrandLogo priority size={48} />
          <strong>Pote Mix</strong>
        </Link>
        <AdminNavigation />
        <div className={styles.sidebarFooter}>
          <div className={styles.account}>
            <small>Administrador</small>
            <strong title={userName}>{userName}</strong>
          </div>
          <Link className={styles.storeLink} href="/cardapio" target="_blank">
            <span aria-hidden="true">↗</span>
            Ver loja
          </Link>
          <form action={logoutAction} className={styles.signOutForm}>
            <button className={styles.signOut} type="submit">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <section className={styles.content}>
        {children}
        <AdminOrderMonitor />
      </section>
    </main>
  );
}
