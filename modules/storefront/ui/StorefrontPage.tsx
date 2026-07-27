import type { StorefrontSnapshot } from "../domain/storefront.types";
import { formatMoney } from "../domain/format-money";
import { ProductCard } from "./ProductCard";
import styles from "./storefront.module.css";

export function StorefrontPage({ snapshot }: { snapshot: StorefrontSnapshot }) {
  const categories = Array.from(
    new Set(snapshot.products.map((product) => product.category)),
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#" aria-label="Domingo na Mesa, início">
          <span aria-hidden="true">DM</span>
          <strong>{snapshot.businessName}</strong>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#cardapio">Cardápio</a>
          <a href="#como-funciona">Como funciona</a>
          <a href={`https://wa.me/${snapshot.whatsapp}`}>Fale conosco</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Almoço de domingo, sem complicação</p>
          <h1>Seu domingo merece comida com gosto de casa.</h1>
          <p className={styles.heroText}>{snapshot.welcomeMessage}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#cardapio">
              Ver cardápio
            </a>
            <span>Feito no dia, com ingredientes frescos.</span>
          </div>
        </div>

        <aside className={styles.orderStatus} aria-label="Status dos pedidos">
          <div className={styles.statusTopline}>
            <span className={snapshot.ordersOpen ? styles.openDot : styles.closedDot} />
            <strong>
              {snapshot.ordersOpen ? "Pedidos abertos" : "Pedidos encerrados"}
            </strong>
          </div>
          <p className={styles.salesDate}>{snapshot.salesDateLabel}</p>
          <ul>
            <li><span>⏰</span>{snapshot.orderDeadlineLabel}</li>
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

      <section className={styles.menuSection} id="cardapio">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Cardápio do próximo domingo</p>
            <h2>Escolha o que vai à sua mesa</h2>
          </div>
          <p>{snapshot.products.length} opções disponíveis</p>
        </div>

        {categories.map((category) => (
          <div className={styles.category} key={category}>
            <h3>{category}</h3>
            <div className={styles.productGrid}>
              {snapshot.products
                .filter((product) => product.category === category)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.howItWorks} id="como-funciona">
        <p className={styles.eyebrow}>Do pedido à mesa</p>
        <h2>Simples para pedir. Caprichado para comer.</h2>
        <p>
          A primeira versão da base já separa cardápio, operação e dados do
          estabelecimento. O carrinho e o checkout serão conectados nas
          próximas etapas do MVP.
        </p>
      </section>

      <footer className={styles.footer}>
        <div><strong>{snapshot.businessName}</strong><p>Comida que abraça.</p></div>
        <a href={`https://wa.me/${snapshot.whatsapp}`}>WhatsApp</a>
      </footer>

      <a className={styles.floatingCart} href="#cardapio" aria-label="Começar pedido">
        <span>🛍️</span>
        <strong>Começar pedido</strong>
        <small>0 itens</small>
      </a>
    </main>
  );
}
