import seedData from "@/db/seed-data.json";
import { getDatabase } from "@/db";
import {
  dateKeyInSaoPaulo,
  formatSalesDateLabel,
} from "@/modules/sales-calendar/domain/operational-date";
import { nextSundayLabel } from "../domain/next-sales-date";
import type {
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
  capacity: number;
  reserved_count: number;
};

type PaymentMethodRow = {
  id: string;
  code: string;
  label: string;
};

type SalesMenuRow = {
  sales_date: string;
  ordering_opens_at: string;
  ordering_closes_at: string;
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
  return {
    businessName: seedData.settings.businessName,
    welcomeMessage: seedData.settings.welcomeMessage,
    ordersOpen: !seedData.settings.ordersPaused,
    salesDateLabel: nextSundayLabel(),
    orderDeadlineLabel: seedData.settings.orderDeadlineLabel,
    deliveryWindowLabel: seedData.settings.deliveryWindowLabel,
    minimumOrderInCents: seedData.settings.minimumOrderCents,
    notice: seedData.settings.notice,
    whatsapp: seedData.settings.whatsapp,
    phone: seedData.settings.phone,
    address: seedData.settings.address,
    products: previewProducts(),
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
    const now = new Date().toISOString();
    const today = dateKeyInSaoPaulo();
    const menu = await database
      .prepare(
        `SELECT sales_date, ordering_opens_at, ordering_closes_at
         FROM sales_menus
         WHERE published = TRUE AND closed_manually = FALSE
         ORDER BY
           CASE
             WHEN ordering_opens_at <= ? AND ordering_closes_at >= ? THEN 0
             WHEN sales_date >= ? THEN 1
             ELSE 2
           END,
           CASE WHEN sales_date >= ? THEN sales_date END ASC,
           sales_date DESC
         LIMIT 1`,
      )
      .bind(now, now, today, today)
      .first<SalesMenuRow>();

    const [result, areas, slots, methods] = await Promise.all([
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
        `SELECT id, starts_at, ends_at, capacity, reserved_count
        FROM delivery_slots
        WHERE active = TRUE AND sales_date = ?
        ORDER BY starts_at`,
      ).bind(menu?.sales_date ?? "").all<DeliverySlotRow>(),
      database.prepare(
        `SELECT id, code, label
        FROM payment_methods
        WHERE active = TRUE
        ORDER BY display_order`,
      ).all<PaymentMethodRow>(),
    ]);

    if (!settings) return safePreviewSnapshot();

    return {
      businessName: settings.business_name,
      welcomeMessage: settings.welcome_message,
      ordersOpen:
        !settings.orders_paused &&
        Boolean(
          menu &&
            menu.ordering_opens_at <= now &&
            menu.ordering_closes_at >= now,
        ),
      salesDateLabel: menu
        ? formatSalesDateLabel(menu.sales_date)
        : nextSundayLabel(),
      orderDeadlineLabel: settings.order_deadline_label,
      deliveryWindowLabel: settings.delivery_window_label,
      minimumOrderInCents: settings.minimum_order_cents,
      notice: settings.notice,
      whatsapp: settings.whatsapp,
      phone: settings.phone ?? seedData.settings.phone,
      address: settings.address ?? seedData.settings.address,
      products: result.results.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        priceInCents: row.price_cents,
        promotionalPriceInCents: row.promotional_price_cents,
        category: row.category_name,
        featured: row.featured,
        available: row.active && !row.sold_out,
      })),
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
        available: slot.reserved_count < slot.capacity,
      })),
      paymentMethods: methods.results,
      source: "database",
    };
  } catch {
    return safePreviewSnapshot();
  }
}
