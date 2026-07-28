import { getPostgresClient, withTransaction } from "@/db";

export const MARMITA_GROUP_ROLES = [
  "base",
  "beans",
  "protein",
  "side",
  "extra",
] as const;

export type MarmitaGroupRole = (typeof MARMITA_GROUP_ROLES)[number];

export type AdminMarmitaSize = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  active: boolean;
  soldOut: boolean;
  proteinLimit: number;
  sideLimit: number;
};

export type AdminMarmitaOption = {
  id: string;
  role: MarmitaGroupRole;
  name: string;
  additionalPriceInCents: number;
  active: boolean;
  soldOut: boolean;
};

export type AdminMarmitaGroup = {
  id: string;
  role: MarmitaGroupRole;
  name: string;
  options: AdminMarmitaOption[];
};

export type AdminMarmitaConfiguration = {
  sizes: AdminMarmitaSize[];
  groups: AdminMarmitaGroup[];
};

export async function getAdminMarmitaConfiguration(): Promise<AdminMarmitaConfiguration> {
  const sql = getPostgresClient();
  const [sizes, groups, options] = await Promise.all([
    sql.unsafe<
      Array<{
        id: string;
        name: string;
        description: string;
        price_in_cents: number;
        active: boolean;
        sold_out: boolean;
        protein_limit: number;
        side_limit: number;
      }>
    >(
      `SELECT p.id, p.name, p.description,
              p.price_cents AS price_in_cents, p.active, p.sold_out,
              COALESCE(MAX(pag.maximum_selections)
                FILTER (WHERE ag.builder_role = 'protein'), 1)::INT
                AS protein_limit,
              COALESCE(MAX(pag.maximum_selections)
                FILTER (WHERE ag.builder_role = 'side'), 1)::INT
                AS side_limit
       FROM products p
       JOIN product_addon_groups pag ON pag.product_id = p.id
       JOIN addon_groups ag ON ag.id = pag.group_id
       WHERE ag.builder_role IS NOT NULL AND p.deleted_at IS NULL
       GROUP BY p.id
       ORDER BY p.display_order, p.name`,
    ),
    sql.unsafe<
      Array<{ id: string; role: MarmitaGroupRole; name: string }>
    >(
      `SELECT id, builder_role AS role, name
       FROM addon_groups
       WHERE builder_role IS NOT NULL AND active = TRUE
       ORDER BY CASE builder_role
         WHEN 'base' THEN 1 WHEN 'beans' THEN 2 WHEN 'protein' THEN 3
         WHEN 'side' THEN 4 ELSE 5 END`,
    ),
    sql.unsafe<
      Array<{
        id: string;
        role: MarmitaGroupRole;
        name: string;
        additional_price_in_cents: number;
        active: boolean;
        sold_out: boolean;
      }>
    >(
      `SELECT ao.id, ag.builder_role AS role, ao.name,
              ao.additional_price_cents AS additional_price_in_cents,
              ao.active, ao.sold_out
       FROM addon_options ao
       JOIN addon_groups ag ON ag.id = ao.group_id
       WHERE ag.builder_role IS NOT NULL
       ORDER BY CASE ag.builder_role
         WHEN 'base' THEN 1 WHEN 'beans' THEN 2 WHEN 'protein' THEN 3
         WHEN 'side' THEN 4 ELSE 5 END,
         ao.display_order, ao.name`,
    ),
  ]);

  return {
    sizes: sizes.map((size) => ({
      id: size.id,
      name: size.name,
      description: size.description,
      priceInCents: size.price_in_cents,
      active: size.active,
      soldOut: size.sold_out,
      proteinLimit: size.protein_limit,
      sideLimit: size.side_limit,
    })),
    groups: groups.map((group) => ({
      ...group,
      options: options
        .filter((option) => option.role === group.role)
        .map((option) => ({
          id: option.id,
          role: option.role,
          name: option.name,
          additionalPriceInCents: option.additional_price_in_cents,
          active: option.active,
          soldOut: option.sold_out,
        })),
    })),
  };
}

export async function createMarmitaSize(input: {
  name: string;
  description: string;
  priceInCents: number;
  proteinLimit: number;
  sideLimit: number;
}) {
  await withTransaction(async (sql) => {
    const categoryRows = await sql.unsafe<Array<{ id: string }>>(
      `SELECT id FROM categories
       WHERE LOWER(name) = LOWER('Marmitas') AND active = TRUE
       ORDER BY display_order LIMIT 1`,
    );
    const categoryId = categoryRows[0]?.id;
    if (!categoryId) throw new Error("A categoria Marmitas não foi encontrada.");

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    await sql.unsafe(
      `INSERT INTO products
        (id, category_id, name, description, price_cents, featured, active,
         sold_out, notes_allowed, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, TRUE, FALSE, TRUE,
         (SELECT COALESCE(MAX(display_order), 0) + 1 FROM products
          WHERE category_id = $2), $6, $6)`,
      [id, categoryId, input.name, input.description, input.priceInCents, timestamp],
    );

    const groups = await sql.unsafe<
      Array<{
        id: string;
        role: MarmitaGroupRole;
        minimum_selections: number;
        maximum_selections: number;
      }>
    >(
      `SELECT id, builder_role AS role, minimum_selections, maximum_selections
       FROM addon_groups
       WHERE builder_role IS NOT NULL AND active = TRUE`,
    );
    for (const [index, group] of groups.entries()) {
      await sql.unsafe(
        `INSERT INTO product_addon_groups
          (product_id, group_id, minimum_selections, maximum_selections,
           display_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          group.id,
          group.minimum_selections,
          limitForRole(group.role, input, group.maximum_selections),
          index + 1,
        ],
      );
    }

    await sql.unsafe(
      `INSERT INTO sales_menu_items
        (id, menu_id, product_id, available_quantity, sold_quantity,
         active, display_order)
       SELECT $1, sm.id, $2, 40, 0, TRUE, 999
       FROM sales_menus sm
       WHERE sm.operational = TRUE
       ON CONFLICT (menu_id, product_id) DO NOTHING`,
      [`builder-${id}`, id],
    );
  });
}

export async function updateMarmitaSize(input: {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  proteinLimit: number;
  sideLimit: number;
  active: boolean;
  soldOut: boolean;
}) {
  await withTransaction(async (sql) => {
    await sql.unsafe(
      `UPDATE products
       SET name = $1, description = $2, price_cents = $3, active = $4,
           sold_out = $5, updated_at = $6
       WHERE id = $7 AND deleted_at IS NULL`,
      [
        input.name,
        input.description,
        input.priceInCents,
        input.active,
        input.soldOut,
        new Date().toISOString(),
        input.id,
      ],
    );
    await sql.unsafe(
      `UPDATE product_addon_groups pag
       SET maximum_selections = CASE ag.builder_role
         WHEN 'protein' THEN $1
         WHEN 'side' THEN $2
         ELSE pag.maximum_selections END
       FROM addon_groups ag
       WHERE pag.group_id = ag.id AND pag.product_id = $3`,
      [input.proteinLimit, input.sideLimit, input.id],
    );
  });
}

export async function createMarmitaOption(input: {
  role: MarmitaGroupRole;
  name: string;
  additionalPriceInCents: number;
}) {
  const sql = getPostgresClient();
  await sql.unsafe(
    `INSERT INTO addon_options
      (id, group_id, name, additional_price_cents, active, sold_out,
       display_order)
     SELECT $1, ag.id, $2, $3, TRUE, FALSE,
       COALESCE((SELECT MAX(display_order) + 1 FROM addon_options
         WHERE group_id = ag.id), 1)
     FROM addon_groups ag
     WHERE ag.builder_role = $4 AND ag.active = TRUE`,
    [crypto.randomUUID(), input.name, input.additionalPriceInCents, input.role],
  );
}

export async function updateMarmitaOption(input: {
  id: string;
  name: string;
  additionalPriceInCents: number;
  active: boolean;
  soldOut: boolean;
}) {
  const sql = getPostgresClient();
  await sql.unsafe(
    `UPDATE addon_options
     SET name = $1, additional_price_cents = $2, active = $3, sold_out = $4
     WHERE id = $5`,
    [
      input.name,
      input.additionalPriceInCents,
      input.active,
      input.soldOut,
      input.id,
    ],
  );
}

function limitForRole(
  role: MarmitaGroupRole,
  input: { proteinLimit: number; sideLimit: number },
  fallback: number,
) {
  if (role === "protein") return input.proteinLimit;
  if (role === "side") return input.sideLimit;
  return fallback;
}
