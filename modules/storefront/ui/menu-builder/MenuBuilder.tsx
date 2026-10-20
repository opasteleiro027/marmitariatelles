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
import { MenuOrderSummary } from "../menu-order-summary/MenuOrderSummary";
import { ProductCard } from "../ProductCard";
import { ProductCustomizer } from "../product-customizer/ProductCustomizer";
import { SiteHeader } from "../site-header/SiteHeader";
import styles from "./menu-builder.module.css";

const CART_KEY = "pote-mix-cart-v1";

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
  const [customizerProduct, setCustomizerProduct] = useState<StorefrontProduct | null>(null);
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

  function addRegularProduct(product: StorefrontProduct) {
    if (product.customizationGroups.length) {
      setCustomizerProduct(product);
      return;
    }
    setItems((current) => {
      const lineId = `product:${product.id}`;
      const existing = current.find((item) => item.lineId === lineId);
      return existing
        ? current.map((item) =>
            item.lineId === lineId
              ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
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
          <span>Pote Mix · pedido on-line</span>
          <h1>Seu sabor favorito, no pote perfeito.</h1>
          <p>
            Monte seu macarrão, escolha uma receita pronta ou peça uma salada
            fresquinha. Tudo preparado na hora, do seu jeito.
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

      <nav className={styles.categoryNav} aria-label="Categorias do cardápio">
        <a href="#monte-seu-pote"><span>01</span><strong>Monte seu pote</strong><small>Massa, molho e complementos</small></a>
        <a href="#receitas-prontas"><span>02</span><strong>Receitas prontas</strong><small>Combinações especiais</small></a>
        <a href="#saladas"><span>03</span><strong>Saladas</strong><small>Frescas e feitas na hora</small></a>
      </nav>

      <section className={styles.builderArea} id="monte-seu-pote">
        <div className={styles.sectionIntro}>
          <span>01 · Monte seu pote</span>
          <h2>Você escolhe. A gente prepara.</h2>
          <p>Comece pelo tamanho e monte sua combinação favorita etapa por etapa.</p>
        </div>
        <MarmitaConfigurator
          builder={snapshot.marmitaBuilder}
          onAdd={(item) => setItems((current) => [...current, item])}
          orderingEnabled={snapshot.ordersOpen}
        />
      </section>

      {categories.length ? (
        <section className={styles.otherProducts}>
          <div className={styles.otherLayout}>
            <div>
              {categories.map((category, index) => (
                <section
                  className={styles.productSection}
                  id={category === "Receitas prontas" ? "receitas-prontas" : "saladas"}
                  key={category}
                >
                  <div className={styles.sectionIntro}>
                    <span>0{index + 2} · {category}</span>
                    <h2>{category === "Saladas" ? "Leves, frescas e cheias de sabor." : "Escolha e peça sem precisar montar."}</h2>
                    <p>{category === "Saladas" ? "Todas acompanham croutons. Personalize com adicionais se quiser." : "Combinações já pensadas para você aproveitar."}</p>
                  </div>
                  <div className={styles.productGrid}>
                    {regularProducts
                      .filter((product) => product.category === category)
                      .map((product) => (
                        <ProductCard
                          key={product.id}
                          onAdd={addRegularProduct}
                          orderingEnabled={snapshot.ordersOpen}
                          product={product}
                        />
                      ))}
                  </div>
                </section>
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

      {customizerProduct ? (
        <ProductCustomizer
          onAdd={(item) => {
            setItems((current) => [...current, item]);
            setCustomizerProduct(null);
          }}
          onClose={() => setCustomizerProduct(null)}
          product={customizerProduct}
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
      const groups = [
        ...snapshot.marmitaBuilder.groups,
        ...product.customizationGroups,
      ];
      const group = groups.find((candidate) =>
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
