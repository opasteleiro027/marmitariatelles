import type { StorefrontSnapshot } from "../domain/storefront.types";
import { formatMoney } from "../domain/format-money";
import { SiteHeader } from "./site-header/SiteHeader";
import styles from "./storefront.module.css";

export function StorefrontPage({ snapshot }: { snapshot: StorefrontSnapshot }) {
  return (
    <main className={styles.page}>
      <SiteHeader
        active="home"
        businessName={snapshot.businessName}
        ordersOpen={snapshot.ordersOpen}
      />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Almoço de domingo, sem complicação</p>
          <h1>Seu domingo merece comida com gosto de casa.</h1>
          <p className={styles.heroText}>{snapshot.welcomeMessage}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="/cardapio">
              Montar meu pedido
            </a>
            <span>Feito no dia, com ingredientes frescos.</span>
          </div>
        </div>

        <aside className={styles.orderStatus} aria-label="Status dos pedidos">
          <div className={styles.statusTopline}>
            <span className={snapshot.ordersOpen ? styles.openDot : styles.closedDot} />
            <strong>
              {snapshot.ordersOpen ? "Site ligado" : "Site desligado"}
            </strong>
          </div>
          <p className={styles.salesDate}>
            {snapshot.ordersOpen
              ? "Pedidos liberados"
              : "Novos pedidos temporariamente bloqueados"}
          </p>
          <ul>
            <li><span>🛵</span>{snapshot.deliveryWindowLabel}</li>
            <li><span>📍</span>{snapshot.notice}</li>
          </ul>
          <p className={styles.minimum}>
            Pedido mínimo: {formatMoney(snapshot.minimumOrderInCents)}
          </p>
        </aside>
      </section>

      <section className={styles.trustStrip} aria-label="Diferenciais">
        <div><span>01</span><p><strong>Escolha</strong> sua marmita e os adicionais.</p></div>
        <div><span>02</span><p><strong>Informe</strong> seu bairro e pagamento.</p></div>
        <div><span>03</span><p><strong>Receba</strong> tudo fresquinho em casa.</p></div>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>{snapshot.businessName}</strong>
          <p>{snapshot.address}</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="/cardapio">Cardápio</a>
          <a href="/como-funciona">Como funciona</a>
          <a href="/contato">Contato</a>
        </div>
      </footer>

    </main>
  );
}
