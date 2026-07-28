import { getAdminOrderMetrics } from "@/modules/ordering/application/admin-orders";
import { getAdminOrderReport } from "@/modules/ordering/application/admin-order-report";
import { parseOrderReportPeriod } from "@/modules/ordering/domain/order-report-period";
import { getAdminBusinessSettings } from "@/modules/establishment/application/admin-establishment";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";
import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { AdminOverview } from "@/modules/admin/ui/admin-overview/AdminOverview";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string | string[] }>;
}) {
  const period = parseOrderReportPeriod((await searchParams).periodo);
  const [storefront, orderMetrics, settings, report] = await Promise.all([
    getStorefrontSnapshot(),
    getAdminOrderMetrics(),
    getAdminBusinessSettings(),
    getAdminOrderReport(period),
  ]);
  return (
    <>
      <AdminPageHeader
        eyebrow="Operação"
        title="Visão geral"
        description="Acompanhe a operação e analise o perfil dos clientes por dia, semana ou mês."
      />
      <AdminOverview
        storefront={storefront}
        orderMetrics={orderMetrics}
        settings={settings}
        report={report}
      />
    </>
  );
}
