import { StorefrontPage } from "@/modules/storefront/ui/StorefrontPage";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getStorefrontSnapshot();
  return <StorefrontPage snapshot={snapshot} />;
}
