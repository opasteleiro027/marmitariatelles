import { formatMoney } from "@/modules/storefront/domain/format-money";
import type { getAdminEstablishment } from "../../application/admin-establishment";
import {
  createDeliveryAreaAction,
  saveBusinessSettingsAction,
  updateDeliveryAreaAction,
} from "../../server/establishment-actions";
import styles from "./establishment-management.module.css";

export function EstablishmentManagement({
  snapshot,
}: {
  snapshot: Awaited<ReturnType<typeof getAdminEstablishment>>;
}) {
  const settings = snapshot.settings;
  return (
    <section className={styles.section} id="configuracoes">
      <div className={styles.heading}>
        <div>
          <p>Atendimento</p>
          <h2>Loja, pedidos e áreas de entrega</h2>
        </div>
        <span>
          {settings.ordersPaused ? "Pedidos pausados" : "Pedidos liberados"}
        </span>
      </div>

      <details className={styles.panel}>
        <summary>Editar dados da Marmitaria Telles</summary>
        <form action={saveBusinessSettingsAction} className={styles.form}>
          <label>
            Nome do negócio
            <input name="businessName" defaultValue={settings.businessName} required />
          </label>
          <label>
            WhatsApp
            <input name="whatsapp" defaultValue={settings.whatsapp} required />
          </label>
          <label>
            Telefone exibido
            <input name="phone" defaultValue={settings.phone} required />
          </label>
          <label>
            Pedido mínimo
            <input
              name="minimumOrder"
              inputMode="decimal"
              defaultValue={(settings.minimumOrderInCents / 100)
                .toFixed(2)
                .replace(".", ",")}
              required
            />
          </label>
          <label className={styles.wide}>
            Mensagem de boas-vindas
            <textarea name="welcomeMessage" defaultValue={settings.welcomeMessage} required />
          </label>
          <label className={styles.wide}>
            Endereço
            <textarea name="address" defaultValue={settings.address} required />
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              name="ordersPaused"
              defaultChecked={settings.ordersPaused}
            />
            Pausar novos pedidos
          </label>
          <button type="submit">Salvar configurações</button>
        </form>
      </details>

      <details className={styles.panel}>
        <summary>Cadastrar bairro atendido</summary>
        <form action={createDeliveryAreaAction} className={styles.form}>
          <label>Cidade<input name="city" defaultValue="Serra" required /></label>
          <label>Bairro<input name="neighborhood" required /></label>
          <label>Taxa de entrega<input name="deliveryFee" inputMode="decimal" placeholder="5,00" required /></label>
          <label>Pedido mínimo<input name="minimumOrder" inputMode="decimal" defaultValue="0,00" required /></label>
          <label>Prazo estimado (min)<input name="estimatedMinutes" type="number" min="1" /></label>
          <button type="submit">Cadastrar área</button>
        </form>
      </details>

      <div className={styles.areas}>
        {snapshot.areas.length ? (
          snapshot.areas.map((area) => (
            <details className={styles.area} key={area.id}>
              <summary>
                <span><strong>{area.neighborhood}</strong><small>{area.city}</small></span>
                <span>{area.active ? formatMoney(area.deliveryFeeInCents) : "Desativada"}</span>
              </summary>
              <form action={updateDeliveryAreaAction} className={styles.form}>
                <input type="hidden" name="id" value={area.id} />
                <label>Cidade<input name="city" defaultValue={area.city} required /></label>
                <label>Bairro<input name="neighborhood" defaultValue={area.neighborhood} required /></label>
                <label>Taxa<input name="deliveryFee" defaultValue={(area.deliveryFeeInCents / 100).toFixed(2).replace(".", ",")} required /></label>
                <label>Pedido mínimo<input name="minimumOrder" defaultValue={(area.minimumOrderInCents / 100).toFixed(2).replace(".", ",")} required /></label>
                <label>Prazo estimado<input name="estimatedMinutes" type="number" defaultValue={area.estimatedMinutes ?? ""} /></label>
                <label className={styles.check}><input type="checkbox" name="active" defaultChecked={area.active} />Área ativa</label>
                <button type="submit">Salvar área</button>
              </form>
            </details>
          ))
        ) : (
          <p className={styles.empty}>
            Nenhuma área cadastrada. Enquanto isso, a loja aceita somente retirada.
          </p>
        )}
      </div>
    </section>
  );
}
