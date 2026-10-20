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
        <form action={logoutAction} className={styles.signOutForm}>
          <button className={styles.signOut} type="submit">
            Sair
          </button>
        </form>
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <p>Painel administrativo</p>
            <strong>{userName}</strong>
          </div>
          <Link href="/cardapio" target="_blank">
            Ver loja ↗
          </Link>
        </header>
        <AdminOrderMonitor />
        {children}
      </section>
    </main>
  );
}
