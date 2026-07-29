ALTER TABLE "admin_users"
  ADD COLUMN IF NOT EXISTS "password_hash" text;
--> statement-breakpoint
ALTER TABLE "admin_users"
  ADD COLUMN IF NOT EXISTS "password_salt" text;
--> statement-breakpoint
INSERT INTO "admin_users"
  ("id", "email", "display_name", "role", "password_hash", "password_salt",
   "active", "created_at", "updated_at")
VALUES
  ('admin-padaria-telles', 'padariateles10@gmail.com', 'Padaria Telles',
   'manager',
   'd3604c5dd38e6770bc8a84e451b8a010c8a1a33f576d612aa4366e63d1ce0118e1ebcd4ae67aa44567b7315242d55268a4f790224dc0a9869bef6f2629bce3dd',
   '836845a8d756cff1bb7dc42a48afc8af', TRUE,
   CURRENT_TIMESTAMP::text, CURRENT_TIMESTAMP::text)
ON CONFLICT ("email") DO UPDATE SET
  "display_name" = EXCLUDED."display_name",
  "role" = EXCLUDED."role",
  "password_hash" = EXCLUDED."password_hash",
  "password_salt" = EXCLUDED."password_salt",
  "active" = TRUE,
  "updated_at" = EXCLUDED."updated_at";
