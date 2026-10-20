import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getAdminOrders } from "@/modules/ordering/application/admin-orders";
import { TableTabs } from "@/modules/ordering/ui/table-tabs/TableTabs";

export const dynamic = "force-dynamic";

export default async function AdminTableTabsPage() {
  const orders = await getAdminOrders(["dine_in"]);
  return (
    <>
      <AdminPageHeader
        eyebrow="Atendimento no salão"
        title="Comandas de mesa"
        description="Acompanhe os pedidos feitos pelo QR Code, acrescente novos consumos e feche a comanda somente após o pagamento."
      />
      <TableTabs snapshot={orders} />
    </>
  );
}
