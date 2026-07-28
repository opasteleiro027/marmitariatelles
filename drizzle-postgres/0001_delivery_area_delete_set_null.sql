ALTER TABLE "orders"
  DROP CONSTRAINT IF EXISTS "orders_delivery_area_id_delivery_areas_id_fk";
--> statement-breakpoint
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_delivery_area_id_delivery_areas_id_fk"
  FOREIGN KEY ("delivery_area_id")
  REFERENCES "public"."delivery_areas"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;
