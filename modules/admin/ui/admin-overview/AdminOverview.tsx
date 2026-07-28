import type { StorefrontSnapshot } from "@/modules/storefront/domain/storefront.types";
import type { AdminOrderMetrics } from "@/modules/ordering/application/admin-orders";
import type { AdminBusinessSettings } from "@/modules/establishment/application/admin-establishment";
import { toggleSiteAvailabilityAction } from "@/modules/establishment/server/establishment-actions";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import styles from "./admin-overview.module.css";

export function AdminOverview({
  storefront,
  orderMetrics,
  settings,
}: {
  storefront: StorefrontSnapshot;
  orderMetrics: AdminOrderMetrics;
  settings: AdminBusinessSettings;
}) {
  const siteEnabled = !settings.ordersPaused;
  return (
    <>
      <section className={styles.operationBanner}>
        <div>
          <span
            className={siteEnabled ? styles.liveDot : styles.siteOffDot}
          />
          <p>Controle do site</p>
          <strong>{siteEnabled ? "Site ligado" : "Site desligado"}</strong>
        </div>
        <div>
          <p>Novos pedidos</p>
          <strong>{siteEnabled ? "Liberados" : "Bloqueados"}</strong>
        </div>
        <form action={toggleSiteAvailabilityAction}>
          <input type="hidden" name="enabled" value={String(!siteEnabled)} />
          <button
            className={siteEnabled ? undefined : styles.enableSiteButton}
            type="submit"
          >
            {siteEnabled ? "Desligar site" : "Ligar site"}
          </button>
        </form>
      </section>

      <div className={styles.metricGrid}>
        <article>
          <p>Produtos ativos</p>
          <strong>{storefront.products.length}</strong>
          <small>no cardápio atual</small>
        </article>
        <article>
          <p>Pedidos recebidos</p>
          <strong>{orderMetrics.received}</strong>
          <small>{orderMetrics.active} em andamento</small>
        </article>
        <article>
          <p>Pedidos concluídos</p>
          <strong>{orderMetrics.completed}</strong>
          <small>entregues ou retirados</small>
        </article>
        <article>
          <p>Faturamento previsto</p>
          <strong>{formatMoney(orderMetrics.projectedRevenueInCents)}</strong>
          <small>pedidos não cancelados</small>
        </article>
      </div>

      <section className={styles.foundationPanel}>
        <div>
          <p className={styles.eyebrow}>Operação integrada</p>
          <h2>A loja e o painel trabalham na mesma base.</h2>
          <p>
            Cada área administrativa agora possui sua própria tela, enquanto
            catálogo, checkout, estoque e pedidos continuam conectados.
          </p>
        </div>
        <ul>
          <li><span>✓</span> Pedidos em uma tela dedicada</li>
          <li><span>✓</span> Cardápio em uma tela dedicada</li>
          <li><span>✓</span> Bairros separados das configurações</li>
          <li><span>✓</span> Navegação responsiva</li>
        </ul>
      </section>
    </>
  );
}
