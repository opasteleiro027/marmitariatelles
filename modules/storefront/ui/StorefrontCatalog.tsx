"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  StorefrontProduct,
  StorefrontSnapshot,
} from "../domain/storefront.types";
import { ProductCard } from "./ProductCard";
import { OrderingDrawer } from "@/modules/ordering/ui/ordering-drawer/OrderingDrawer";
import type { CartItem } from "@/modules/ordering/ui/ordering-drawer/ordering.types";
import styles from "./storefront.module.css";

export function StorefrontCatalog({
  snapshot,
}: {
  snapshot: StorefrontSnapshot;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const categories = useMemo(
    () => Array.from(new Set(snapshot.products.map((product) => product.category))),
    [snapshot.products],
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem("marmitaria-telles-cart") ?? "[]",
      ) as Array<{ productId: string; quantity: number }>;
      setItems(
        stored.flatMap((entry) => {
          const product = snapshot.products.find(
            (candidate) =>
              candidate.id === entry.productId && candidate.available,
          );
          return product && Number.isInteger(entry.quantity) && entry.quantity > 0
            ? [{ product, quantity: Math.min(entry.quantity, 99) }]
            : [];
        }),
      );
    } catch {
      window.localStorage.removeItem("marmitaria-telles-cart");
    } finally {
      setCartLoaded(true);
    }
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [snapshot.products]);

  useEffect(() => {
    if (!cartLoaded) return;
    window.localStorage.setItem(
      "marmitaria-telles-cart",
      JSON.stringify(
        items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      ),
    );
  }, [cartLoaded, items]);

  function addProduct(product: StorefrontProduct) {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    setDrawerOpen(true);
  }

  function changeQuantity(productId: string, quantity: number) {
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => item.product.id !== productId)
        : current.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
    );
  }

  return (
    <>
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
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addProduct}
                  />
                ))}
            </div>
          </div>
        ))}
      </section>

      <button
        className={styles.floatingCart}
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={`Abrir pedido com ${itemCount} itens`}
      >
        <span aria-hidden="true">🛍️</span>
        <strong>{itemCount ? "Ver pedido" : "Começar pedido"}</strong>
        <small>{itemCount} {itemCount === 1 ? "item" : "itens"}</small>
      </button>

      {drawerOpen ? (
        <OrderingDrawer
          snapshot={snapshot}
          items={items}
          onQuantityChange={changeQuantity}
          onClose={() => setDrawerOpen(false)}
          onOrderComplete={() => setItems([])}
        />
      ) : null}
    </>
  );
}
