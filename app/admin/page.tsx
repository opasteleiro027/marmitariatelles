import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { isAuthorizedAdmin } from "@/modules/admin/domain/admin-authorization";
import { AdminAccessDenied } from "@/modules/admin/ui/AdminAccessDenied";
import { AdminDashboard } from "@/modules/admin/ui/AdminDashboard";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");

  if (!isAuthorizedAdmin(user.email)) {
    return <AdminAccessDenied email={user.email} />;
  }

  const storefront = await getStorefrontSnapshot();
  return <AdminDashboard userName={user.displayName} storefront={storefront} />;
}
