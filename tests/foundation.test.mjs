import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
import { selectAutomaticDeliverySlot } from "../modules/ordering/domain/select-automatic-delivery-slot.ts";
import { classifyOrderPulse } from "../modules/ordering/domain/order-pulse.ts";
import { formatMoney } from "../modules/storefront/domain/format-money.ts";
import { siteAcceptsOrders } from "../modules/establishment/domain/site-availability.ts";
import { mapNominatimAddress } from "../modules/address-location/domain/map-nominatim-address.ts";
import { describeAddressAreaResult } from "../modules/address-location/domain/describe-address-area-result.ts";
import { findMatchingDeliveryArea } from "../modules/address-location/domain/match-delivery-area.ts";
import {
  normalizeLocationName,
  normalizePostalCode,
} from "../modules/address-location/domain/normalize-location-name.ts";
import { validateCoordinates } from "../modules/address-location/domain/validate-coordinates.ts";

test("formats monetary values stored as integer cents", () => {
  assert.match(formatMoney(2850), /28,50/);
});

test("detects a new order separately from other panel changes", () => {
  const previous = {
    totalOrders: 4,
    latestOrderId: "order-4",
    version: "4:2026-07-28T12:00:00.000Z",
  };
  assert.equal(
    classifyOrderPulse(previous, {
      totalOrders: 5,
      latestOrderId: "order-5",
      version: "5:2026-07-28T12:01:00.000Z",
    }),
    "new-order",
  );
  assert.equal(
    classifyOrderPulse(previous, {
      ...previous,
      version: "4:2026-07-28T12:02:00.000Z",
    }),
    "changed",
  );
  assert.equal(classifyOrderPulse(previous, previous), "unchanged");
});

test("uses only the site switch to release or block orders", () => {
  assert.equal(
    siteAcceptsOrders({
      ordersPaused: false,
      operationalMenuAvailable: true,
    }),
    true,
  );
  assert.equal(
    siteAcceptsOrders({
      ordersPaused: true,
      operationalMenuAvailable: true,
    }),
    false,
  );
  assert.equal(
    siteAcceptsOrders({
      ordersPaused: false,
      operationalMenuAvailable: false,
    }),
    false,
  );
});

test("keeps exactly one internal operational menu", async () => {
  const migration = await readFile(
    new URL(
      "../drizzle-postgres/0002_operational_site_switch.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /sales_menus_one_operational/i);
  assert.match(migration, /WHERE "operational" = TRUE/i);
});

test("normalizes Brazilian location names and postal codes", () => {
  assert.equal(normalizeLocationName("Bairro Setor América"), "america");
  assert.equal(normalizePostalCode("29.160-123"), "29160123");
});

test("validates geographic coordinate ranges", () => {
  assert.deepEqual(validateCoordinates("-20.2", "-40.3"), {
    latitude: -20.2,
    longitude: -40.3,
  });
  assert.throws(() => validateCoordinates("-91", "-40"), /Coordenadas/);
});

test("maps an OpenStreetMap response into the checkout address", () => {
  assert.deepEqual(
    mapNominatimAddress({
      house_number: "16",
      road: "Avenida Bartolomeu de Las Casas",
      suburb: "Setor América",
      city: "Serra",
      state: "Espírito Santo",
      postcode: "29160-123",
      country_code: "br",
    }),
    {
      postalCode: "29160123",
      street: "Avenida Bartolomeu de Las Casas",
      number: "16",
      neighborhood: "Setor América",
      city: "Serra",
      state: "ES",
      approximate: true,
      attribution: "Endereço aproximado por OpenStreetMap",
    },
  );
});

test("matches a located address to an exact configured delivery area", () => {
  const area = findMatchingDeliveryArea(
    { neighborhood: "Setor América", city: "Serra" },
    [
      { id: "area-1", neighborhood: "América", city: "Serra" },
      { id: "area-2", neighborhood: "Centro", city: "Vitória" },
    ],
  );
  assert.equal(area?.id, "area-1");
});

test("does not assign a delivery area when the located neighborhood is not served", () => {
  const area = findMatchingDeliveryArea(
    { neighborhood: "Sé", city: "São Paulo" },
    [{ id: "area-1", neighborhood: "América", city: "Serra" }],
  );
  assert.equal(area, null);
  assert.deepEqual(describeAddressAreaResult("Sé", area, "postal-code"), {
    kind: "error",
    message:
      'Bairro "Sé" preenchido, mas ele ainda não está em uma área de entrega cadastrada.',
  });
});

test("reports the automatically filled neighborhood and delivery fee", () => {
  assert.deepEqual(
    describeAddressAreaResult(
      "Setor América",
      { formattedFee: "R$ 2,50" },
      "postal-code",
    ),
    {
      kind: "success",
      message:
        "Bairro preenchido automaticamente: Setor América. Taxa de R$ 2,50.",
    },
  );
});

test("keeps historical orders when a delivery area is deleted", async () => {
  const migration = await readFile(
    new URL(
      "../drizzle-postgres/0001_delivery_area_delete_set_null.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /ON DELETE SET NULL/i);
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

test("assigns the first available operational slot to home delivery", () => {
  assert.equal(
    selectAutomaticDeliverySlot([
      { id: "slot-full", available: false },
      { id: "slot-first", available: true },
      { id: "slot-second", available: true },
    ]),
    "slot-first",
  );
  assert.equal(
    selectAutomaticDeliverySlot([{ id: "slot-full", available: false }]),
    "",
  );
});
