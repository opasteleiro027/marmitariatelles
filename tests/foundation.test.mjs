import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedAdmin } from "../modules/admin/domain/admin-authorization.ts";
import {
  calculateOrderTotal,
  validateChangeAmount,
} from "../modules/ordering/domain/calculate-order-total.ts";
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

test("admin authorization is deny-by-default and case-insensitive", () => {
  const previous = process.env.ADMIN_EMAILS;
  delete process.env.ADMIN_EMAILS;
  assert.equal(isAuthorizedAdmin("owner@example.com"), false);

  process.env.ADMIN_EMAILS = "owner@example.com, Operacao@Example.com";
  assert.equal(isAuthorizedAdmin("operacao@example.com"), true);
  assert.equal(isAuthorizedAdmin("unknown@example.com"), false);

  if (previous === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = previous;
});
