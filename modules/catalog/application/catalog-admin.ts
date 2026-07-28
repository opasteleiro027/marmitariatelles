import { getPostgresClient } from "@/db";

export type AdminCategory = {
  id: string;
  name: string;
};

export type AdminCatalogProduct = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  priceInCents: number;
  promotionalPriceInCents: number | null;
  active: boolean;
  soldOut: boolean;
  featured: boolean;
};

export async function getAdminCatalog() {
  const database = getPostgresClient();
  const [categories, products] = await Promise.all([
    database<AdminCategory[]>`
      SELECT id, name
      FROM categories
      WHERE active = TRUE
      ORDER BY display_order, name
    `,
    database<AdminCatalogProduct[]>`
      SELECT
        p.id,
        p.category_id AS "categoryId",
        c.name AS "categoryName",
        p.name,
        p.description,
        p.price_cents AS "priceInCents",
        p.promotional_price_cents AS "promotionalPriceInCents",
        p.active,
        p.sold_out AS "soldOut",
        p.featured
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL
      ORDER BY c.display_order, p.display_order, p.name
    `,
  ]);

  return {
    categories: Array.from(categories),
    products: Array.from(products),
  };
}

export async function createCatalogProduct(input: {
  categoryId: string;
  name: string;
  description: string;
  priceInCents: number;
}) {
  const database = getPostgresClient();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await database.begin(async (transaction) => {
    await transaction`
      INSERT INTO products
        (id, category_id, name, description, price_cents, featured, active,
          sold_out, notes_allowed, display_order, created_at, updated_at)
      VALUES
        (${id}, ${input.categoryId}, ${input.name}, ${input.description},
          ${input.priceInCents}, FALSE, TRUE, FALSE, TRUE, 999,
          ${timestamp}, ${timestamp})
    `;
    await transaction`
      INSERT INTO sales_menu_items
        (id, menu_id, product_id, available_quantity, sold_quantity,
          active, display_order)
      SELECT
        ${`menu-item-${id}`}, id, ${id}, 40, 0, TRUE, 999
      FROM sales_menus
      WHERE published = TRUE AND closed_manually = FALSE
      ORDER BY sales_date
      LIMIT 1
      ON CONFLICT (menu_id, product_id) DO NOTHING
    `;
  });
}

export async function updateCatalogProduct(input: {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceInCents: number;
  active: boolean;
}) {
  const database = getPostgresClient();
  await database`
    UPDATE products
    SET
      category_id = ${input.categoryId},
      name = ${input.name},
      description = ${input.description},
      price_cents = ${input.priceInCents},
      active = ${input.active},
      updated_at = ${new Date().toISOString()}
    WHERE id = ${input.id} AND deleted_at IS NULL
  `;
}

export async function setProductSoldOut(id: string, soldOut: boolean) {
  const database = getPostgresClient();
  await database`
    UPDATE products
    SET sold_out = ${soldOut}, updated_at = ${new Date().toISOString()}
    WHERE id = ${id} AND deleted_at IS NULL
  `;
}
