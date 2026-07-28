import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  credentialsMatch,
  readSessionToken,
} from "../modules/admin-auth/domain/session-token.ts";
import {
  calculateOrderTotal,
  validateChangeAmount,
} from "../modules/ordering/domain/calculate-order-total.ts";
import {
  OrderRequestError,
  parseOrderRequest,
} from "../modules/ordering/domain/order-request.ts";
import { formatMoney } from "../modules/storefront/domain/format-money.ts";
import { nextSundayLabel } from "../modules/storefront/domain/next-sales-date.ts";

test("formats monetary values stored as integer cents", () => {
  assert.match(formatMoney(2850), /28,50/);
});

test("finds the next Sunday in the sales calendar", () => {
  const label = nextSundayLabel(new Date("2026-07-27T15:00:00.000Z"));
  assert.match(label, /domingo/i);
  assert.match(label, /2 de agosto/i);
});

test("keeps the Sunday date stable around the UTC boundary", () => {
  const label = nextSundayLabel(new Date("2026-07-28T00:30:00.000Z"));
  assert.match(label, /domingo/i);
  assert.match(label, /2 de agosto/i);
});

test("recalculates subtotal, delivery fee, discount and total", () => {
  const total = calculateOrderTotal(
    [
      { unitPriceInCents: 2600, quantity: 2, addonTotalInCents: 300 },
      { unitPriceInCents: 600, quantity: 1 },
    ],
    500,
    400,
  );

  assert.deepEqual(total, {
    subtotalInCents: 6400,
    deliveryFeeInCents: 500,
    discountInCents: 400,
    totalInCents: 6500,
  });
});

test("validates cash change against the server total", () => {
  assert.equal(validateChangeAmount(4200, 5000), true);
  assert.equal(validateChangeAmount(4200, 4000), false);
  assert.equal(validateChangeAmount(4200, null), true);
});

test("admin credentials are deny-by-default and case-insensitive", () => {
  assert.equal(
    credentialsMatch(
      "ABRAAOFCJUNIOR@GMAIL.COM",
      "segredo",
      "abraaofcjunior@gmail.com",
      "segredo",
    ),
    true,
  );
  assert.equal(
    credentialsMatch(
      "intruso@example.com",
      "segredo",
      "abraaofcjunior@gmail.com",
      "segredo",
    ),
    false,
  );
});

test("admin session rejects tampering and expiration", () => {
  const token = createSessionToken(
    { email: "abraaofcjunior@gmail.com", expiresAt: 2_000 },
    "segredo-longo",
  );
  assert.equal(readSessionToken(token, "segredo-longo", 1_000)?.email, "abraaofcjunior@gmail.com");
  assert.equal(readSessionToken(`${token}x`, "segredo-longo", 1_000), null);
  assert.equal(readSessionToken(token, "segredo-longo", 3_000), null);
});

test("normalizes checkout input and combines repeated products", () => {
  const request = parseOrderRequest({
    idempotencyKey: "tentativa-1",
    customer: {
      name: "Cliente Teste",
      phone: "(27) 99999-9999",
      email: "",
    },
    fulfillment: "pickup",
    deliverySlotId: "slot-1",
    paymentMethodId: "cash",
    changeFor: "50,00",
    items: [
      { productId: "marmita", quantity: 1 },
      { productId: "marmita", quantity: 2 },
    ],
  });
  assert.equal(request.customer.phone, "27999999999");
  assert.deepEqual(request.items, [{ productId: "marmita", quantity: 3 }]);
  assert.equal(request.changeForInCents, 5000);
});

test("requires a delivery address for delivery orders", () => {
  assert.throws(
    () =>
      parseOrderRequest({
        idempotencyKey: "tentativa-2",
        customer: { name: "Cliente", phone: "27999999999" },
        fulfillment: "delivery",
        deliveryAreaId: "area-1",
        deliverySlotId: "slot-1",
        paymentMethodId: "cash",
        items: [{ productId: "marmita", quantity: 1 }],
      }),
    OrderRequestError,
  );
});
