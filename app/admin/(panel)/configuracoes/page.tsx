import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getAdminBusinessSettings } from "@/modules/establishment/application/admin-establishment";
import { BusinessSettingsManagement } from "@/modules/establishment/ui/business-settings-management/BusinessSettingsManagement";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAdminBusinessSettings();
  return (
    <>
      <AdminPageHeader
        eyebrow="Estabelecimento"
        title="Configurações"
        description="Edite os dados públicos, contatos, endereço e regras comerciais da Marmitaria Telles."
      />
      <BusinessSettingsManagement settings={settings} />
    </>
  );
}
