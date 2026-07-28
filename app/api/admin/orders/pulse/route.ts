import { getAdminSession } from "@/modules/admin-auth/server/admin-session";
import { getAdminOrderPulse } from "@/modules/ordering/application/admin-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json(
      { error: "Sessão administrativa necessária." },
      {
        status: 401,
        headers: { "cache-control": "no-store" },
      },
    );
  }

  try {
    return Response.json(await getAdminOrderPulse(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (reason) {
    console.error("Falha ao verificar novos pedidos", reason);
    return Response.json(
      { error: "Não foi possível verificar novos pedidos." },
      {
        status: 503,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
