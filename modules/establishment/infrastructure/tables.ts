import { boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";

export const businessSettings = pgTable("business_settings", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  description: text("description"),
  welcomeMessage: text("welcome_message").notNull(),
  whatsapp: text("whatsapp").notNull(),
  phone: text("phone"),
  address: text("address"),
  primaryColor: text("primary_color").notNull().default("#d85b27"),
  minimumOrderCents: integer("minimum_order_cents").notNull().default(0),
  orderDeadlineLabel: text("order_deadline_label").notNull(),
  deliveryWindowLabel: text("delivery_window_label").notNull(),
  notice: text("notice").notNull(),
  pixKey: text("pix_key"),
  pickupInstructions: text("pickup_instructions"),
  deliveryInstructions: text("delivery_instructions"),
  cancellationPolicy: text("cancellation_policy"),
  ordersPaused: boolean("orders_paused")
    .notNull()
    .default(false),
  updatedAt: text("updated_at").notNull(),
});

export const deliveryAreas = pgTable(
  "delivery_areas",
  {
    id: text("id").primaryKey(),
    city: text("city").notNull(),
    neighborhood: text("neighborhood").notNull(),
    postalCodeStart: text("postal_code_start"),
    postalCodeEnd: text("postal_code_end"),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    minimumOrderCents: integer("minimum_order_cents").notNull().default(0),
    estimatedMinutes: integer("estimated_minutes"),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("delivery_areas_location_idx").on(table.city, table.neighborhood),
  ],
);

export const deliverySlots = pgTable(
  "delivery_slots",
  {
    id: text("id").primaryKey(),
    salesDate: text("sales_date").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    capacity: integer("capacity").notNull(),
    reservedCount: integer("reserved_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
  },
  (table) => [index("delivery_slots_date_idx").on(table.salesDate)],
);

export const paymentMethods = pgTable("payment_methods", {
  id: text("id").primaryKey(),
  code: text("code", {
    enum: ["pix", "cash", "card_on_delivery", "pay_on_pickup"],
  }).notNull(),
  label: text("label").notNull(),
  instructions: text("instructions"),
  active: boolean("active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
});
