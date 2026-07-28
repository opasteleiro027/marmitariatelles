"use client";

import { formatMoney } from "../../domain/format-money";
import type { StorefrontProduct } from "../../domain/storefront.types";
import styles from "./menu-category.module.css";

type MenuCategoryProps = {
  index: number;
  name: string;
  products: StorefrontProduct[];
  quantities: ReadonlyMap<string, number>;
  orderingEnabled: boolean;
  onQuantityChange: (product: StorefrontProduct, quantity: number) => void;
};

function categoryKind(category: string) {
  const normalized = category.toLocaleLowerCase("pt-BR");
  if (normalized.includes("marmita") || normalized.includes("tamanho")) {
    return "meal";
  }
  if (normalized.includes("bebida")) return "drink";
  if (normalized.includes("sobremesa")) return "dessert";
  return "ingredient";
}

export function MenuCategory({
  index,
  name,
  products,
  quantities,
  orderingEnabled,
  onQuantityChange,
}: MenuCategoryProps) {
  const kind = categoryKind(name);

  return (
    <section className={styles.section} aria-labelledby={`category-${index}`}>
      <div className={styles.heading}>
        <span aria-hidden="true">{index}</span>
        <div>
          <h2 id={`category-${index}`}>{name}</h2>
          <p>Escolha os itens e ajuste as quantidades do seu pedido.</p>
        </div>
      </div>

      <div className={styles.grid} data-kind={kind}>
        {products.map((product) => {
          const quantity = quantities.get(product.id) ?? 0;
          const price =
            product.promotionalPriceInCents ?? product.priceInCents;
          return (
            <article
              className={quantity ? styles.selectedCard : styles.card}
              key={product.id}
            >
              <div className={styles.visual} data-kind={kind}>
                {kind === "meal" ? (
                  <span className={styles.photo} aria-hidden="true" />
                ) : (
                  <span className={styles.initial} aria-hidden="true">
                    {product.name.slice(0, 1)}
                  </span>
                )}
                {product.featured ? <small>Mais pedido</small> : null}
              </div>

              <div className={styles.content}>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className={styles.footer}>
                  <div>
                    {product.promotionalPriceInCents ? (
                      <small>{formatMoney(product.priceInCents)}</small>
                    ) : null}
                    <strong>{formatMoney(price)}</strong>
                  </div>

                  {!product.available || !orderingEnabled ? (
                    <button className={styles.unavailable} disabled type="button">
                      {!orderingEnabled ? "Site desligado" : "Esgotado"}
                    </button>
                  ) : quantity ? (
                    <div className={styles.quantity}>
                      <button
                        aria-label={`Diminuir ${product.name}`}
                        onClick={() => onQuantityChange(product, quantity - 1)}
                        type="button"
                      >
                        −
                      </button>
                      <span aria-label={`${quantity} unidades`}>{quantity}</span>
                      <button
                        aria-label={`Aumentar ${product.name}`}
                        onClick={() => onQuantityChange(product, quantity + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.add}
                      onClick={() => onQuantityChange(product, 1)}
                      type="button"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
