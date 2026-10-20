CREATE TABLE "cash_register_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "opening_float_cents" integer NOT NULL,
  "counted_cash_cents" integer,
  "cash_difference_cents" integer,
  "notes" text,
  "opened_by_admin_id" text NOT NULL,
  "closed_by_admin_id" text,
  "opened_at" text NOT NULL,
  "closed_at" text
);
--> statement-breakpoint
CREATE TABLE "cash_register_movements" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "kind" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "payment_method_id" text,
  "order_id" text,
  "payment_id" text,
  "description" text NOT NULL,
  "created_by_admin_id" text NOT NULL,
  "created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_opened_by_admin_id_admin_users_id_fk" FOREIGN KEY ("opened_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_closed_by_admin_id_admin_users_id_fk" FOREIGN KEY ("closed_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_session_id_cash_register_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cash_register_sessions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_created_by_admin_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cash_register_sessions_status_idx" ON "cash_register_sessions" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "cash_register_movements_session_idx" ON "cash_register_movements" USING btree ("session_id", "created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "cash_register_movements_sale_payment_unique" ON "cash_register_movements" USING btree ("payment_id") WHERE kind = 'sale';
--> statement-breakpoint
CREATE UNIQUE INDEX "cash_register_one_open_session_unique" ON "cash_register_sessions" USING btree ("status") WHERE status = 'open';
