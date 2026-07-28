import seedData from "@/db/seed-data.json";
import { getDatabase } from "@/db";
import { siteAcceptsOrders } from "@/modules/establishment/domain/site-availability";
import type {
  StorefrontMarmitaGroup,
  StorefrontMarmitaSize,
  StorefrontProduct,
  StorefrontSnapshot,
} from "../domain/storefront.types";

type SettingsRow = {
  business_name: string;
  welcome_message: string;
  whatsapp: string;
  phone: string | null;
  address: string | null;
  minimum_order_cents: number;
  order_deadline_label: string;
  delivery_window_label: string;
  notice: string;
  orders_paused: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  promotional_price_cents: number | null;
  featured: boolean;
  active: boolean;
  sold_out: boolean;
  category_name: string;
};

type DeliveryAreaRow = {
  id: string;
  city: string;
  neighborhood: string;
  delivery_fee_cents: number;
  minimum_order_cents: number;
};

type DeliverySlotRow = {
  id: string;
  starts_at: string;
  ends_at: string;
};

type PaymentMethodRow = {
  id: string;
  code: string;
  label: string;
};

type SalesMenuRow = {
  sales_date: string;
};

type BuilderGroupRow = {
  id: string;
  builder_role: StorefrontMarmitaGroup["role"];
  name: string;
  selection_type: StorefrontMarmitaGroup["selectionType"];
};

type BuilderOptionRow = {
  id: string;
  group_id: string;
  name: string;
  additional_price_cents: number;
  active: boolean;
  sold_out: boolean;
};

type BuilderLinkRow = {
  product_id: string;
  group_id: string;
  minimum_selections: number;
  maximum_selections: number;
};

function previewProducts(): StorefrontProduct[] {
  const categoryNames = new Map(
    seedData.categories.map((category) => [category.id, category.name]),
  );
  return seedData.products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    priceInCents: product.priceCents,
    promotionalPriceInCents: product.promotionalPriceCents,
    category: categoryNames.get(product.categoryId) ?? "Cardápio",
    featured: product.featured,
    available: true,
  }));
}

function safePreviewSnapshot(): StorefrontSnapshot {
  const products = previewProducts();
  return {
    businessName: seedData.settings.businessName,
    welcomeMessage: seedData.settings.welcomeMessage,
    ordersOpen: false,
    deliveryWindowLabel: seedData.settings.deliveryWindowLabel,
    minimumOrderInCents: seedData.settings.minimumOrderCents,
    notice: seedData.settings.notice,
    whatsapp: seedData.settings.whatsapp,
    phone: seedData.settings.phone,
    address: seedData.settings.address,
    products,
    marmitaBuilder: previewMarmitaBuilder(products),
    deliveryAreas: [],
    deliverySlots: [
      { id: "preview-slot-1", label: "11h às 12h", available: true },
      { id: "preview-slot-2", label: "12h às 13h", available: true },
      { id: "preview-slot-3", label: "13h às 14h", available: true },
    ],
    paymentMethods: seedData.paymentMethods.map((method) => ({
      id: method.id,
      code: method.code,
      label: method.label,
    })),
    source: "safe-preview",
  };
}

export async function getStorefrontSnapshot(): Promise<StorefrontSnapshot> {
  try {
    const database = getDatabase();
    const settings = await database
      .prepare("SELECT * FROM business_settings WHERE id = ?")
      .bind("default")
      .first<SettingsRow>();
    const menu = await database
      .prepare(
        `SELECT sales_date
         FROM sales_menus
         WHERE operational = TRUE
         LIMIT 1`,
      )
      .first<SalesMenuRow>();

    const [result, areas, slots, methods, builderGroups, builderOptions, builderLinks] =
      await Promise.all([
      database.prepare(
        `SELECT p.id, p.name, p.description, p.price_cents,
          p.promotional_price_cents, p.featured, p.active, p.sold_out,
          c.name AS category_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.active = TRUE AND c.active = TRUE
        ORDER BY c.display_order, p.display_order`,
      ).all<ProductRow>(),
      database.prepare(
        `SELECT id, city, neighborhood, delivery_fee_cents,
          minimum_order_cents
        FROM delivery_areas
        WHERE active = TRUE
        ORDER BY display_order, neighborhood`,
      ).all<DeliveryAreaRow>(),
      database.prepare(
        `SELECT DISTINCT ON (starts_at, ends_at) id, starts_at, ends_at
        FROM delivery_slots
        WHERE active = TRUE AND sales_date = ?
        ORDER BY starts_at, ends_at, id`,
      ).bind(menu?.sales_date ?? "").all<DeliverySlotRow>(),
      database.prepare(
        `SELECT id, code, label
        FROM payment_methods
        WHERE active = TRUE
        ORDER BY display_order`,
      ).all<PaymentMethodRow>(),
      database.prepare(
        `SELECT id, builder_role, name, selection_type
         FROM addon_groups
         WHERE builder_role IS NOT NULL AND active = TRUE
         ORDER BY CASE builder_role
           WHEN 'base' THEN 1 WHEN 'beans' THEN 2 WHEN 'protein' THEN 3
           WHEN 'side' THEN 4 ELSE 5 END`,
      ).all<BuilderGroupRow>(),
      database.prepare(
        `SELECT ao.id, ao.group_id, ao.name, ao.additional_price_cents,
                ao.active, ao.sold_out
         FROM addon_options ao
         JOIN addon_groups ag ON ag.id = ao.group_id
         WHERE ag.builder_role IS NOT NULL
         ORDER BY ao.display_order, ao.name`,
      ).all<BuilderOptionRow>(),
      database.prepare(
        `SELECT pag.product_id, pag.group_id,
                COALESCE(pag.minimum_selections, ag.minimum_selections)
                  AS minimum_selections,
                COALESCE(pag.maximum_selections, ag.maximum_selections)
                  AS maximum_selections
         FROM product_addon_groups pag
         JOIN addon_groups ag ON ag.id = pag.group_id
         WHERE ag.builder_role IS NOT NULL AND ag.active = TRUE`,
      ).all<BuilderLinkRow>(),
    ]);

    if (!settings) return safePreviewSnapshot();

    const products = result.results.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      priceInCents: row.price_cents,
      promotionalPriceInCents: row.promotional_price_cents,
      category: row.category_name,
      featured: row.featured,
      available: row.active && !row.sold_out,
    }));

    return {
      businessName: settings.business_name,
      welcomeMessage: settings.welcome_message,
      ordersOpen: siteAcceptsOrders({
        ordersPaused: settings.orders_paused,
        operationalMenuAvailable: Boolean(menu),
      }),
      deliveryWindowLabel: settings.delivery_window_label,
      minimumOrderInCents: settings.minimum_order_cents,
      notice: settings.notice,
      whatsapp: settings.whatsapp,
      phone: settings.phone ?? seedData.settings.phone,
      address: settings.address ?? seedData.settings.address,
      products,
      marmitaBuilder: buildMarmitaBuilder(
        products,
        builderGroups.results,
        builderOptions.results,
        builderLinks.results,
      ),
      deliveryAreas: areas.results.map((area) => ({
        id: area.id,
        label: `${area.neighborhood}, ${area.city}`,
        neighborhood: area.neighborhood,
        city: area.city,
        deliveryFeeInCents: area.delivery_fee_cents,
        minimumOrderInCents: area.minimum_order_cents,
      })),
      deliverySlots: slots.results.map((slot) => ({
        id: slot.id,
        label: `${slot.starts_at.slice(0, 5).replace(":", "h")} às ${slot.ends_at
          .slice(0, 5)
          .replace(":", "h")}`,
        available: true,
      })),
      paymentMethods: methods.results,
      source: "database",
    };
  } catch (reason) {
    console.warn(
      "Falha ao carregar o storefront; usando o preview seguro.",
      reason,
    );
    return safePreviewSnapshot();
  }
}

function buildMarmitaBuilder(
  products: StorefrontProduct[],
  groupRows: BuilderGroupRow[],
  optionRows: BuilderOptionRow[],
  linkRows: BuilderLinkRow[],
) {
  const linkedProductIds = new Set(linkRows.map((link) => link.product_id));
  const sizes: StorefrontMarmitaSize[] = products
    .filter((product) => linkedProductIds.has(product.id))
    .map((product) => ({
      ...product,
      limits: Object.fromEntries(
        linkRows
          .filter((link) => link.product_id === product.id)
          .map((link) => [
            link.group_id,
            {
              minimum: link.minimum_selections,
              maximum: link.maximum_selections,
            },
          ]),
      ),
    }));
  const groups: StorefrontMarmitaGroup[] = groupRows.map((group) => ({
    id: group.id,
    role: group.builder_role,
    name: group.name,
    selectionType: group.selection_type,
    options: optionRows
      .filter((option) => option.group_id === group.id)
      .map((option) => ({
        id: option.id,
        name: option.name,
        additionalPriceInCents: option.additional_price_cents,
        available: option.active && !option.sold_out,
      })),
  }));
  return { sizes, groups };
}

function previewMarmitaBuilder(products: StorefrontProduct[]) {
  const groups = seedData.marmitaBuilder.groups.map((group) => ({
    id: group.id,
    role: group.role as StorefrontMarmitaGroup["role"],
    name: group.name,
    selectionType: group.selectionType as StorefrontMarmitaGroup["selectionType"],
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      additionalPriceInCents: option.additionalPriceCents,
      available: true,
    })),
  }));
  const sizes = products
    .filter((product) => product.id in seedData.marmitaBuilder.sizeLimits)
    .map((product) => {
      const sizeLimits =
        seedData.marmitaBuilder.sizeLimits[
          product.id as keyof typeof seedData.marmitaBuilder.sizeLimits
        ];
      return {
        ...product,
        limits: Object.fromEntries(
          groups.map((group) => [
            group.id,
            {
              minimum: group.role === "extra" ? 0 : 1,
              maximum:
                group.role === "protein"
                  ? sizeLimits.protein
                  : group.role === "side"
                    ? sizeLimits.side
                    : group.role === "extra"
                      ? 10
                      : 1,
            },
          ]),
        ),
      };
    });
  return { sizes, groups };
}
