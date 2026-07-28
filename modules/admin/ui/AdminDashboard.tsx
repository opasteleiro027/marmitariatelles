import { clearAdminSession } from "@/modules/admin-auth/server/admin-session";
import { redirect } from "next/navigation";
import type { StorefrontSnapshot } from "@/modules/storefront/domain/storefront.types";
import type { getAdminCatalog } from "@/modules/catalog/application/catalog-admin";
import { CatalogManagement } from "@/modules/catalog/ui/catalog-management/CatalogManagement";
import type { AdminOrderSnapshot } from "@/modules/ordering/application/admin-orders";
import { AdminOrderList } from "@/modules/ordering/ui/admin-order-list/AdminOrderList";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import type { getAdminEstablishment } from "@/modules/establishment/application/admin-establishment";
import { EstablishmentManagement } from "@/modules/establishment/ui/establishment-management/EstablishmentManagement";
import { toggleOrdersPausedAction } from "@/modules/establishment/server/establishment-actions";
import type { AdminSalesCalendar } from "@/modules/sales-calendar/application/admin-sales-calendar";
import { SalesCalendarManagement } from "@/modules/sales-calendar/ui/sales-calendar-management/SalesCalendarManagement";
import styles from "./admin.module.css";

const navigation = [
  ["⌂", "Visão geral", "/admin"],
  ["▤", "Pedidos", "#pedidos"],
  ["◫", "Cardápio", "#cardapio-admin"],
  ["◎", "Áreas de entrega", "#configuracoes"],
  ["◷", "Horários", "#horarios"],
  ["⚙", "Configurações", "#configuracoes"],
];

async function logoutAction() {
  "use server";
  await clearAdminSession();
  redirect("/admin/login");
}

export function AdminDashboard({
  userName,
  storefront,
  catalog,
  orders,
  establishment,
  salesCalendar,
}: {
  userName: string;
  storefront: StorefrontSnapshot;
  catalog: Awaited<ReturnType<typeof getAdminCatalog>>;
  orders: AdminOrderSnapshot;
  establishment: Awaited<ReturnType<typeof getAdminEstablishment>>;
  salesCalendar: AdminSalesCalendar;
}) {
  return (
    <main className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="/admin">
          <span>MT</span>
          <strong>Marmitaria Telles</strong>
        </a>
        <nav aria-label="Administração">
          {navigation.map(([icon, label, href], index) => (
            <a
              className={index === 0 ? styles.activeNav : undefined}
              href={href}
              key={label}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </a>
          ))}
        </nav>
        <form action={logoutAction} className={styles.signOutForm}>
          <button className={styles.signOut} type="submit">Sair</button>
        </form>
      </aside>

      <section className={styles.adminContent}>
        <header className={styles.adminHeader}>
          <div>
            <p>Operação de domingo</p>
            <h1>Olá, {userName}</h1>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            Ver loja ↗
          </a>
        </header>

        <section className={styles.operationBanner}>
          <div>
            <span className={styles.liveDot} />
            <p>Próxima venda</p>
            <strong>{storefront.salesDateLabel}</strong>
          </div>
          <div>
            <p>Status</p>
            <strong>
              {storefront.ordersOpen ? "Pedidos abertos" : "Pedidos pausados"}
            </strong>
          </div>
          <form action={toggleOrdersPausedAction}>
            <input
              type="hidden"
              name="paused"
              value={String(establishment.settings.ordersPaused)}
            />
            <button type="submit">
              {establishment.settings.ordersPaused
                ? "Reabrir pedidos"
                : "Pausar novos pedidos"}
            </button>
          </form>
        </section>

        <div className={styles.metricGrid}>
          <article><p>Produtos ativos</p><strong>{storefront.products.length}</strong><small>no cardápio atual</small></article>
          <article><p>Pedidos recebidos</p><strong>{orders.metrics.received}</strong><small>{orders.metrics.active} em andamento</small></article>
          <article><p>Pedidos concluídos</p><strong>{orders.metrics.completed}</strong><small>entregues ou retirados</small></article>
          <article><p>Faturamento previsto</p><strong>{formatMoney(orders.metrics.projectedRevenueInCents)}</strong><small>pedidos não cancelados</small></article>
        </div>

        <section className={styles.foundationPanel} id="em-breve">
          <div>
            <p className={styles.eyebrow}>Operação integrada</p>
            <h2>A loja e o painel trabalham na mesma base.</h2>
            <p>
              Catálogo, checkout, estoque e acompanhamento estão conectados ao
              PostgreSQL com validações no servidor.
            </p>
          </div>
          <ul>
            <li><span>✓</span> Layout público responsivo</li>
            <li><span>✓</span> Área administrativa protegida</li>
            <li><span>✓</span> Catálogo administrável</li>
            <li><span>✓</span> Carrinho e checkout transacional</li>
          </ul>
        </section>
        <AdminOrderList snapshot={orders} />
        <CatalogManagement
          categories={catalog.categories}
          products={catalog.products}
        />
        <EstablishmentManagement snapshot={establishment} />
        <SalesCalendarManagement snapshot={salesCalendar} />
      </section>
    </main>
  );
}
