import { formatMoney } from "../domain/format-money";
import type { StorefrontProduct } from "../domain/storefront.types";
import styles from "./product-card.module.css";

const categoryVisual: Record<string, string> = {
  Marmitas: "🍲",
  Bebidas: "🥤",
  Sobremesas: "🍮",
};

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const currentPrice =
    product.promotionalPriceInCents ?? product.priceInCents;

  return (
    <article className={styles.productCard}>
      <div className={styles.productVisual} aria-hidden="true">
        {categoryVisual[product.category] ?? "🍽️"}
      </div>
      <div className={styles.productContent}>
        <div className={styles.productHeading}>
          <h3>{product.name}</h3>
          {product.featured ? <span>Mais pedido</span> : null}
        </div>
        <p>{product.description}</p>
        <div className={styles.productFooter}>
          <div>
            {product.promotionalPriceInCents ? (
              <small>{formatMoney(product.priceInCents)}</small>
            ) : null}
            <strong>{formatMoney(currentPrice)}</strong>
          </div>
          <button type="button" disabled={!product.available}>
            {product.available ? "Adicionar" : "Esgotado"}
          </button>
        </div>
      </div>
    </article>
  );
}
