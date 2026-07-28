"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./order-tracking-refresh.module.css";

const POLLING_INTERVAL_MS = 5_000;

export function OrderTrackingRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const refreshOrder = () => {
      router.refresh();
    };
    const intervalId = window.setInterval(
      refreshOrder,
      POLLING_INTERVAL_MS,
    );
    const refreshWhenVisible = () => {
      if (!document.hidden) refreshOrder();
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("online", refreshOrder);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("online", refreshOrder);
    };
  }, [enabled, router]);

  if (!enabled) return null;

  return (
    <span className={styles.live}>
      <i aria-hidden="true" />
      Atualização automática · 5s
    </span>
  );
}
