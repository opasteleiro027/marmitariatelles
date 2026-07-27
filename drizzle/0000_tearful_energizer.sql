CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`role` text DEFAULT 'operator' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `customer_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`postal_code` text NOT NULL,
	`street` text NOT NULL,
	`number` text NOT NULL,
	`complement` text,
	`neighborhood` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`reference_point` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `customer_addresses_customer_idx` ON `customer_addresses` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE `business_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`description` text,
	`welcome_message` text NOT NULL,
	`whatsapp` text NOT NULL,
	`phone` text,
	`address` text,
	`primary_color` text DEFAULT '#d85b27' NOT NULL,
	`minimum_order_cents` integer DEFAULT 0 NOT NULL,
	`order_deadline_label` text NOT NULL,
	`delivery_window_label` text NOT NULL,
	`notice` text NOT NULL,
	`pix_key` text,
	`pickup_instructions` text,
	`delivery_instructions` text,
	`cancellation_policy` text,
	`orders_paused` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `delivery_areas` (
	`id` text PRIMARY KEY NOT NULL,
	`city` text NOT NULL,
	`neighborhood` text NOT NULL,
	`postal_code_start` text,
	`postal_code_end` text,
	`delivery_fee_cents` integer NOT NULL,
	`minimum_order_cents` integer DEFAULT 0 NOT NULL,
	`estimated_minutes` integer,
	`active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `delivery_areas_location_idx` ON `delivery_areas` (`city`,`neighborhood`);--> statement-breakpoint
CREATE TABLE `delivery_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`sales_date` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`capacity` integer NOT NULL,
	`reserved_count` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX `delivery_slots_date_idx` ON `delivery_slots` (`sales_date`);--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`instructions` text,
	`active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `addon_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`minimum_selections` integer DEFAULT 0 NOT NULL,
	`maximum_selections` integer DEFAULT 1 NOT NULL,
	`selection_type` text DEFAULT 'single' NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `addon_options` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`additional_price_cents` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `addon_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `addon_options_group_idx` ON `addon_options` (`group_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_addon_groups` (
	`product_id` text NOT NULL,
	`group_id` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `addon_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_addon_groups_unique` ON `product_addon_groups` (`product_id`,`group_id`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`alt_text` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price_cents` integer NOT NULL,
	`promotional_price_cents` integer,
	`stock_quantity` integer,
	`order_limit` integer,
	`featured` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sold_out` integer DEFAULT false NOT NULL,
	`notes_allowed` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `sales_menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_id` text NOT NULL,
	`product_id` text NOT NULL,
	`override_price_cents` integer,
	`available_quantity` integer,
	`sold_quantity` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `sales_menus`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_menu_items_unique` ON `sales_menu_items` (`menu_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `sales_menus` (
	`id` text PRIMARY KEY NOT NULL,
	`sales_date` text NOT NULL,
	`ordering_opens_at` text NOT NULL,
	`ordering_closes_at` text NOT NULL,
	`total_capacity` integer,
	`published` integer DEFAULT false NOT NULL,
	`closed_manually` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_menus_date_unique` ON `sales_menus` (`sales_date`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`discount_type` text NOT NULL,
	`discount_value` integer NOT NULL,
	`minimum_order_cents` integer DEFAULT 0 NOT NULL,
	`maximum_discount_cents` integer,
	`starts_at` text,
	`ends_at` text,
	`usage_limit` integer,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `internal_order_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `internal_order_notes_order_idx` ON `internal_order_notes` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_idempotency_keys` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`request_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_item_addons` (
	`id` text PRIMARY KEY NOT NULL,
	`order_item_id` text NOT NULL,
	`addon_option_id` text,
	`addon_name_snapshot` text NOT NULL,
	`unit_price_cents_snapshot` integer DEFAULT 0 NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_item_addons_item_idx` ON `order_item_addons` (`order_item_id`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text,
	`product_name_snapshot` text NOT NULL,
	`unit_price_cents_snapshot` integer NOT NULL,
	`quantity` integer NOT NULL,
	`notes` text,
	`line_total_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`previous_status` text,
	`new_status` text NOT NULL,
	`changed_by_admin_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by_admin_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_status_history_order_idx` ON `order_status_history` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`friendly_number` integer NOT NULL,
	`tracking_token_hash` text NOT NULL,
	`customer_id` text NOT NULL,
	`address_id` text,
	`menu_id` text NOT NULL,
	`delivery_area_id` text,
	`delivery_slot_id` text,
	`coupon_id` text,
	`fulfillment_type` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`customer_name_snapshot` text NOT NULL,
	`customer_phone_snapshot` text NOT NULL,
	`address_snapshot` text,
	`subtotal_cents` integer NOT NULL,
	`delivery_fee_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`address_id`) REFERENCES `customer_addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`menu_id`) REFERENCES `sales_menus`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delivery_area_id`) REFERENCES `delivery_areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delivery_slot_id`) REFERENCES `delivery_slots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_friendly_number_unique` ON `orders` (`friendly_number`);--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_phone_idx` ON `orders` (`customer_phone_snapshot`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`payment_method_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount_cents` integer NOT NULL,
	`change_for_cents` integer,
	`receipt_storage_key` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);