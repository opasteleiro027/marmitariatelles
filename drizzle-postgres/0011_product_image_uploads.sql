ALTER TABLE product_images
  ADD COLUMN image_data BYTEA;
--> statement-breakpoint
ALTER TABLE product_images
  ADD COLUMN content_type TEXT;
