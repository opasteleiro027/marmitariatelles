import { checkHealth } from "@/modules/operational-monitoring/checkHealth";

export async function GET() {
  try {
    return Response.json(await checkHealth(), {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      { status: "unavailable", checkedAt: new Date().toISOString() },
      {
        status: 503,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
