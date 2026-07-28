ALTER TABLE "addon_groups" ADD COLUMN "builder_role" text;--> statement-breakpoint
ALTER TABLE "addon_options" ADD COLUMN "sold_out" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_addon_groups" ADD COLUMN "minimum_selections" integer;--> statement-breakpoint
ALTER TABLE "product_addon_groups" ADD COLUMN "maximum_selections" integer;--> statement-breakpoint
ALTER TABLE "order_item_addons" ADD COLUMN "group_name_snapshot" text DEFAULT 'Opção' NOT NULL;
