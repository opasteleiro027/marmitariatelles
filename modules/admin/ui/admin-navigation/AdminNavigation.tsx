"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-navigation.module.css";

const navigation = [
  { icon: "⌂", label: "Visão geral", href: "/admin" },
  { icon: "▤", label: "Pedidos", href: "/admin/pedidos" },
  { icon: "◫", label: "Cardápio", href: "/admin/cardapio" },
  { icon: "◎", label: "Áreas de entrega", href: "/admin/areas-entrega" },
  { icon: "⚙", label: "Configurações", href: "/admin/configuracoes" },
];

export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administração" className={styles.navigation}>
      {navigation.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? styles.active : undefined}
            href={item.href}
            key={item.href}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
