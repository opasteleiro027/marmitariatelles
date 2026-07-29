import Link from "next/link";
import { BrandLogo } from "@/modules/brand/ui/brand-logo/BrandLogo";
import { loginAction } from "./actions";
import styles from "@/modules/admin-auth/ui/admin-login.module.css";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.brand}>
          <BrandLogo priority size={72} />
          Marmitaria Telles
        </Link>
        <p className={styles.eyebrow}>Área administrativa</p>
        <h1>Entre para cuidar da operação.</h1>
        <p className={styles.intro}>
          Acesso exclusivo para o responsável pela Marmitaria Telles.
        </p>
        {error ? (
          <p className={styles.error} role="alert">
            E-mail ou senha inválidos.
          </p>
        ) : null}
        <form action={loginAction}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button type="submit">Entrar no painel</button>
        </form>
      </section>
    </main>
  );
}
