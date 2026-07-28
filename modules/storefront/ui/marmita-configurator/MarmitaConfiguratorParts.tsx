import { formatMoney } from "../../domain/format-money";
import type {
  StorefrontMarmitaGroup,
  StorefrontMarmitaSize,
  StorefrontSnapshot,
} from "../../domain/storefront.types";
import styles from "./marmita-configurator.module.css";

export type ConfiguredSelection = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  additionalPriceInCents: number;
  quantity: number;
};

export function MarmitaGroupStep({
  group,
  number,
  size,
  quantities,
  orderingEnabled,
  onChange,
}: {
  group: StorefrontMarmitaGroup;
  number: number;
  size: StorefrontMarmitaSize | undefined;
  quantities: Record<string, number>;
  orderingEnabled: boolean;
  onChange: (group: StorefrontMarmitaGroup, optionId: string, delta: number) => void;
}) {
  const count = selectionCount(group, quantities);
  const limit = size?.limits[group.id];
  return (
    <section className={styles.step}>
      <StepTitle number={number} title={group.name} />
      <p className={styles.limit}>
        {group.role === "extra"
          ? "Opcional"
          : limit?.maximum === 1
            ? "Escolha 1 opção"
            : `Escolha até ${limit?.maximum ?? 1} · ${count} selecionado(s)`}
      </p>
      <div className={group.role === "side" ? styles.chipGrid : styles.optionGrid}>
        {group.options.map((option) => {
          const quantity = quantities[option.id] ?? 0;
          const selected = quantity > 0;
          if (group.selectionType === "single") {
            return (
              <button
                className={`${styles.radioOption} ${
                  selected ? styles.selected : ""
                }`}
                disabled={!option.available || !orderingEnabled}
                key={option.id}
                onClick={() => onChange(group, option.id, 1)}
                type="button"
              >
                <span>{option.name}</span>
                <b>{optionStatus(option)}</b>
              </button>
            );
          }
          if (group.role === "side") {
            return (
              <button
                className={`${styles.chip} ${selected ? styles.selected : ""}`}
                disabled={!option.available || !orderingEnabled}
                key={option.id}
                onClick={() => onChange(group, option.id, selected ? -1 : 1)}
                type="button"
              >
                {selected ? "✓ " : ""}
                {option.name}
              </button>
            );
          }
          return (
            <div className={styles.counterOption} key={option.id}>
              <span>
                <strong>{option.name}</strong>
                <small>{optionStatus(option)}</small>
              </span>
              <div>
                <button
                  aria-label={`Remover ${option.name}`}
                  disabled={!quantity}
                  onClick={() => onChange(group, option.id, -1)}
                  type="button"
                >
                  −
                </button>
                <b>{quantity}</b>
                <button
                  aria-label={`Adicionar ${option.name}`}
                  disabled={!option.available || !orderingEnabled}
                  onClick={() => onChange(group, option.id, 1)}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MarmitaSummary({
  builder,
  size,
  selections,
  total,
  complete,
  orderingEnabled,
  onAdd,
}: {
  builder: StorefrontSnapshot["marmitaBuilder"];
  size: StorefrontMarmitaSize | undefined;
  selections: ConfiguredSelection[];
  total: number;
  complete: boolean;
  orderingEnabled: boolean;
  onAdd: () => void;
}) {
  const basePrice = size
    ? size.promotionalPriceInCents ?? size.priceInCents
    : 0;
  return (
    <aside className={styles.summary}>
      <header>
        <span aria-hidden="true">▰</span>
        <div>
          <h2>Sua marmita</h2>
          <p>Personalização em tempo real</p>
        </div>
      </header>
      <SummaryLine label="Tamanho" value={size?.name ?? "Escolha"} price={basePrice} />
      {builder.groups.map((group) => {
        const chosen = selections.filter(
          (selection) => selection.groupId === group.id,
        );
        return (
          <SummaryLine
            key={group.id}
            label={group.name}
            value={
              chosen.length
                ? chosen
                    .map((item) =>
                      item.quantity > 1
                        ? `${item.quantity}× ${item.optionName}`
                        : item.optionName,
                    )
                    .join(", ")
                : "Pendente..."
            }
            price={chosen.reduce(
              (sum, item) =>
                sum + item.additionalPriceInCents * item.quantity,
              0,
            )}
          />
        );
      })}
      <div className={styles.total}>
        <span>Total da marmita</span>
        <strong>{formatMoney(total)}</strong>
      </div>
      <button
        className={styles.addButton}
        disabled={!complete || !orderingEnabled}
        onClick={onAdd}
        type="button"
      >
        {!orderingEnabled
          ? "Pedidos indisponíveis"
          : complete
            ? "Adicionar ao carrinho"
            : "Complete sua marmita"}
      </button>
    </aside>
  );
}

export function StepTitle({ number, title }: { number: number; title: string }) {
  return (
    <div className={styles.stepTitle}>
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

export function selectionCount(
  group: StorefrontMarmitaGroup,
  quantities: Record<string, number>,
) {
  return group.options.reduce(
    (total, option) => total + (quantities[option.id] ?? 0),
    0,
  );
}

function SummaryLine({
  label,
  value,
  price,
}: {
  label: string;
  value: string;
  price: number;
}) {
  return (
    <div className={styles.summaryLine}>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <b>{price ? `+ ${formatMoney(price)}` : "Incluso"}</b>
    </div>
  );
}

function optionStatus(
  option: StorefrontMarmitaGroup["options"][number],
) {
  if (!option.available) return "Esgotado";
  return option.additionalPriceInCents
    ? `+ ${formatMoney(option.additionalPriceInCents)}`
    : "Incluso";
}
