CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" text DEFAULT 'operator' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"postal_code" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"reference_point" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"description" text,
	"welcome_message" text NOT NULL,
	"whatsapp" text NOT NULL,
	"phone" text,
	"address" text,
	"primary_color" text DEFAULT '#d85b27' NOT NULL,
	"minimum_order_cents" integer DEFAULT 0 NOT NULL,
	"order_deadline_label" text NOT NULL,
	"delivery_window_label" text NOT NULL,
	"notice" text NOT NULL,
	"pix_key" text,
	"pickup_instructions" text,
	"delivery_instructions" text,
	"cancellation_policy" text,
	"orders_paused" boolean DEFAULT false NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"neighborhood" text NOT NULL,
	"postal_code_start" text,
	"postal_code_end" text,
	"delivery_fee_cents" integer NOT NULL,
	"minimum_order_cents" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"sales_date" text NOT NULL,
	"starts_at" text NOT NULL,
	"ends_at" text NOT NULL,
	"capacity" integer NOT NULL,
	"reserved_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"instructions" text,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addon_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"minimum_selections" integer DEFAULT 0 NOT NULL,
	"maximum_selections" integer DEFAULT 1 NOT NULL,
	"selection_type" text DEFAULT 'single' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addon_options" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"name" text NOT NULL,
	"additional_price_cents" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_addon_groups" (
	"product_id" text NOT NULL,
	"group_id" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"alt_text" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price_cents" integer NOT NULL,
	"promotional_price_cents" integer,
	"stock_quantity" integer,
	"order_limit" integer,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sold_out" boolean DEFAULT false NOT NULL,
	"notes_allowed" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"product_id" text NOT NULL,
	"override_price_cents" integer,
	"available_quantity" integer,
	"sold_quantity" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_menus" (
	"id" text PRIMARY KEY NOT NULL,
	"sales_date" text NOT NULL,
	"ordering_opens_at" text NOT NULL,
	"ordering_closes_at" text NOT NULL,
	"total_capacity" integer,
	"published" boolean DEFAULT false NOT NULL,
	"closed_manually" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"minimum_order_cents" integer DEFAULT 0 NOT NULL,
	"maximum_discount_cents" integer,
	"starts_at" text,
	"ends_at" text,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_order_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"admin_user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_idempotency_keys" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"request_hash" text NOT NULL,
	"created_at" text NOT NULL,
	"expires_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_addons" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"addon_option_id" text,
	"addon_name_snapshot" text NOT NULL,
	"unit_price_cents_snapshot" integer DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"product_name_snapshot" text NOT NULL,
	"unit_price_cents_snapshot" integer NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"line_total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"previous_status" text,
	"new_status" text NOT NULL,
	"changed_by_admin_id" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"friendly_number" integer NOT NULL,
	"tracking_token_hash" text NOT NULL,
	"customer_id" text NOT NULL,
	"address_id" text,
	"menu_id" text NOT NULL,
	"delivery_area_id" text,
	"delivery_slot_id" text,
	"coupon_id" text,
	"fulfillment_type" text NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"customer_name_snapshot" text NOT NULL,
	"customer_phone_snapshot" text NOT NULL,
	"address_snapshot" text,
	"subtotal_cents" integer NOT NULL,
	"delivery_fee_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"payment_method_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount_cents" integer NOT NULL,
	"change_for_cents" integer,
	"receipt_storage_key" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_options" ADD CONSTRAINT "addon_options_group_id_addon_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."addon_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addon_groups" ADD CONSTRAINT "product_addon_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addon_groups" ADD CONSTRAINT "product_addon_groups_group_id_addon_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."addon_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_menu_items" ADD CONSTRAINT "sales_menu_items_menu_id_sales_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."sales_menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_menu_items" ADD CONSTRAINT "sales_menu_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_order_notes" ADD CONSTRAINT "internal_order_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_order_notes" ADD CONSTRAINT "internal_order_notes_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_idempotency_keys" ADD CONSTRAINT "order_idempotency_keys_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_admin_id_admin_users_id_fk" FOREIGN KEY ("changed_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_customer_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_menu_id_sales_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."sales_menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_area_id_delivery_areas_id_fk" FOREIGN KEY ("delivery_area_id") REFERENCES "public"."delivery_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_slot_id_delivery_slots_id_fk" FOREIGN KEY ("delivery_slot_id") REFERENCES "public"."delivery_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_unique" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customer_addresses_customer_idx" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "delivery_areas_location_idx" ON "delivery_areas" USING btree ("city","neighborhood");--> statement-breakpoint
CREATE INDEX "delivery_slots_date_idx" ON "delivery_slots" USING btree ("sales_date");--> statement-breakpoint
CREATE INDEX "addon_options_group_idx" ON "addon_options" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_addon_groups_unique" ON "product_addon_groups" USING btree ("product_id","group_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_menu_items_unique" ON "sales_menu_items" USING btree ("menu_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_menus_date_unique" ON "sales_menus" USING btree ("sales_date");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_unique" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "internal_order_notes_order_idx" ON "internal_order_notes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_addons_item_idx" ON "order_item_addons" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_friendly_number_unique" ON "orders" USING btree ("friendly_number");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("customer_phone_snapshot");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");