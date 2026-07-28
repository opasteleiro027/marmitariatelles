import Link from "next/link";
import type { StorefrontSnapshot } from "@/modules/storefront/domain/storefront.types";
import type { AdminOrderMetrics } from "@/modules/ordering/application/admin-orders";
import type { AdminOrderReport } from "@/modules/ordering/application/admin-order-report";
import type { AdminBusinessSettings } from "@/modules/establishment/application/admin-establishment";
import { toggleSiteAvailabilityAction } from "@/modules/establishment/server/establishment-actions";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import styles from "./admin-overview.module.css";

const reportPeriods = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
] as const;

export function AdminOverview({
  storefront,
  orderMetrics,
  settings,
  report,
}: {
  storefront: StorefrontSnapshot;
  orderMetrics: AdminOrderMetrics;
  settings: AdminBusinessSettings;
  report: AdminOrderReport;
}) {
  const siteEnabled = !settings.ordersPaused;
  const topCustomer = report.topCustomers[0];
  const topNeighborhood = report.neighborhoods[0];

  return (
    <>
      <section className={styles.operationBanner}>
        <div>
          <span
            className={siteEnabled ? styles.liveDot : styles.siteOffDot}
          />
          <p>Controle do site</p>
          <strong>{siteEnabled ? "Site ligado" : "Site desligado"}</strong>
        </div>
        <div>
          <p>Novos pedidos</p>
          <strong>{siteEnabled ? "Liberados" : "Bloqueados"}</strong>
        </div>
        <form action={toggleSiteAvailabilityAction}>
          <input type="hidden" name="enabled" value={String(!siteEnabled)} />
          <button
            className={siteEnabled ? undefined : styles.enableSiteButton}
            type="submit"
          >
            {siteEnabled ? "Desligar site" : "Ligar site"}
          </button>
        </form>
      </section>

      <div className={styles.metricGrid}>
        <article>
          <p>Produtos ativos</p>
          <strong>{storefront.products.length}</strong>
          <small>no cardápio atual</small>
        </article>
        <article>
          <p>Pedidos recebidos</p>
          <strong>{orderMetrics.received}</strong>
          <small>{orderMetrics.active} em andamento</small>
        </article>
        <article>
          <p>Pedidos concluídos</p>
          <strong>{orderMetrics.completed}</strong>
          <small>entregues ou retirados</small>
        </article>
        <article>
          <p>Faturamento previsto</p>
          <strong>{formatMoney(orderMetrics.projectedRevenueInCents)}</strong>
          <small>pedidos não cancelados</small>
        </article>
      </div>

      <section className={styles.reportPanel}>
        <header className={styles.reportHeader}>
          <div>
            <p className={styles.eyebrow}>Relatório de desempenho</p>
            <h2>Fechamento do expediente</h2>
            <p className={styles.reportDescription}>
              {report.periodLabel}. Atualizado automaticamente com todos os
              pedidos não cancelados.
            </p>
          </div>
          <nav className={styles.periodFilter} aria-label="Período do relatório">
            {reportPeriods.map((period) => (
              <Link
                key={period.value}
                href={`/admin?periodo=${period.value}`}
                className={
                  report.period === period.value ? styles.activePeriod : undefined
                }
                aria-current={
                  report.period === period.value ? "page" : undefined
                }
              >
                {period.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className={styles.reportMetricGrid}>
          <article>
            <span>Faturamento</span>
            <strong>{formatMoney(report.totals.revenueInCents)}</strong>
            <small>{report.totals.orders} pedidos válidos</small>
          </article>
          <article>
            <span>Ticket médio</span>
            <strong>
              {formatMoney(report.totals.averageOrderTicketInCents)}
            </strong>
            <small>valor médio por pedido</small>
          </article>
          <article>
            <span>Clientes únicos</span>
            <strong>{report.totals.uniqueCustomers}</strong>
            <small>{report.totals.returningCustomers} compraram mais de uma vez</small>
          </article>
          <article>
            <span>Gasto por cliente</span>
            <strong>
              {formatMoney(report.totals.averageRevenuePerCustomerInCents)}
            </strong>
            <small>média no período</small>
          </article>
          <article>
            <span>Taxa de recompra</span>
            <strong>{report.totals.repeatRatePercentage}%</strong>
            <small>clientes recorrentes</small>
          </article>
          <article>
            <span>Marmitas e itens</span>
            <strong>{report.totals.items}</strong>
            <small>unidades vendidas</small>
          </article>
        </div>

        <div className={styles.operationSummary}>
          <div>
            <span>Entregas</span>
            <strong>{report.totals.deliveries}</strong>
          </div>
          <div>
            <span>Retiradas</span>
            <strong>{report.totals.pickups}</strong>
          </div>
          <div>
            <span>Cancelados</span>
            <strong>{report.totals.cancelled}</strong>
          </div>
          <div>
            <span>Última atualização</span>
            <strong>{formatReportTime(report.generatedAt)}</strong>
          </div>
        </div>

        {report.totals.orders === 0 ? (
          <div className={styles.emptyReport}>
            <span>Sem movimentação</span>
            <h3>Ainda não há pedidos neste período.</h3>
            <p>
              Assim que um pedido entrar, os indicadores e rankings serão
              preenchidos automaticamente.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.highlightGrid}>
              <article className={styles.highlightCard}>
                <p>Cliente que mais pediu</p>
                <h3>{topCustomer?.name}</h3>
                <span>{formatPhone(topCustomer?.phone ?? "")}</span>
                <dl>
                  <div>
                    <dt>Pedidos</dt>
                    <dd>{topCustomer?.orders ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Total gasto</dt>
                    <dd>{formatMoney(topCustomer?.totalInCents ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Ticket médio</dt>
                    <dd>
                      {formatMoney(topCustomer?.averageTicketInCents ?? 0)}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className={styles.highlightCard}>
                <p>Bairro com mais pedidos</p>
                <h3>{topNeighborhood?.neighborhood ?? "Sem entregas"}</h3>
                <span>{topNeighborhood?.city ?? "Nenhum bairro no período"}</span>
                <dl>
                  <div>
                    <dt>Pedidos</dt>
                    <dd>{topNeighborhood?.orders ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Clientes</dt>
                    <dd>{topNeighborhood?.customers ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Ticket médio</dt>
                    <dd>
                      {formatMoney(topNeighborhood?.averageTicketInCents ?? 0)}
                    </dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className={styles.detailGrid}>
              <ReportTable
                title="Clientes do período"
                description="Ranking por frequência e valor gasto."
                headers={["Cliente", "Pedidos", "Total", "Ticket médio"]}
                emptyMessage="Nenhum cliente no período."
                rows={report.topCustomers.map((customer, index) => [
                  <div className={styles.primaryCell} key={customer.customerId}>
                    <span className={styles.rank}>{index + 1}</span>
                    <span>
                      <strong>{customer.name}</strong>
                      <small>{formatPhone(customer.phone)}</small>
                    </span>
                  </div>,
                  customer.orders,
                  formatMoney(customer.totalInCents),
                  formatMoney(customer.averageTicketInCents),
                ])}
              />

              <ReportTable
                title="Bairros atendidos"
                description="Onde estão os clientes que mais compram."
                headers={["Bairro", "Pedidos", "Clientes", "Faturamento"]}
                emptyMessage="Nenhuma entrega no período."
                rows={report.neighborhoods.map((neighborhood, index) => [
                  <div
                    className={styles.primaryCell}
                    key={`${neighborhood.city}-${neighborhood.neighborhood}`}
                  >
                    <span className={styles.rank}>{index + 1}</span>
                    <span>
                      <strong>{neighborhood.neighborhood}</strong>
                      <small>{neighborhood.city}</small>
                    </span>
                  </div>,
                  neighborhood.orders,
                  neighborhood.customers,
                  formatMoney(neighborhood.revenueInCents),
                ])}
              />

              <ReportTable
                title="Itens mais vendidos"
                description="Preferências de consumo no período."
                headers={["Item", "Unidades", "Pedidos", "Receita"]}
                emptyMessage="Nenhum item vendido no período."
                rows={report.topItems.map((item, index) => [
                  <div className={styles.primaryCell} key={item.name}>
                    <span className={styles.rank}>{index + 1}</span>
                    <strong>{item.name}</strong>
                  </div>,
                  item.quantity,
                  item.orders,
                  formatMoney(item.revenueInCents),
                ])}
              />

              <section className={styles.paymentCard}>
                <div className={styles.sectionHeading}>
                  <div>
                    <h3>Formas de pagamento</h3>
                    <p>Preferência dos clientes no período.</p>
                  </div>
                </div>
                <div className={styles.paymentList}>
                  {report.paymentMethods.length ? (
                    report.paymentMethods.map((method) => (
                      <div className={styles.paymentItem} key={method.label}>
                        <div>
                          <strong>{method.label}</strong>
                          <span>{method.percentage}% dos pedidos</span>
                          <b>{formatMoney(method.revenueInCents)}</b>
                        </div>
                        <span className={styles.paymentTrack}>
                          <span style={{ width: `${method.percentage}%` }} />
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.inlineEmpty}>
                      Nenhum pagamento no período.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function ReportTable({
  title,
  description,
  headers,
  rows,
  emptyMessage,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  emptyMessage: string;
}) {
  return (
    <section className={styles.tableCard}>
      <div className={styles.sectionHeading}>
        <div>
          <h3>{title}</h3>
          <p>
            {description}
          </p>
        </div>
      </div>
      {rows.length ? (
        <div className={styles.tableViewport}>
          <table>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, rowIndex) => (
                <tr key={rowIndex}>
                  {cells.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.inlineEmpty}>{emptyMessage}</p>
      )}
    </section>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(-11);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

function formatReportTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
