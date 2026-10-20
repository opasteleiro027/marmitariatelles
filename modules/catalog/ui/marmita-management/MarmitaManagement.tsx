import { formatMoney } from "@/modules/storefront/domain/format-money";
import type {
  AdminMarmitaConfiguration,
  AdminMarmitaOption,
  MarmitaGroupRole,
} from "../../application/marmita-admin";
import {
  createMarmitaOptionAction,
  createMarmitaSizeAction,
  deleteMarmitaOptionAction,
  deleteMarmitaSizeAction,
  updateMarmitaOptionAction,
  updateMarmitaSizeAction,
} from "../../server/catalog-actions";
import { CatalogDeleteControl } from "../catalog-delete-control/CatalogDeleteControl";
import styles from "./marmita-management.module.css";

const GROUP_DESCRIPTIONS: Record<
  MarmitaGroupRole,
  { step: number; description: string }
> = {
  base: { step: 2, description: "O cliente escolhe uma opção." },
  beans: { step: 3, description: "O cliente escolhe uma opção." },
  protein: {
    step: 4,
    description: "O limite é definido em cada tamanho de pote.",
  },
  side: {
    step: 5,
    description: "O limite é definido em cada tamanho de pote.",
  },
  extra: {
    step: 6,
    description: "Itens opcionais que podem acrescentar valor ao pedido.",
  },
};

export function MarmitaManagement({
  configuration,
}: {
  configuration: AdminMarmitaConfiguration;
}) {
  return (
    <section className={styles.section}>
      <header className={styles.heading}>
        <div>
          <p>Montagem personalizada</p>
          <h2>Montagem do Pote Mix</h2>
          <span>
            Configure exatamente as etapas que o cliente verá ao montar a
            pedido.
          </span>
        </div>
        <b>{configuration.sizes.length} tamanhos</b>
      </header>

      <div className={styles.step}>
        <div className={styles.stepTitle}>
          <span>1</span>
          <div>
            <h3>Tamanhos e limites</h3>
            <p>Preço inicial, complementos e finalizações permitidos.</p>
          </div>
        </div>

        <details className={styles.createPanel}>
          <summary>Adicionar tamanho</summary>
          <form action={createMarmitaSizeAction} className={styles.form}>
            <label>
              Nome
              <input name="name" placeholder="Ex.: Média (600g)" required />
            </label>
            <label>
              Preço inicial
              <input name="price" inputMode="decimal" placeholder="24,90" required />
            </label>
            <label className={styles.wide}>
              Descrição
              <input
                name="description"
                placeholder="Ex.: O tamanho mais pedido"
                required
              />
            </label>
            <label>
              Máx. de complementos
              <input name="proteinLimit" type="number" min="1" max="8" defaultValue="4" />
            </label>
            <label>
              Máx. de finalizações
              <input name="sideLimit" type="number" min="1" max="6" defaultValue="2" />
            </label>
            <button type="submit">Cadastrar tamanho</button>
          </form>
        </details>

        <div className={styles.cards}>
          {configuration.sizes.map((size) => (
            <details className={styles.card} key={size.id}>
              <summary>
                <span>
                  <strong>{size.name}</strong>
                  <small>
                    {size.proteinLimit} complemento(s) · {size.sideLimit} finalização(ões)
                  </small>
                </span>
                <span className={styles.cardActions}>
                  <b>{size.soldOut ? "Esgotada" : formatMoney(size.priceInCents)}</b>
                  <span className={styles.editAction}>Editar</span>
                </span>
              </summary>
              <form action={updateMarmitaSizeAction} className={styles.form}>
                <input type="hidden" name="id" value={size.id} />
                <label>
                  Nome
                  <input name="name" defaultValue={size.name} required />
                </label>
                <label>
                  Preço inicial
                  <input
                    name="price"
                    inputMode="decimal"
                    defaultValue={(size.priceInCents / 100).toFixed(2).replace(".", ",")}
                    required
                  />
                </label>
                <label className={styles.wide}>
                  Descrição
                  <input name="description" defaultValue={size.description} required />
                </label>
                <label>
                  Máx. de complementos
                  <input
                    name="proteinLimit"
                    type="number"
                    min="1"
                    max="8"
                    defaultValue={size.proteinLimit}
                  />
                </label>
                <label>
                  Máx. de finalizações
                  <input
                    name="sideLimit"
                    type="number"
                    min="1"
                    max="6"
                    defaultValue={size.sideLimit}
                  />
                </label>
                <label className={styles.check}>
                  <input name="active" type="checkbox" defaultChecked={size.active} />
                  Disponível no cardápio
                </label>
                <label className={styles.check}>
                  <input name="soldOut" type="checkbox" defaultChecked={size.soldOut} />
                  Marcar como esgotada
                </label>
                <button type="submit">Salvar edição</button>
              </form>
              <div className={styles.deleteArea}>
                <CatalogDeleteControl
                  action={deleteMarmitaSizeAction}
                  id={size.id}
                  itemName={size.name}
                  itemType="tamanho"
                />
              </div>
            </details>
          ))}
        </div>
      </div>

      {configuration.groups.map((group) => {
        const info = GROUP_DESCRIPTIONS[group.role];
        return (
          <div className={styles.step} key={group.id}>
            <div className={styles.stepTitle}>
              <span>{info.step}</span>
              <div>
                <h3>{group.name}</h3>
                <p>{info.description}</p>
              </div>
            </div>
            <details className={styles.createPanel}>
              <summary>Adicionar opção</summary>
              <form action={createMarmitaOptionAction} className={styles.optionForm}>
                <input type="hidden" name="groupId" value={group.id} />
                <label>
                  Nome
                  <input name="name" placeholder="Nome da opção" required />
                </label>
                <label>
                  Acréscimo
                  <input
                    name="additionalPrice"
                    inputMode="decimal"
                    placeholder="0,00"
                    defaultValue="0,00"
                    required
                  />
                </label>
                <button type="submit">Adicionar</button>
              </form>
            </details>
            <div className={styles.optionList}>
              <OptionList options={group.options} />
            </div>
          </div>
        );
      })}

      {configuration.customizationGroups.length > 0 ? (
        <div className={styles.step}>
          <div className={styles.stepTitle}>
            <span>+</span>
            <div>
              <h3>Adicionais de receitas e saladas</h3>
              <p>Edite ou exclua os adicionais ligados a produtos prontos.</p>
            </div>
          </div>
          {configuration.customizationGroups.map((group) => (
            <div className={styles.customizationGroup} key={group.id}>
              <h4>{group.name}</h4>
              <details className={styles.createPanel}>
                <summary>Adicionar opção</summary>
                <form action={createMarmitaOptionAction} className={styles.optionForm}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <label>
                    Nome
                    <input name="name" placeholder="Nome da opção" required />
                  </label>
                  <label>
                    Acréscimo
                    <input
                      name="additionalPrice"
                      inputMode="decimal"
                      placeholder="0,00"
                      defaultValue="0,00"
                      required
                    />
                  </label>
                  <button type="submit">Adicionar</button>
                </form>
              </details>
              <div className={styles.optionList}>
                <OptionList options={group.options} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function OptionList({ options }: { options: AdminMarmitaOption[] }) {
  return options.map((option) => (
    <div className={styles.optionCard} key={option.id}>
      <form action={updateMarmitaOptionAction} className={styles.optionRow}>
        <input type="hidden" name="id" value={option.id} />
        <label>
          <span>Opção</span>
          <input name="name" defaultValue={option.name} required />
        </label>
        <label>
          <span>Acréscimo</span>
          <input
            name="additionalPrice"
            inputMode="decimal"
            defaultValue={(option.additionalPriceInCents / 100)
              .toFixed(2)
              .replace(".", ",")}
            required
          />
        </label>
        <label className={styles.check}>
          <input name="active" type="checkbox" defaultChecked={option.active} />
          Ativa
        </label>
        <label className={styles.check}>
          <input name="soldOut" type="checkbox" defaultChecked={option.soldOut} />
          Esgotada
        </label>
        <button type="submit">Salvar edição</button>
      </form>
      <div className={styles.optionDelete}>
        <CatalogDeleteControl
          action={deleteMarmitaOptionAction}
          id={option.id}
          itemName={option.name}
          itemType="ingrediente"
        />
      </div>
    </div>
  ));
}
