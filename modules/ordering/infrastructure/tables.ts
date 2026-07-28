import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { salesMenus } from "../../catalog/infrastructure/tables";
import { deliveryAreas, deliverySlots, paymentMethods } from "../../establishment/infrastructure/tables";
import { adminUsers, customerAddresses, customers } from "../../identity/infrastructure/tables";

export const coupons = pgTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    description: text("description"),
    discountType: text("discount_type", { enum: ["fixed", "percentage"] })
      .notNull(),
    discountValue: integer("discount_value").notNull(),
    minimumOrderCents: integer("minimum_order_cents").notNull().default(0),
    maximumDiscountCents: integer("maximum_discount_cents"),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
  },
  (table) => [uniqueIndex("coupons_code_unique").on(table.code)],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    friendlyNumber: integer("friendly_number").notNull(),
    trackingTokenHash: text("tracking_token_hash").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    addressId: text("address_id").references(() => customerAddresses.id),
    menuId: text("menu_id")
      .notNull()
      .references(() => salesMenus.id),
    deliveryAreaId: text("delivery_area_id").references(
      () => deliveryAreas.id,
      { onDelete: "set null" },
    ),
    deliverySlotId: text("delivery_slot_id").references(() => deliverySlots.id),
    couponId: text("coupon_id").references(() => coupons.id),
    fulfillmentType: text("fulfillment_type", { enum: ["delivery", "pickup"] })
      .notNull(),
    status: text("status", {
      enum: [
        "received",
        "awaiting_confirmation",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "ready_for_pickup",
        "delivered",
        "cancelled",
      ],
    })
      .notNull()
      .default("received"),
    customerNameSnapshot: text("customer_name_snapshot").notNull(),
    customerPhoneSnapshot: text("customer_phone_snapshot").notNull(),
    addressSnapshot: text("address_snapshot"),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("orders_friendly_number_unique").on(table.friendlyNumber),
    index("orders_status_created_idx").on(table.status, table.createdAt),
    index("orders_phone_idx").on(table.customerPhoneSnapshot),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    productId: text("product_id"),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const orderItemAddons = pgTable(
  "order_item_addons",
  {
    id: text("id").primaryKey(),
    orderItemId: text("order_item_id")
      .notNull()
      .references(() => orderItems.id),
    addonOptionId: text("addon_option_id"),
    groupNameSnapshot: text("group_name_snapshot").notNull().default("Opção"),
    addonNameSnapshot: text("addon_name_snapshot").notNull(),
    unitPriceCentsSnapshot: integer("unit_price_cents_snapshot")
      .notNull()
      .default(0),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [index("order_item_addons_item_idx").on(table.orderItemId)],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    paymentMethodId: text("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id),
    status: text("status", { enum: ["pending", "confirmed", "cancelled"] })
      .notNull()
      .default("pending"),
    amountCents: integer("amount_cents").notNull(),
    changeForCents: integer("change_for_cents"),
    receiptStorageKey: text("receipt_storage_key"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("payments_order_idx").on(table.orderId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    previousStatus: text("previous_status"),
    newStatus: text("new_status").notNull(),
    changedByAdminId: text("changed_by_admin_id").references(() => adminUsers.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("order_status_history_order_idx").on(table.orderId)],
);

export const internalOrderNotes = pgTable(
  "internal_order_notes",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => adminUsers.id),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("internal_order_notes_order_idx").on(table.orderId)],
);

export const orderIdempotencyKeys = pgTable("order_idempotency_keys", {
  keyHash: text("key_hash").primaryKey(),
  orderId: text("order_id").references(() => orders.id),
  requestHash: text("request_hash").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});
