import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getAdminCatalog } from "@/modules/catalog/application/catalog-admin";
import { CatalogManagement } from "@/modules/catalog/ui/catalog-management/CatalogManagement";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const catalog = await getAdminCatalog();
  return (
    <>
      <AdminPageHeader
        eyebrow="Produtos"
        title="Cardápio"
        description="Cadastre produtos, ajuste preços e controle disponibilidade sem misturar outras configurações."
      />
      <CatalogManagement
        categories={catalog.categories}
        products={catalog.products}
      />
    </>
  );
}
