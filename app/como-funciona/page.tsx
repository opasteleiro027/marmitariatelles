import type { Metadata } from "next";
import { getStorefrontSnapshot } from "@/modules/storefront/infrastructure/storefront.repository";
import { PublicContentPage } from "@/modules/storefront/ui/public-content-page/PublicContentPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Como funciona",
};

export default async function HowItWorksPage() {
  const snapshot = await getStorefrontSnapshot();
  return (
    <PublicContentPage
      active="how"
      eyebrow="Do cardápio à sua mesa"
      intro="Um fluxo simples para você montar, confirmar e acompanhar seu almoço."
      snapshot={snapshot}
      title="Pedir ficou mais fácil"
    >
      <article>
        <span>01</span>
        <h2>Monte o pedido</h2>
        <p>
          Acesse o cardápio, escolha seus itens e ajuste cada quantidade. O
          resumo e o valor são atualizados na hora.
        </p>
        <a href="/cardapio">Abrir cardápio</a>
      </article>
      <article>
        <span>02</span>
        <h2>Escolha como receber</h2>
        <p>
          Informe retirada ou entrega. Na entrega, o CEP preenche o endereço e
          identifica o bairro atendido automaticamente.
        </p>
      </article>
      <article>
        <span>03</span>
        <h2>Acompanhe</h2>
        <p>
          Após confirmar, você recebe um link exclusivo para acompanhar cada
          atualização do pedido.
        </p>
      </article>
    </PublicContentPage>
  );
}
