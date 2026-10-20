import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getAdminOrders } from "@/modules/ordering/application/admin-orders";
import { AdminOrderList } from "@/modules/ordering/ui/admin-order-list/AdminOrderList";
import { OrderHistoryReset } from "@/modules/ordering/ui/order-history-reset/OrderHistoryReset";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders(["pickup", "delivery"]);
  return (
    <>
      <AdminPageHeader
        eyebrow="Operação em tempo real"
        title="Retirada e delivery"
        description="Acompanhe somente os pedidos que serão retirados ou entregues na casa do cliente."
      />
      <AdminOrderList snapshot={orders} />
      <OrderHistoryReset orderCount={orders.metrics.received} />
    </>
  );
}
