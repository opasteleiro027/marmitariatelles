"use client";

import { useEffect, useMemo, useState } from "react";
import { OrderingDrawer } from "@/modules/ordering/ui/ordering-drawer/OrderingDrawer";
import type { CartItem } from "@/modules/ordering/ui/ordering-drawer/ordering.types";
import type {
  StorefrontProduct,
  StorefrontSnapshot,
} from "../../domain/storefront.types";
import { formatMoney } from "../../domain/format-money";
import { MenuCategory } from "../menu-category/MenuCategory";
import { MenuOrderSummary } from "../menu-order-summary/MenuOrderSummary";
import { SiteHeader } from "../site-header/SiteHeader";
import styles from "./menu-builder.module.css";

const CART_KEY = "marmitaria-telles-cart";
const NOTES_KEY = "marmitaria-telles-order-notes";

export function MenuBuilder({ snapshot }: { snapshot: StorefrontSnapshot }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const categories = useMemo(
    () => Array.from(new Set(snapshot.products.map((product) => product.category))),
    [snapshot.products],
  );
  const quantities = useMemo(
    () => new Map(items.map((item) => [item.product.id, item.quantity])),
    [items],
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => {
    const price =
      item.product.promotionalPriceInCents ?? item.product.priceInCents;
    return total + price * item.quantity;
  }, 0);
  const canCheckout =
    snapshot.ordersOpen &&
    itemCount > 0 &&
    subtotal >= snapshot.minimumOrderInCents;

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem(CART_KEY) ?? "[]",
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
        setNotes(window.localStorage.getItem(NOTES_KEY) ?? "");
      } catch {
        window.localStorage.removeItem(CART_KEY);
        window.localStorage.removeItem(NOTES_KEY);
      } finally {
        setCartLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [snapshot.products]);

  useEffect(() => {
    if (!cartLoaded) return;
    window.localStorage.setItem(
      CART_KEY,
      JSON.stringify(
        items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      ),
    );
    window.localStorage.setItem(NOTES_KEY, notes);
  }, [cartLoaded, items, notes]);

  function changeQuantity(product: StorefrontProduct, quantity: number) {
    setItems((current) => {
      if (quantity < 1) {
        return current.filter((item) => item.product.id !== product.id);
      }
      const existing = current.some((item) => item.product.id === product.id);
      return existing
        ? current.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(quantity, 99) }
              : item,
          )
        : [...current, { product, quantity: 1 }];
    });
  }

  function finishOrder() {
    setItems([]);
    setNotes("");
  }

  return (
    <main className={styles.page}>
      <SiteHeader
        active="menu"
        businessName={snapshot.businessName}
        cartCount={itemCount}
        onCartOpen={() => setDrawerOpen(true)}
        ordersOpen={snapshot.ordersOpen}
      />

      <section className={styles.hero}>
        <div className={styles.heroImage} aria-hidden="true" />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <span>Cardápio de domingo</span>
          <h1>Monte seu pedido do seu jeito</h1>
          <p>
            Escolha cada item com carinho e confira o valor em tempo real.
            Comida fresca, caseira e feita no dia.
          </p>
          <div>
            <small>{snapshot.deliveryWindowLabel}</small>
            <small>Pedido mínimo {formatMoney(snapshot.minimumOrderInCents)}</small>
          </div>
        </div>
      </section>

      {!snapshot.ordersOpen ? (
        <div className={styles.closedNotice} role="status">
          <strong>O site está desligado no momento.</strong>
          <span>Você pode consultar o cardápio, mas novos pedidos estão bloqueados.</span>
        </div>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.builder}>
          {categories.map((category, index) => (
            <MenuCategory
              index={index + 1}
              key={category}
              name={category}
              onQuantityChange={changeQuantity}
              orderingEnabled={snapshot.ordersOpen}
              products={snapshot.products.filter(
                (product) => product.category === category,
              )}
              quantities={quantities}
            />
          ))}

          <section className={styles.notes} aria-labelledby="order-notes-title">
            <div>
              <span aria-hidden="true">{categories.length + 1}</span>
              <h2 id="order-notes-title">Alguma observação?</h2>
            </div>
            <textarea
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: retirar cebola, caprichar na farofa..."
              value={notes}
            />
            <small>{notes.length}/500</small>
          </section>
        </div>

        <MenuOrderSummary
          items={items}
          minimumOrderInCents={snapshot.minimumOrderInCents}
          onCheckout={() => setDrawerOpen(true)}
          orderingEnabled={snapshot.ordersOpen}
        />
      </div>

      <footer className={styles.footer}>
        <strong>{snapshot.businessName}</strong>
        <span>{snapshot.address}</span>
      </footer>

      <button
        className={styles.mobileCart}
        disabled={!canCheckout}
        onClick={() => setDrawerOpen(true)}
        type="button"
      >
        <span>
          <small>{itemCount} {itemCount === 1 ? "item" : "itens"}</small>
          <strong>{formatMoney(subtotal)}</strong>
        </span>
        <b>
          {!snapshot.ordersOpen
            ? "Site desligado"
            : subtotal < snapshot.minimumOrderInCents
              ? "Complete o mínimo"
              : "Continuar"}
        </b>
      </button>

      {drawerOpen ? (
        <OrderingDrawer
          items={items}
          onClose={() => setDrawerOpen(false)}
          onOrderComplete={finishOrder}
          onQuantityChange={(productId, quantity) => {
            const product = snapshot.products.find(
              (candidate) => candidate.id === productId,
            );
            if (product) changeQuantity(product, quantity);
          }}
          orderNotes={notes}
          snapshot={snapshot}
        />
      ) : null}
    </main>
  );
}
