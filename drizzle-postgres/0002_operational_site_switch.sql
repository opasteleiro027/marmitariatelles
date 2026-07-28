ALTER TABLE "sales_menus"
  ADD COLUMN IF NOT EXISTS "operational" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
WITH selected_menu AS (
  SELECT id
  FROM "sales_menus"
  ORDER BY "updated_at" DESC
  LIMIT 1
)
UPDATE "sales_menus"
SET "operational" = ("id" = (SELECT id FROM selected_menu));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sales_menus_one_operational"
  ON "sales_menus" ("operational")
  WHERE "operational" = TRUE;
