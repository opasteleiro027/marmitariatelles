import type { Metadata } from "next";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";
import { MenuBuilder } from "@/modules/storefront/ui/menu-builder/MenuBuilder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio",
  description: "Monte seu pedido na Marmitaria Telles e confira o valor em tempo real.",
};

export default async function MenuPage() {
  const snapshot = await getStorefrontSnapshot();
  return <MenuBuilder snapshot={snapshot} />;
}
