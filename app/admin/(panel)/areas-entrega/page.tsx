import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getAdminDeliveryAreas } from "@/modules/establishment/application/admin-establishment";
import { DeliveryAreaManagement } from "@/modules/establishment/ui/delivery-area-management/DeliveryAreaManagement";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryAreasPage() {
  const areas = await getAdminDeliveryAreas();
  return (
    <>
      <AdminPageHeader
        eyebrow="Entrega"
        title="Áreas de entrega"
        description="Gerencie bairros, taxas, pedidos mínimos e disponibilidade em uma tela exclusiva."
      />
      <DeliveryAreaManagement areas={areas} />
    </>
  );
}
