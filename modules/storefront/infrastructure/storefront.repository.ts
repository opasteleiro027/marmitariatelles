import { env } from "cloudflare:workers";
import { nextSundayLabel } from "../domain/next-sales-date";
import type {
  StorefrontProduct,
  StorefrontSnapshot,
} from "../domain/storefront.types";

const previewProducts: StorefrontProduct[] = [
  {
    id: "marmita-pequena",
    name: "Marmita pequena",
    description: "Arroz, feijão, proteína do dia e dois acompanhamentos.",
    priceInCents: 2200,
    promotionalPriceInCents: null,
    category: "Marmitas",
    featured: false,
    available: true,
  },
  {
    id: "marmita-media",
    name: "Marmita média",
    description: "A medida certa de comida caseira para um domingo gostoso.",
    priceInCents: 2800,
    promotionalPriceInCents: 2600,
    category: "Marmitas",
    featured: true,
    available: true,
  },
  {
    id: "marmita-grande",
    name: "Marmita grande",
    description: "Porção generosa com proteína e acompanhamentos à escolha.",
    priceInCents: 3400,
    promotionalPriceInCents: null,
    category: "Marmitas",
    featured: false,
    available: true,
  },
  {
    id: "coca-cola-lata",
    name: "Coca-Cola lata",
    description: "350 ml, bem gelada.",
    priceInCents: 600,
    promotionalPriceInCents: null,
    category: "Bebidas",
    featured: false,
    available: true,
  },
  {
    id: "guarana-lata",
    name: "Guaraná lata",
    description: "350 ml, bem gelado.",
    priceInCents: 550,
    promotionalPriceInCents: null,
    category: "Bebidas",
    featured: false,
    available: true,
  },
  {
    id: "pudim",
    name: "Pudim da casa",
    description: "Fatia cremosa com calda de caramelo.",
    priceInCents: 900,
    promotionalPriceInCents: null,
    category: "Sobremesas",
    featured: false,
    available: true,
  },
];

const setupStatements = [
  `CREATE TABLE IF NOT EXISTS business_settings (
    id TEXT PRIMARY KEY NOT NULL,
    business_name TEXT NOT NULL,
    welcome_message TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    minimum_order_cents INTEGER NOT NULL DEFAULT 0,
    order_deadline_label TEXT NOT NULL,
    delivery_window_label TEXT NOT NULL,
    notice TEXT NOT NULL,
    orders_paused INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    promotional_price_cents INTEGER,
    featured INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    sold_out INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
];

function safePreviewSnapshot(): StorefrontSnapshot {
  return {
    businessName: "Domingo na Mesa",
    welcomeMessage: "Comida caseira, caprichada e pronta para o seu domingo.",
    ordersOpen: true,
    salesDateLabel: nextSundayLabel(),
    orderDeadlineLabel: "Pedidos até 10h30",
    deliveryWindowLabel: "Entregas das 11h às 14h",
    minimumOrderInCents: 2000,
    notice: "Taxa de entrega calculada conforme o bairro.",
    whatsapp: "5511999999999",
    products: previewProducts,
    source: "safe-preview",
  };
}

async function ensureFoundationData(database: D1Database): Promise<void> {
  await database.batch(
    setupStatements.map((statement) => database.prepare(statement)),
  );

  const timestamp = new Date().toISOString();
  await database.batch([
    database
      .prepare(
        `INSERT OR IGNORE INTO business_settings
        (id, business_name, welcome_message, whatsapp, minimum_order_cents,
          order_deadline_label, delivery_window_label, notice, orders_paused, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        "default",
        "Domingo na Mesa",
        "Comida caseira, caprichada e pronta para o seu domingo.",
        "5511999999999",
        2000,
        "Pedidos até 10h30",
        "Entregas das 11h às 14h",
        "Taxa de entrega calculada conforme o bairro.",
        0,
        timestamp,
      ),
    ...["Marmitas", "Bebidas", "Sobremesas"].map((name, index) =>
      database
        .prepare(
          `INSERT OR IGNORE INTO categories
          (id, name, display_order, active, created_at) VALUES (?, ?, ?, 1, ?)`,
        )
        .bind(`category-${index + 1}`, name, index + 1, timestamp),
    ),
    ...previewProducts.map((product, index) => {
      const categoryId =
        product.category === "Marmitas"
          ? "category-1"
          : product.category === "Bebidas"
            ? "category-2"
            : "category-3";
      return database
        .prepare(
          `INSERT OR IGNORE INTO products
          (id, category_id, name, description, price_cents,
            promotional_price_cents, featured, active, sold_out,
            display_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`,
        )
        .bind(
          product.id,
          categoryId,
          product.name,
          product.description,
          product.priceInCents,
          product.promotionalPriceInCents,
          product.featured ? 1 : 0,
          index + 1,
          timestamp,
          timestamp,
        );
    }),
  ]);
}

export async function getStorefrontSnapshot(): Promise<StorefrontSnapshot> {
  try {
    if (!env.DB) return safePreviewSnapshot();
    await ensureFoundationData(env.DB);

    const settings = await env.DB.prepare(
      "SELECT * FROM business_settings WHERE id = ?",
    )
      .bind("default")
      .first<Record<string, string | number>>();

    const result = await env.DB.prepare(
      `SELECT p.id, p.name, p.description, p.price_cents,
        p.promotional_price_cents, p.featured, p.active, p.sold_out,
        c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.active = 1 AND c.active = 1
      ORDER BY c.display_order, p.display_order`,
    ).all<Record<string, string | number | null>>();

    if (!settings) return safePreviewSnapshot();

    return {
      businessName: String(settings.business_name),
      welcomeMessage: String(settings.welcome_message),
      ordersOpen: Number(settings.orders_paused) === 0,
      salesDateLabel: nextSundayLabel(),
      orderDeadlineLabel: String(settings.order_deadline_label),
      deliveryWindowLabel: String(settings.delivery_window_label),
      minimumOrderInCents: Number(settings.minimum_order_cents),
      notice: String(settings.notice),
      whatsapp: String(settings.whatsapp),
      products: result.results.map(
        (row: Record<string, string | number | null>) => ({
        id: String(row.id),
        name: String(row.name),
        description: String(row.description),
        priceInCents: Number(row.price_cents),
        promotionalPriceInCents:
          row.promotional_price_cents === null
            ? null
            : Number(row.promotional_price_cents),
        category: String(row.category_name),
        featured: Number(row.featured) === 1,
        available: Number(row.active) === 1 && Number(row.sold_out) === 0,
        }),
      ),
      source: "database",
    };
  } catch {
    return safePreviewSnapshot();
  }
}
