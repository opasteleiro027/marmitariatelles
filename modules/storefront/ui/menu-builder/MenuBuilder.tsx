"use client";

import { useEffect, useMemo, useState } from "react";
import { OrderingDrawer } from "@/modules/ordering/ui/ordering-drawer/OrderingDrawer";
import {
  cartItemUnitPrice,
  type CartItem,
} from "@/modules/ordering/ui/ordering-drawer/ordering.types";
import type {
  StorefrontProduct,
  StorefrontSnapshot,
} from "../../domain/storefront.types";
import { formatMoney } from "../../domain/format-money";
import { MarmitaConfigurator } from "../marmita-configurator/MarmitaConfigurator";
import { MenuCategory } from "../menu-category/MenuCategory";
import { MenuOrderSummary } from "../menu-order-summary/MenuOrderSummary";
import { SiteHeader } from "../site-header/SiteHeader";
import styles from "./menu-builder.module.css";

const CART_KEY = "marmitaria-telles-cart-v2";

type StoredCartItem = {
  lineId: string;
  productId: string;
  quantity: number;
  notes?: string;
  selections?: Array<{ optionId: string; quantity: number }>;
};

export function MenuBuilder({ snapshot }: { snapshot: StorefrontSnapshot }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const sizeIds = useMemo(
    () => new Set(snapshot.marmitaBuilder.sizes.map((size) => size.id)),
    [snapshot.marmitaBuilder.sizes],
  );
  const regularProducts = useMemo(
    () => snapshot.products.filter((product) => !sizeIds.has(product.id)),
    [sizeIds, snapshot.products],
  );
  const categories = useMemo(
    () => Array.from(new Set(regularProducts.map((product) => product.category))),
    [regularProducts],
  );
  const quantities = useMemo(
    () =>
      new Map(
        items
          .filter((item) => !item.selections.length)
          .map((item) => [item.product.id, item.quantity]),
      ),
    [items],
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + cartItemUnitPrice(item) * item.quantity,
    0,
  );
  const canCheckout =
    snapshot.ordersOpen &&
    itemCount > 0 &&
    subtotal >= snapshot.minimumOrderInCents;

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem(CART_KEY) ?? "[]",
        ) as StoredCartItem[];
        setItems(restoreCart(stored, snapshot));
      } catch {
        window.localStorage.removeItem(CART_KEY);
      } finally {
        setCartLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [snapshot]);

  useEffect(() => {
    if (!cartLoaded) return;
    window.localStorage.setItem(
      CART_KEY,
      JSON.stringify(
        items.map((item) => ({
          lineId: item.lineId,
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes,
          selections: item.selections.map((selection) => ({
            optionId: selection.optionId,
            quantity: selection.quantity,
          })),
        })),
      ),
    );
  }, [cartLoaded, items]);

  function changeRegularQuantity(product: StorefrontProduct, quantity: number) {
    setItems((current) => {
      const lineId = `product:${product.id}`;
      if (quantity < 1) {
        return current.filter((item) => item.lineId !== lineId);
      }
      const existing = current.some((item) => item.lineId === lineId);
      return existing
        ? current.map((item) =>
            item.lineId === lineId
              ? { ...item, quantity: Math.min(quantity, 99) }
              : item,
          )
        : [
            ...current,
            { lineId, product, quantity: 1, selections: [], notes: "" },
          ];
    });
  }

  function changeLineQuantity(lineId: string, quantity: number) {
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => item.lineId !== lineId)
        : current.map((item) =>
            item.lineId === lineId
              ? { ...item, quantity: Math.min(quantity, 99) }
              : item,
          ),
    );
  }

  function finishOrder() {
    setItems([]);
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
          <h1>Monte sua marmita do seu jeito</h1>
          <p>
            Escolha cada ingrediente com carinho para o seu almoço de domingo.
            Ingredientes frescos e tempero caseiro.
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

      <section className={styles.builderArea}>
        <MarmitaConfigurator
          builder={snapshot.marmitaBuilder}
          onAdd={(item) => setItems((current) => [...current, item])}
          orderingEnabled={snapshot.ordersOpen}
        />
      </section>

      {categories.length ? (
        <section className={styles.otherProducts}>
          <div className={styles.otherHeading}>
            <span>Também disponíveis</span>
            <h2>Bebidas e acompanhamentos extras</h2>
          </div>
          <div className={styles.otherLayout}>
            <div>
              {categories.map((category, index) => (
                <MenuCategory
                  index={snapshot.marmitaBuilder.groups.length + index + 3}
                  key={category}
                  name={category}
                  onQuantityChange={changeRegularQuantity}
                  orderingEnabled={snapshot.ordersOpen}
                  products={regularProducts.filter(
                    (product) => product.category === category,
                  )}
                  quantities={quantities}
                />
              ))}
            </div>
            <MenuOrderSummary
              items={items}
              minimumOrderInCents={snapshot.minimumOrderInCents}
              onCheckout={() => setDrawerOpen(true)}
              orderingEnabled={snapshot.ordersOpen}
            />
          </div>
        </section>
      ) : null}

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
              : "FINALIZAR PEDIDO"}
        </b>
      </button>

      {drawerOpen ? (
        <OrderingDrawer
          items={items}
          onClose={() => setDrawerOpen(false)}
          onOrderComplete={finishOrder}
          onQuantityChange={changeLineQuantity}
          snapshot={snapshot}
        />
      ) : null}
    </main>
  );
}

function restoreCart(
  stored: StoredCartItem[],
  snapshot: StorefrontSnapshot,
): CartItem[] {
  return stored.flatMap((entry) => {
    const product = snapshot.products.find(
      (candidate) => candidate.id === entry.productId && candidate.available,
    );
    if (!product || !Number.isInteger(entry.quantity) || entry.quantity < 1) {
      return [];
    }
    const selections = (entry.selections ?? []).flatMap((storedSelection) => {
      const group = snapshot.marmitaBuilder.groups.find((candidate) =>
        candidate.options.some(
          (option) =>
            option.id === storedSelection.optionId && option.available,
        ),
      );
      const option = group?.options.find(
        (candidate) => candidate.id === storedSelection.optionId,
      );
      return group && option && storedSelection.quantity > 0
        ? [
            {
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              additionalPriceInCents: option.additionalPriceInCents,
              quantity: Math.min(storedSelection.quantity, 10),
            },
          ]
        : [];
    });
    return [
      {
        lineId: entry.lineId || crypto.randomUUID(),
        product,
        quantity: Math.min(entry.quantity, 99),
        selections,
        notes: String(entry.notes ?? "").slice(0, 150),
      },
    ];
  });
}
