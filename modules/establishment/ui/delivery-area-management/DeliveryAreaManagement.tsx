import { formatMoney } from "@/modules/storefront/domain/format-money";
import type { AdminDeliveryArea } from "../../application/admin-establishment";
import {
  createDeliveryAreaAction,
  updateDeliveryAreaAction,
} from "../../server/establishment-actions";
import { DeleteDeliveryAreaControl } from "./DeleteDeliveryAreaControl";
import styles from "./delivery-area-management.module.css";

export function DeliveryAreaManagement({
  areas,
}: {
  areas: AdminDeliveryArea[];
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Atendimento</p>
          <h2>Bairros cadastrados</h2>
        </div>
        <span>{areas.length} áreas</span>
      </div>

      <details className={styles.card}>
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
        {areas.length ? (
          areas.map((area) => (
            <details className={styles.area} key={area.id}>
              <summary>
                <span>
                  <strong>{area.neighborhood}</strong>
                  <small>{area.city}</small>
                </span>
                <span>
                  {area.active
                    ? formatMoney(area.deliveryFeeInCents)
                    : "Desativada"}
                </span>
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
              <DeleteDeliveryAreaControl
                id={area.id}
                neighborhood={area.neighborhood}
              />
            </details>
          ))
        ) : (
          <p className={styles.empty}>
            Nenhuma área cadastrada. Enquanto isso, a loja aceita somente
            retirada.
          </p>
        )}
      </div>
    </section>
  );
}
