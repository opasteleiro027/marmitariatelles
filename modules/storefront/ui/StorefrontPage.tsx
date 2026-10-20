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
          <p className={styles.eyebrow}>Massas e saladas feitas na hora</p>
          <h1>Seu sabor favorito, no pote perfeito.</h1>
          <p className={styles.heroText}>{snapshot.welcomeMessage}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="/cardapio">
              Montar meu pedido
            </a>
            <span>Você escolhe. Você monta. A gente prepara.</span>
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
            <li><span>🍝</span>Macarrão montado do seu jeito</li>
            <li><span>🥗</span>Saladas frescas com adicionais</li>
          </ul>
          <p className={styles.minimum}>
            Pedido mínimo: {formatMoney(snapshot.minimumOrderInCents)}
          </p>
        </aside>
      </section>

      <section className={styles.trustStrip} aria-label="Diferenciais">
        <div><span>01</span><p><strong>Monte</strong> seu pote ou escolha uma receita.</p></div>
        <div><span>02</span><p><strong>Personalize</strong> com seus ingredientes favoritos.</p></div>
        <div><span>03</span><p><strong>Finalize</strong> e acompanhe o pedido on-line.</p></div>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>{snapshot.businessName}</strong>
          <p>{snapshot.address}</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="/cardapio">Cardápio</a>
        </div>
      </footer>

    </main>
  );
}
