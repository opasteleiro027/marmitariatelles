import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adminPasswordMatches } from "../modules/admin-auth/domain/password-credential.ts";
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
import {
  getOrderReportDateRange,
  parseOrderReportPeriod,
} from "../modules/ordering/domain/order-report-period.ts";
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
import {
  lookupPostalCode,
  PostalCodeLookupError,
} from "../modules/address-location/infrastructure/via-cep-client.ts";
import {
  assertTestOrderResetConfirmation,
  TEST_ORDER_RESET_CONFIRMATION,
} from "../modules/ordering/application/test-order-history-reset/reset-test-order-history.ts";

test("protects the complete test-order history reset", async () => {
  assert.doesNotThrow(() =>
    assertTestOrderResetConfirmation(TEST_ORDER_RESET_CONFIRMATION),
  );
  assert.throws(
    () => assertTestOrderResetConfirmation("apagar"),
    /confirmação exatamente/,
  );

  const resetSource = await readFile(
    new URL(
      "../modules/ordering/application/test-order-history-reset/reset-test-order-history.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(resetSource, /o\.status <> 'cancelled'/);
  assert.match(resetSource, /DELETE FROM order_item_addons/);
  assert.match(resetSource, /DELETE FROM orders RETURNING id/);
  assert.match(resetSource, /DELETE FROM customers RETURNING id/);
  assert.doesNotMatch(
    resetSource,
    /DELETE FROM (products|business_settings|admin_users)/,
  );
});

test("formats monetary values stored as integer cents", () => {
  assert.match(formatMoney(2850), /28,50/);
});

test("builds daily, weekly and monthly report ranges in Sao Paulo time", () => {
  const now = new Date("2026-07-28T15:00:00.000Z");
  assert.deepEqual(getOrderReportDateRange("day", now), {
    startDate: "2026-07-28",
    endDate: "2026-07-29",
    label: "Hoje, 28 de julho de 2026",
  });
  assert.deepEqual(getOrderReportDateRange("week", now), {
    startDate: "2026-07-27",
    endDate: "2026-08-03",
    label: "Semana de 27/07 a 02/08",
  });
  assert.deepEqual(getOrderReportDateRange("month", now), {
    startDate: "2026-07-01",
    endDate: "2026-08-01",
    label: "Julho de 2026",
  });
  assert.equal(parseOrderReportPeriod("week"), "week");
  assert.equal(parseOrderReportPeriod("invalid"), "day");
});

test("ships detailed customer profile reports in the admin overview", async () => {
  const [overview, reportQuery, adminPage] = await Promise.all([
    readFile(
      new URL(
        "../modules/admin/ui/admin-overview/AdminOverview.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/ordering/application/admin-order-report.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/admin/(panel)/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(overview, /Fechamento do expediente/);
  assert.match(overview, /Ticket médio/);
  assert.match(overview, /Cliente que mais pediu/);
  assert.match(overview, /Bairros atendidos/);
  assert.match(overview, /Formas de pagamento/);
  assert.match(reportQuery, /America\/Sao_Paulo/);
  assert.match(reportQuery, /customer_addresses/);
  assert.match(reportQuery, /returning_customers/);
  assert.match(adminPage, /getAdminOrderReport/);
  assert.match(adminPage, /periodo/);
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

test("refreshes active customer order tracking every five seconds", async () => {
  const [trackingPage, trackingRefresh] = await Promise.all([
    readFile(
      new URL("../app/pedido/[token]/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/ordering/ui/order-tracking-refresh/OrderTrackingRefresh.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(trackingPage, /OrderTrackingRefresh/);
  assert.match(trackingPage, /status !== "delivered"/);
  assert.match(trackingPage, /status !== "cancelled"/);
  assert.match(trackingRefresh, /POLLING_INTERVAL_MS = 5_000/);
  assert.match(trackingRefresh, /router\.refresh\(\)/);
  assert.match(trackingRefresh, /visibilitychange/);
});

test("ships an 80 mm browser-printable administrative order slip", async () => {
  const [orderList, printButton, adminOrders] = await Promise.all([
    readFile(
      new URL(
        "../modules/ordering/ui/admin-order-list/AdminOrderList.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/ordering/ui/order-print-button/OrderPrintButton.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/ordering/application/admin-orders.ts",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(orderList, /OrderPrintButton/);
  assert.match(printButton, /size: 80mm auto/);
  assert.match(printButton, /printWindow\.print\(\)/);
  assert.match(printButton, /Imprimir comanda/);
  assert.match(printButton, /Troco para/);
  assert.match(printButton, /<section[\s\S]*data-receipt/);
  assert.doesNotMatch(printButton, /\{addon\.groupName\}:/);
  assert.match(printButton, /\{addon\.name\}/);
  assert.match(adminOrders, /address_snapshot/);
  assert.match(adminOrders, /change_for_cents/);
});

test("ships the selected MP3 used by the new-order alert", async () => {
  const audio = await readFile(
    new URL("../public/audio/new-order.mp3", import.meta.url),
  );
  assert.ok(audio.length > 250_000);
  assert.equal(audio[0], 0xff);
  assert.equal(audio[1], 0xfb);
});

test("uses the official optimized logo across the application", async () => {
  const [mark, logo, brandComponent, publicHeader, adminShell, login, tracking] =
    await Promise.all([
      readFile(
        new URL(
          "../public/brand/marmitaria-telles-mark.png",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../public/brand/marmitaria-telles-logo.png",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../modules/brand/ui/brand-logo/BrandLogo.tsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../modules/storefront/ui/site-header/SiteHeader.tsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../modules/admin/ui/admin-shell/AdminShell.tsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../app/pedido/[token]/page.tsx", import.meta.url),
        "utf8",
      ),
    ]);
  assert.ok(mark.length > 50_000 && mark.length < 200_000);
  assert.ok(logo.length > 50_000 && logo.length < 200_000);
  assert.match(brandComponent, /marmitaria-telles-mark\.png/);
  for (const surface of [publicHeader, adminShell, login, tracking]) {
    assert.match(surface, /BrandLogo/);
    assert.doesNotMatch(surface, />MT</);
  }
});

test("admin navigation uses dedicated routes instead of page anchors", async () => {
  const navigation = await readFile(
    new URL(
      "../modules/admin/ui/admin-navigation/AdminNavigation.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  for (const route of [
    'href: "/admin"',
    'href: "/admin/pedidos"',
    'href: "/admin/cardapio"',
    'href: "/admin/areas-entrega"',
    'href: "/admin/configuracoes"',
  ]) {
    assert.match(navigation, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(navigation, /href:\s*["']#/);
});

test("admin can edit the storefront operating-hours label", async () => {
  const [application, action, form, storefront] = await Promise.all([
    readFile(
      new URL(
        "../modules/establishment/application/admin-establishment.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/establishment/server/establishment-actions.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/establishment/ui/business-settings-management/BusinessSettingsManagement.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/storefront/infrastructure/storefront.repository.ts",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(application, /delivery_window_label/);
  assert.match(action, /required\(formData, "deliveryWindowLabel"\)/);
  assert.match(form, /name="deliveryWindowLabel"/);
  assert.match(form, /Horário de funcionamento/);
  assert.match(storefront, /settings\.delivery_window_label/);
});

test("public navigation keeps the ordering journey focused", async () => {
  const navigation = await readFile(
    new URL(
      "../modules/storefront/ui/site-header/SiteHeader.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  for (const route of ['href: "/"', 'href: "/cardapio"']) {
    assert.match(navigation, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(navigation, /href: "\/como-funciona"/);
  assert.doesNotMatch(navigation, /href: "\/contato"/);
  assert.doesNotMatch(navigation, /href:\s*["']#/);
});

test("ships the Stitch menu hero and the seven-step marmita builder", async () => {
  const [hero, builder, configurator, configuratorParts] = await Promise.all([
    readFile(
      new URL("../public/images/menu-builder-hero.png", import.meta.url),
    ),
    readFile(
      new URL(
        "../modules/storefront/ui/menu-builder/MenuBuilder.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/storefront/ui/marmita-configurator/MarmitaConfigurator.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/storefront/ui/marmita-configurator/MarmitaConfiguratorParts.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.ok(hero.length > 1_000_000);
  assert.match(builder, /categories\.map/);
  assert.match(builder, /MarmitaConfigurator/);
  assert.match(builder, /FINALIZAR PEDIDO/);
  assert.match(configurator, /Escolha o tamanho/);
  assert.match(configurator, /Alguma observação/);
  assert.match(configurator, /const \[sizeId, setSizeId\] = useState\(""\)/);
  assert.match(configurator, /sizeId === candidate\.id \? "✔️" : "▤"/);
  assert.match(configurator, /function continueShopping/);
  assert.match(configurator, /setSizeId\(""\)/);
  assert.match(configuratorParts, /CONTINUAR COMPRANDO/);
  assert.match(configuratorParts, /Complete sua marmita/);
  assert.match(configuratorParts, /group\.role === "base"/);
  assert.match(configuratorParts, /group\.role === "beans"/);
  assert.match(configuratorParts, /selected \? "✓" : "\+"/);
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

test("uses a second CEP provider and never exposes a raw fetch error", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes("brasilapi.com.br")) {
        throw new TypeError("fetch failed");
      }
      return Response.json({
        cep: "29166-650",
        logradouro: "Rua dos Rouxinóis",
        bairro: "Morada de Laranjeiras",
        localidade: "Serra",
        uf: "ES",
      });
    };
    const address = await lookupPostalCode("29166-650");
    assert.equal(address.neighborhood, "Morada de Laranjeiras");
    assert.equal(address.city, "Serra");

    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    await assert.rejects(
      () => lookupPostalCode("29166-650"),
      (reason) =>
        reason instanceof PostalCodeLookupError &&
        !reason.message.toLowerCase().includes("fetch failed") &&
        reason.message.includes("Preencha o endereço manualmente"),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
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

test("admin individual password credentials use salted scrypt hashes", () => {
  const salt = "salt-de-teste";
  const hash = scryptSync("senha-correta", salt, 64).toString("hex");

  assert.equal(adminPasswordMatches("senha-correta", salt, hash), true);
  assert.equal(adminPasswordMatches("senha-incorreta", salt, hash), false);
  assert.equal(adminPasswordMatches("senha-correta", salt, "inválido"), false);
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
    notes: "Sem cebola, por favor.",
    items: [
      { productId: "marmita", quantity: 1 },
      { productId: "marmita", quantity: 2 },
    ],
  });
  assert.equal(request.customer.phone, "27999999999");
  assert.deepEqual(request.items, [
    {
      productId: "marmita",
      quantity: 3,
      notes: null,
      selections: [],
    },
  ]);
  assert.equal(request.changeForInCents, 5000);
  assert.equal(request.notes, "Sem cebola, por favor.");
});

test("keeps differently configured marmitas as separate order lines", () => {
  const request = parseOrderRequest({
    idempotencyKey: "tentativa-montagem",
    customer: { name: "Cliente", phone: "27999999999" },
    fulfillment: "pickup",
    deliverySlotId: "slot-1",
    paymentMethodId: "cash",
    items: [
      {
        productId: "marmita-media",
        quantity: 1,
        notes: "Sem cebola",
        selections: [
          { optionId: "base-arroz-branco", quantity: 1 },
          { optionId: "protein-frango", quantity: 1 },
        ],
      },
      {
        productId: "marmita-media",
        quantity: 1,
        notes: "",
        selections: [
          { optionId: "base-arroz-integral", quantity: 1 },
          { optionId: "protein-bife", quantity: 1 },
        ],
      },
    ],
  });
  assert.equal(request.items.length, 2);
  assert.equal(request.items[0].notes, "Sem cebola");
  assert.equal(request.items[1].selections[1].optionId, "protein-bife");
});

test("limits the customer order observation to 500 characters", () => {
  assert.throws(
    () =>
      parseOrderRequest({
        idempotencyKey: "tentativa-observacao",
        customer: { name: "Cliente", phone: "27999999999" },
        fulfillment: "pickup",
        deliverySlotId: "slot-1",
        paymentMethodId: "cash",
        notes: "x".repeat(501),
        items: [{ productId: "marmita", quantity: 1 }],
      }),
    OrderRequestError,
  );
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
