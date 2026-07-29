import Link from "next/link";
import { BrandLogo } from "@/modules/brand/ui/brand-logo/BrandLogo";
import styles from "./site-header.module.css";

type SiteHeaderProps = {
  businessName: string;
  ordersOpen: boolean;
  active: "home" | "menu" | "how" | "contact";
  cartCount?: number;
  onCartOpen?: () => void;
};

const navigation = [
  { id: "home", href: "/", label: "Início" },
  { id: "menu", href: "/cardapio", label: "Cardápio" },
] as const;

export function SiteHeader({
  businessName,
  ordersOpen,
  active,
  cartCount = 0,
  onCartOpen,
}: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label={`${businessName}, início`}>
          <BrandLogo priority size={44} />
          <strong>{businessName}</strong>
        </Link>

        <nav aria-label="Navegação principal">
          {navigation.map((item) => (
            <Link
              aria-current={active === item.id ? "page" : undefined}
              href={item.href}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <span className={ordersOpen ? styles.open : styles.closed}>
            {ordersOpen ? "Aceitando pedidos" : "Site desligado"}
          </span>
          {onCartOpen ? (
            <button
              aria-label={`Abrir carrinho com ${cartCount} itens`}
              className={styles.cart}
              onClick={onCartOpen}
              type="button"
            >
              <span aria-hidden="true">Sacola</span>
              <strong>{cartCount}</strong>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
