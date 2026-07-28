import { requireAdmin } from "@/modules/admin-auth/server/admin-session";
import { AdminDashboard } from "@/modules/admin/ui/AdminDashboard";
import { getAdminCatalog } from "@/modules/catalog/application/catalog-admin";
import { getAdminOrders } from "@/modules/ordering/application/admin-orders";
import { getAdminEstablishment } from "@/modules/establishment/application/admin-establishment";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const [storefront, catalog, orders, establishment] = await Promise.all([
    getStorefrontSnapshot(),
    getAdminCatalog(),
    getAdminOrders(),
    getAdminEstablishment(),
  ]);
  return (
    <AdminDashboard
      userName={user.email}
      storefront={storefront}
      catalog={catalog}
      orders={orders}
      establishment={establishment}
    />
  );
}
