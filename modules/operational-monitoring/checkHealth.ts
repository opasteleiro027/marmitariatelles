import { getPostgresClient } from "@/db";

export async function checkHealth() {
  const database = getPostgresClient();
  await database`SELECT 1 AS healthy`;
  return {
    status: "healthy",
    database: "postgresql",
    checkedAt: new Date().toISOString(),
  };
}
