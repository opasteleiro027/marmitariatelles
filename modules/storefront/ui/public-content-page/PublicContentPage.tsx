import type { ReactNode } from "react";
import type { StorefrontSnapshot } from "../../domain/storefront.types";
import { SiteHeader } from "../site-header/SiteHeader";
import styles from "./public-content-page.module.css";

export function PublicContentPage({
  snapshot,
  active,
  eyebrow,
  title,
  intro,
  children,
}: {
  snapshot: StorefrontSnapshot;
  active: "how" | "contact";
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <SiteHeader
        active={active}
        businessName={snapshot.businessName}
        ordersOpen={snapshot.ordersOpen}
      />
      <section className={styles.hero}>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{intro}</span>
      </section>
      <section className={styles.content}>{children}</section>
      <footer>
        <strong>{snapshot.businessName}</strong>
        <span>{snapshot.address}</span>
      </footer>
    </main>
  );
}
