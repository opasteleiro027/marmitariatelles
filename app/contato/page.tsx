import type { Metadata } from "next";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";
import { PublicContentPage } from "@/modules/storefront/ui/public-content-page/PublicContentPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contato",
};

export default async function ContactPage() {
  const snapshot = await getStorefrontSnapshot();
  return (
    <PublicContentPage
      active="contact"
      eyebrow="Fale com a Marmitaria Telles"
      intro="Estamos à disposição para dúvidas sobre pedidos, retirada e entrega."
      snapshot={snapshot}
      title="Conte com a gente"
    >
      <article>
        <span>01</span>
        <h2>WhatsApp</h2>
        <p>{snapshot.phone}</p>
        <a href={`https://wa.me/${snapshot.whatsapp}`}>Iniciar conversa</a>
      </article>
      <article>
        <span>02</span>
        <h2>Endereço</h2>
        <p>{snapshot.address}</p>
      </article>
      <article>
        <span>03</span>
        <h2>Atendimento</h2>
        <p>{snapshot.deliveryWindowLabel}</p>
        <a href="/cardapio">Fazer um pedido</a>
      </article>
    </PublicContentPage>
  );
}
