import styles from "./loading.module.css";

export default function AdminPanelLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span aria-hidden="true" />
      <strong>Carregando tela…</strong>
    </div>
  );
}
