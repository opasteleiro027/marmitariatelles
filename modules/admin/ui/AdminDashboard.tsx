import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import type { StorefrontSnapshot } from "@/modules/storefront/domain/storefront.types";
import styles from "./admin.module.css";

const navigation = [
  ["⌂", "Visão geral"],
  ["▤", "Pedidos"],
  ["◫", "Cardápio"],
  ["◎", "Áreas de entrega"],
  ["◷", "Horários"],
  ["⚙", "Configurações"],
];

export function AdminDashboard({
  userName,
  storefront,
}: {
  userName: string;
  storefront: StorefrontSnapshot;
}) {
  return (
    <main className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="/admin">
          <span>DM</span>
          <strong>Domingo na Mesa</strong>
        </a>
        <nav aria-label="Administração">
          {navigation.map(([icon, label], index) => (
            <a
              className={index === 0 ? styles.activeNav : undefined}
              href={index === 0 ? "/admin" : "#em-breve"}
              key={label}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </a>
          ))}
        </nav>
        <a className={styles.signOut} href={chatGPTSignOutPath("/")}>
          Sair
        </a>
      </aside>

      <section className={styles.adminContent}>
        <header className={styles.adminHeader}>
          <div>
            <p>Operação de domingo</p>
            <h1>Olá, {userName}</h1>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            Ver loja ↗
          </a>
        </header>

        <section className={styles.operationBanner}>
          <div>
            <span className={styles.liveDot} />
            <p>Próxima venda</p>
            <strong>{storefront.salesDateLabel}</strong>
          </div>
          <div>
            <p>Status</p>
            <strong>
              {storefront.ordersOpen ? "Pedidos abertos" : "Pedidos pausados"}
            </strong>
          </div>
          <button type="button">Pausar novos pedidos</button>
        </section>

        <div className={styles.metricGrid}>
          <article><p>Produtos ativos</p><strong>{storefront.products.length}</strong><small>no cardápio atual</small></article>
          <article><p>Pedidos recebidos</p><strong>0</strong><small>fundação sem pedidos reais</small></article>
          <article><p>Capacidade utilizada</p><strong>0%</strong><small>faixas serão configuradas</small></article>
          <article><p>Faturamento previsto</p><strong>R$ 0,00</strong><small>nenhum pedido confirmado</small></article>
        </div>

        <section className={styles.foundationPanel} id="em-breve">
          <div>
            <p className={styles.eyebrow}>Fase 1 — Fundação</p>
            <h2>A operação já tem uma base organizada.</h2>
            <p>
              Persistência, autenticação e módulos de negócio foram separados
              para receber o fluxo completo sem misturar regras com interface.
            </p>
          </div>
          <ul>
            <li><span>✓</span> Layout público responsivo</li>
            <li><span>✓</span> Área administrativa protegida</li>
            <li><span>✓</span> Catálogo inicial persistente</li>
            <li><span>→</span> Carrinho e checkout na próxima etapa</li>
          </ul>
        </section>
      </section>
    </main>
  );
}
