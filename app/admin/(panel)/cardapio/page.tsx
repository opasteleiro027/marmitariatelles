import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getAdminCatalog } from "@/modules/catalog/application/catalog-admin";
import { getAdminMarmitaConfiguration } from "@/modules/catalog/application/marmita-admin";
import { CatalogManagement } from "@/modules/catalog/ui/catalog-management/CatalogManagement";
import { MarmitaManagement } from "@/modules/catalog/ui/marmita-management/MarmitaManagement";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const [catalog, marmitaConfiguration] = await Promise.all([
    getAdminCatalog(),
    getAdminMarmitaConfiguration(),
  ]);
  return (
    <>
      <AdminPageHeader
        eyebrow="Produtos"
        title="Cardápio"
        description="Configure tamanhos, bases, feijões, proteínas, acompanhamentos e adicionais da montagem."
      />
      <MarmitaManagement configuration={marmitaConfiguration} />
      <CatalogManagement
        categories={catalog.categories}
        products={catalog.products}
      />
    </>
  );
}
