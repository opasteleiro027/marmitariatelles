import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceCents: integer("price_cents").notNull(),
    promotionalPriceCents: integer("promotional_price_cents"),
    stockQuantity: integer("stock_quantity"),
    orderLimit: integer("order_limit"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    soldOut: boolean("sold_out").notNull().default(false),
    notesAllowed: boolean("notes_allowed")
      .notNull()
      .default(true),
    displayOrder: integer("display_order").notNull().default(0),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("products_category_idx").on(table.categoryId)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    storageKey: text("storage_key").notNull(),
    altText: text("alt_text").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [index("product_images_product_idx").on(table.productId)],
);

export const addonGroups = pgTable("addon_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  required: boolean("required").notNull().default(false),
  minimumSelections: integer("minimum_selections").notNull().default(0),
  maximumSelections: integer("maximum_selections").notNull().default(1),
  selectionType: text("selection_type", { enum: ["single", "multiple"] })
    .notNull()
    .default("single"),
  active: boolean("active").notNull().default(true),
});

export const addonOptions = pgTable(
  "addon_options",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => addonGroups.id),
    name: text("name").notNull(),
    additionalPriceCents: integer("additional_price_cents").notNull().default(0),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [index("addon_options_group_idx").on(table.groupId)],
);

export const productAddonGroups = pgTable(
  "product_addon_groups",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    groupId: text("group_id")
      .notNull()
      .references(() => addonGroups.id),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("product_addon_groups_unique").on(
      table.productId,
      table.groupId,
    ),
  ],
);

export const salesMenus = pgTable(
  "sales_menus",
  {
    id: text("id").primaryKey(),
    salesDate: text("sales_date").notNull(),
    orderingOpensAt: text("ordering_opens_at").notNull(),
    orderingClosesAt: text("ordering_closes_at").notNull(),
    totalCapacity: integer("total_capacity"),
    published: boolean("published").notNull().default(false),
    closedManually: boolean("closed_manually")
      .notNull()
      .default(false),
    operational: boolean("operational").notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("sales_menus_date_unique").on(table.salesDate),
    uniqueIndex("sales_menus_one_operational")
      .on(table.operational)
      .where(sql`${table.operational} = TRUE`),
  ],
);

export const salesMenuItems = pgTable(
  "sales_menu_items",
  {
    id: text("id").primaryKey(),
    menuId: text("menu_id")
      .notNull()
      .references(() => salesMenus.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    overridePriceCents: integer("override_price_cents"),
    availableQuantity: integer("available_quantity"),
    soldQuantity: integer("sold_quantity").notNull().default(0),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("sales_menu_items_unique").on(table.menuId, table.productId),
  ],
);
