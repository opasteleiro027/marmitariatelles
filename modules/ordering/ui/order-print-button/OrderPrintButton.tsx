"use client";

import { useRef, useState } from "react";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import type { AdminOrder } from "../../application/admin-orders";
import { ORDER_STATUS_LABELS } from "../../application/order-status";
import styles from "./order-print-button.module.css";

const THERMAL_PRINT_CSS = `
  @page {
    size: 80mm auto;
    margin: 4mm;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: white;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
  }

  [data-receipt] {
    width: 72mm;
    margin: 0 auto;
  }

  [data-receipt] header {
    padding-bottom: 10px;
    border-bottom: 1px dashed #000;
    text-align: center;
  }

  [data-receipt] h1,
  [data-receipt] h2,
  [data-receipt] p {
    margin: 0;
  }

  [data-receipt] h1 {
    font-size: 18px;
  }

  [data-receipt] h2 {
    margin-top: 4px;
    font-size: 15px;
  }

  [data-receipt] section {
    padding: 9px 0;
    border-bottom: 1px dashed #000;
  }

  [data-receipt] section > p + p {
    margin-top: 3px;
  }

  [data-receipt] ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  [data-receipt] li + li {
    margin-top: 10px;
  }

  [data-receipt] li > div,
  [data-receipt] dl > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  [data-receipt] li p {
    margin-top: 3px;
    padding-left: 10px;
    font-size: 10px;
  }

  [data-receipt] dl {
    margin: 0;
    display: grid;
    gap: 4px;
  }

  [data-receipt] dt,
  [data-receipt] dd {
    margin: 0;
  }

  [data-receipt] [data-total] {
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid #000;
    font-size: 14px;
    font-weight: 700;
  }

  [data-receipt] footer {
    padding-top: 10px;
    text-align: center;
  }
`;

export function OrderPrintButton({ order }: { order: AdminOrder }) {
  const receiptRef = useRef<HTMLElement>(null);
  const [error, setError] = useState("");
  const changeInCents =
    order.changeForInCents === null
      ? null
      : order.changeForInCents - order.totalInCents;

  function printOrder() {
    const receipt = receiptRef.current;
    const printWindow = window.open(
      "",
      `comanda-${order.orderNumber}`,
      "popup,width=420,height=720",
    );
    if (!receipt || !printWindow) {
      setError("Permita a abertura da janela para imprimir a comanda.");
      return;
    }

    setError("");
    printWindow.opener = null;
    printWindow.document.documentElement.lang = "pt-BR";
    printWindow.document.title = `Comanda ${order.orderNumber}`;
    printWindow.document.head.replaceChildren();
    printWindow.document.body.replaceChildren();

    const charset = printWindow.document.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    const style = printWindow.document.createElement("style");
    style.textContent = THERMAL_PRINT_CSS;
    const printableReceipt = receipt.cloneNode(true) as HTMLElement;
    printableReceipt.removeAttribute("aria-hidden");
    printWindow.document.head.append(charset, style);
    printWindow.document.body.append(printableReceipt);
    printWindow.addEventListener("afterprint", () => printWindow.close(), {
      once: true,
    });
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 150);
  }

  return (
    <>
      <button className={styles.printButton} onClick={printOrder} type="button">
        <span aria-hidden="true">▣</span>
        Imprimir comanda
      </button>
      {error ? (
        <small aria-live="polite" className={styles.error}>
          {error}
        </small>
      ) : null}
      <section
        aria-hidden="true"
        className={styles.receipt}
        data-receipt
        ref={receiptRef}
      >
        <header>
          <h1>Marmitaria Telles</h1>
          <h2>COMANDA #{order.orderNumber}</h2>
          <p>{formatDateTime(order.createdAt)}</p>
          <strong>{ORDER_STATUS_LABELS[order.status]}</strong>
        </header>

        <section>
          <p><strong>Cliente:</strong> {order.customerName}</p>
          <p><strong>Telefone:</strong> {order.customerPhone}</p>
          <p>
            <strong>Tipo:</strong>{" "}
            {order.fulfillment === "delivery" ? "Entrega" : "Retirada"}
          </p>
          {order.fulfillment === "delivery" && order.address ? (
            <p><strong>Endereço:</strong> {order.address}</p>
          ) : null}
        </section>

        <section>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.quantity}× {item.name}</strong>
                  <strong>{formatMoney(item.lineTotalInCents)}</strong>
                </div>
                {item.addons.map((addon, index) => (
                  <p key={`${addon.groupName}-${addon.name}-${index}`}>
                    {addon.groupName}:{" "}
                    {addon.quantity > 1 ? `${addon.quantity}× ` : ""}
                    {addon.name}
                  </p>
                ))}
                {item.notes ? <p><strong>OBS:</strong> {item.notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotalInCents)}</dd>
            </div>
            {order.deliveryFeeInCents ? (
              <div>
                <dt>Taxa de entrega</dt>
                <dd>{formatMoney(order.deliveryFeeInCents)}</dd>
              </div>
            ) : null}
            {order.discountInCents ? (
              <div>
                <dt>Desconto</dt>
                <dd>- {formatMoney(order.discountInCents)}</dd>
              </div>
            ) : null}
            <div data-total>
              <dt>Total</dt>
              <dd>{formatMoney(order.totalInCents)}</dd>
            </div>
          </dl>
        </section>

        <section>
          <p><strong>Pagamento:</strong> {order.paymentLabel}</p>
          {order.changeForInCents !== null ? (
            <>
              <p>
                <strong>Troco para:</strong>{" "}
                {formatMoney(order.changeForInCents)}
              </p>
              <p>
                <strong>Troco:</strong> {formatMoney(changeInCents ?? 0)}
              </p>
            </>
          ) : null}
        </section>

        <footer>
          <strong>Bom preparo!</strong>
        </footer>
      </section>
    </>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
