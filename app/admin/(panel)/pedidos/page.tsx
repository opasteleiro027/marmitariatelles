import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getAdminOrders } from "@/modules/ordering/application/admin-orders";
import { AdminOrderList } from "@/modules/ordering/ui/admin-order-list/AdminOrderList";
import { OrderHistoryReset } from "@/modules/ordering/ui/order-history-reset/OrderHistoryReset";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return (
    <>
      <AdminPageHeader
        eyebrow="Operação em tempo real"
        title="Pedidos"
        description="Receba novos pedidos, acompanhe o alerta sonoro e avance cada etapa do atendimento."
      />
      <AdminOrderList snapshot={orders} />
      <OrderHistoryReset orderCount={orders.metrics.received} />
    </>
  );
}
