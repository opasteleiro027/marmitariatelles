import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import styles from "./admin.module.css";

export function AdminAccessDenied({ email }: { email: string }) {
  return (
    <main className={styles.centeredState}>
      <div>
        <span aria-hidden="true">🔐</span>
        <p className={styles.eyebrow}>Acesso administrativo</p>
        <h1>Este usuário ainda não foi autorizado.</h1>
        <p>
          O e-mail <strong>{email}</strong> está autenticado, mas não pertence à
          lista de administradores.
        </p>
        <a href={chatGPTSignOutPath("/admin")}>Entrar com outro usuário</a>
      </div>
    </main>
  );
}
