import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const adminUsers = pgTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    role: text("role", { enum: ["owner", "manager", "operator"] })
      .notNull()
      .default("operator"),
    active: boolean("active").notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("admin_users_email_unique").on(table.email)],
);

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("customers_phone_idx").on(table.phone)],
);

export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    postalCode: text("postal_code").notNull(),
    street: text("street").notNull(),
    number: text("number").notNull(),
    complement: text("complement"),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    referencePoint: text("reference_point"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("customer_addresses_customer_idx").on(table.customerId)],
);
