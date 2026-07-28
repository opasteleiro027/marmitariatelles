"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AddressLocationFields } from "@/modules/address-location/ui/address-location-fields/AddressLocationFields";
import { selectAutomaticDeliverySlot } from "@/modules/ordering/domain/select-automatic-delivery-slot";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import type { StorefrontSnapshot } from "@/modules/storefront/domain/storefront.types";
import {
  cartItemUnitPrice,
  type CartItem,
  type OrderSuccess,
} from "./ordering.types";
import styles from "./ordering-drawer.module.css";

export function OrderingDrawer({
  snapshot,
  items,
  onQuantityChange,
  onClose,
  onOrderComplete,
  orderNotes = "",
}: {
  snapshot: StorefrontSnapshot;
  items: CartItem[];
  onQuantityChange: (lineId: string, quantity: number) => void;
  onClose: () => void;
  onOrderComplete: () => void;
  orderNotes?: string;
}) {
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [deliveryAreaId, setDeliveryAreaId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(
    snapshot.paymentMethods[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<OrderSuccess | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        return total + cartItemUnitPrice(item) * item.quantity;
      }, 0),
    [items],
  );
  const area = snapshot.deliveryAreas.find(
    (candidate) => candidate.id === deliveryAreaId,
  );
  const deliveryFee =
    fulfillment === "delivery" ? area?.deliveryFeeInCents ?? 0 : 0;
  const total = subtotal + deliveryFee;
  const automaticDeliverySlotId = useMemo(
    () => selectAutomaticDeliverySlot(snapshot.deliverySlots),
    [snapshot.deliverySlots],
  );
  const addressDeliveryAreas = useMemo(
    () =>
      snapshot.deliveryAreas.map((deliveryArea) => ({
        ...deliveryArea,
        formattedFee: formatMoney(deliveryArea.deliveryFeeInCents),
      })),
    [snapshot.deliveryAreas],
  );

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customer: {
            name: String(form.get("name") ?? ""),
            phone: String(form.get("phone") ?? ""),
            email: String(form.get("email") ?? ""),
          },
          fulfillment,
          deliveryAreaId:
            fulfillment === "delivery" ? deliveryAreaId : null,
          deliverySlotId: String(form.get("deliverySlotId") ?? "") || null,
          paymentMethodId,
          changeFor: String(form.get("changeFor") ?? "") || null,
          notes: orderNotes,
          address:
            fulfillment === "delivery"
              ? {
                  postalCode: String(form.get("postalCode") ?? ""),
                  street: String(form.get("street") ?? ""),
                  number: String(form.get("number") ?? ""),
                  complement: String(form.get("complement") ?? ""),
                  neighborhood: String(form.get("neighborhood") ?? ""),
                  city: String(form.get("city") ?? ""),
                  state: String(form.get("state") ?? ""),
                  referencePoint: String(form.get("referencePoint") ?? ""),
                }
              : null,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: item.notes,
            selections: item.selections.map((selection) => ({
              optionId: selection.optionId,
              quantity: selection.quantity,
            })),
          })),
        }),
      });
      const result = (await response.json()) as OrderSuccess & {
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível enviar.");
      setSuccess(result);
      onOrderComplete();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível enviar o pedido.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    const message = encodeURIComponent(
      `Olá! Acabei de fazer o pedido nº ${success.orderNumber} pelo site. Gostaria de confirmar o recebimento.`,
    );
    return (
      <div className={styles.backdrop} role="presentation">
        <section
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-success-title"
        >
          <button className={styles.close} type="button" onClick={onClose}>
            Fechar
          </button>
          <div className={styles.success}>
            <span aria-hidden="true">✓</span>
            <p>Pedido recebido com sucesso</p>
            <h2 id="order-success-title">Pedido nº {success.orderNumber}</h2>
            <strong>{formatMoney(success.totalInCents)}</strong>
            <p>
              Salve o acompanhamento e confirme o recebimento pelo WhatsApp.
            </p>
            <a href={`/pedido/${success.trackingToken}`}>Acompanhar pedido</a>
            <a
              className={styles.whatsapp}
              href={`https://wa.me/${snapshot.whatsapp}?text=${message}`}
            >
              Falar pelo WhatsApp
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
      >
        <header>
          <div>
            <p>Seu pedido</p>
            <h2 id="order-title">Revise antes de enviar</h2>
          </div>
          <button className={styles.close} type="button" onClick={onClose}>
            Fechar
          </button>
        </header>

        {!items.length ? (
          <div className={styles.empty}>
            <span aria-hidden="true">🍽️</span>
            <p>Seu pedido ainda está vazio.</p>
            <button type="button" onClick={onClose}>Escolher produtos</button>
          </div>
        ) : (
          <form onSubmit={submitOrder}>
            <div className={styles.items}>
              {items.map((item) => {
                const price = cartItemUnitPrice(item);
                return (
                  <article key={item.lineId}>
                    <div>
                      <strong>{item.product.name}</strong>
                      <small>{formatMoney(price)} cada</small>
                      {item.selections.length ? (
                        <small>
                          {item.selections
                            .map((selection) => selection.optionName)
                            .join(", ")}
                        </small>
                      ) : null}
                      {item.notes ? <small>Obs.: {item.notes}</small> : null}
                    </div>
                    <div className={styles.quantity}>
                      <button
                        type="button"
                        aria-label={`Diminuir ${item.product.name}`}
                        onClick={() =>
                          onQuantityChange(item.lineId, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Aumentar ${item.product.name}`}
                        onClick={() =>
                          onQuantityChange(item.lineId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <fieldset>
              <legend>Seus dados</legend>
              <label>
                Nome completo
                <input name="name" autoComplete="name" required />
              </label>
              <label>
                Telefone/WhatsApp
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(27) 99999-9999"
                  required
                />
              </label>
              <label>
                E-mail <small>(opcional)</small>
                <input name="email" type="email" autoComplete="email" />
              </label>
            </fieldset>

            <fieldset>
              <legend>Entrega ou retirada</legend>
              <div className={styles.radioGroup}>
                <label>
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillment === "pickup"}
                    onChange={() => setFulfillment("pickup")}
                  />
                  Retirar no local
                </label>
                <label>
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillment === "delivery"}
                    disabled={!snapshot.deliveryAreas.length}
                    onChange={() => setFulfillment("delivery")}
                  />
                  Receber em casa
                </label>
              </div>
              {fulfillment === "pickup" ? (
                <p className={styles.info}>{snapshot.address}</p>
              ) : (
                <AddressLocationFields
                  deliveryAreas={addressDeliveryAreas}
                  deliveryAreaId={deliveryAreaId}
                  onDeliveryAreaChange={setDeliveryAreaId}
                />
              )}
              {fulfillment === "pickup" ? (
                <label>
                  Horário de retirada
                  <select name="deliverySlotId" required>
                    {snapshot.deliverySlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <option key={slot.id} value={slot.id}>{slot.label}</option>
                      ))}
                  </select>
                </label>
              ) : (
                <>
                  <input
                    type="hidden"
                    name="deliverySlotId"
                    value={automaticDeliverySlotId}
                  />
                  <p className={styles.info}>
                    A previsão da entrega será organizada pela marmitaria.
                  </p>
                </>
              )}
            </fieldset>

            <fieldset>
              <legend>Pagamento</legend>
              <label>
                Forma de pagamento
                <select
                  value={paymentMethodId}
                  onChange={(event) => setPaymentMethodId(event.target.value)}
                  required
                >
                  {snapshot.paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
              {snapshot.paymentMethods.find(
                (method) => method.id === paymentMethodId,
              )?.code === "cash" ? (
                <label>
                  Troco para quanto? <small>(opcional)</small>
                  <input name="changeFor" inputMode="decimal" placeholder="50,00" />
                </label>
              ) : null}
            </fieldset>

            <div className={styles.total}>
              <span>Subtotal <strong>{formatMoney(subtotal)}</strong></span>
              <span>Taxa <strong>{formatMoney(deliveryFee)}</strong></span>
              <span>Total <strong>{formatMoney(total)}</strong></span>
            </div>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button
              className={styles.submit}
              type="submit"
              disabled={
                submitting ||
                !snapshot.ordersOpen ||
                !automaticDeliverySlotId ||
                (fulfillment === "delivery" && !deliveryAreaId)
              }
            >
              {submitting ? "Enviando pedido..." : "Confirmar pedido"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
