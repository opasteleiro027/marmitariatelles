import { getPostgresClient, withTransaction } from "@/db";

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
  builderEnabled: boolean;
  imageUrl: string | null;
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
        p.featured,
        (SELECT pi.storage_key FROM product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.display_order LIMIT 1) AS "imageUrl",
        EXISTS (
          SELECT 1
          FROM product_addon_groups pag
          JOIN addon_groups ag ON ag.id = pag.group_id
          WHERE pag.product_id = p.id AND ag.builder_role IS NOT NULL
        ) AS "builderEnabled"
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
  image?: UploadedProductImage | null;
}) {
  const database = getPostgresClient();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await database`
    INSERT INTO products
      (id, category_id, name, description, price_cents, featured, active,
        sold_out, notes_allowed, display_order, created_at, updated_at)
    VALUES
      (${id}, ${input.categoryId}, ${input.name}, ${input.description},
        ${input.priceInCents}, FALSE, TRUE, FALSE, TRUE, 999,
        ${timestamp}, ${timestamp})
  `;
  if (input.image) await saveProductImage(id, input.name, input.image);
}

export async function updateCatalogProduct(input: {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceInCents: number;
  active: boolean;
  image?: UploadedProductImage | null;
  removeImage?: boolean;
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
  if (input.image) {
    await saveProductImage(input.id, input.name, input.image);
  } else if (input.removeImage) {
    await database`
      DELETE FROM product_images
      WHERE product_id = ${input.id} AND display_order = 1
    `;
  }
}

export type UploadedProductImage = {
  data: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

async function saveProductImage(
  productId: string,
  productName: string,
  image: UploadedProductImage,
) {
  const database = getPostgresClient();
  const imageId = crypto.randomUUID();
  const cacheVersion = Date.now();
  const imageUrl = `/api/catalog/products/${encodeURIComponent(productId)}/image?v=${cacheVersion}`;

  await database.begin(async (transaction) => {
    await transaction`
      DELETE FROM product_images
      WHERE product_id = ${productId} AND display_order = 1
    `;
    await transaction`
      INSERT INTO product_images
        (id, product_id, storage_key, alt_text, display_order,
         image_data, content_type)
      VALUES
        (${imageId}, ${productId}, ${imageUrl}, ${productName}, 1,
         ${image.data}, ${image.contentType})
    `;
  });
}

export async function setProductSoldOut(id: string, soldOut: boolean) {
  const database = getPostgresClient();
  await database`
    UPDATE products
    SET sold_out = ${soldOut}, updated_at = ${new Date().toISOString()}
    WHERE id = ${id} AND deleted_at IS NULL
  `;
}

export async function deleteCatalogProduct(id: string) {
  return withTransaction(async (sql) => {
    const timestamp = new Date().toISOString();
    const products = await sql.unsafe<Array<{ id: string }>>(
      `UPDATE products
       SET active = FALSE, sold_out = TRUE, deleted_at = $1, updated_at = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [timestamp, id],
    );
    if (!products[0]) return false;

    await sql.unsafe(
      `UPDATE sales_menu_items
       SET active = FALSE
       WHERE product_id = $1`,
      [id],
    );
    return true;
  });
}
