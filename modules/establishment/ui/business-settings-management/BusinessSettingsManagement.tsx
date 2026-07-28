import type { AdminBusinessSettings } from "../../application/admin-establishment";
import { saveBusinessSettingsAction } from "../../server/establishment-actions";
import styles from "./business-settings-management.module.css";

export function BusinessSettingsManagement({
  settings,
}: {
  settings: AdminBusinessSettings;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Dados públicos</p>
          <h2>Marmitaria Telles</h2>
        </div>
        <span>
          {settings.ordersPaused ? "Site desligado" : "Site ligado"}
        </span>
      </div>
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
          <textarea
            name="welcomeMessage"
            defaultValue={settings.welcomeMessage}
            required
          />
        </label>
        <label className={styles.wide}>
          Endereço
          <textarea name="address" defaultValue={settings.address} required />
        </label>
        <button type="submit">Salvar configurações</button>
      </form>
    </section>
  );
}
