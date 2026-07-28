import { getAdminOrderMetrics } from "@/modules/ordering/application/admin-orders";
import { getAdminBusinessSettings } from "@/modules/establishment/application/admin-establishment";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";
import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { AdminOverview } from "@/modules/admin/ui/admin-overview/AdminOverview";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [storefront, orderMetrics, settings] = await Promise.all([
    getStorefrontSnapshot(),
    getAdminOrderMetrics(),
    getAdminBusinessSettings(),
  ]);
  return (
    <>
      <AdminPageHeader
        eyebrow="Operação"
        title="Visão geral"
        description="Acompanhe os principais números e ligue ou desligue novos pedidos."
      />
      <AdminOverview
        storefront={storefront}
        orderMetrics={orderMetrics}
        settings={settings}
      />
    </>
  );
}
