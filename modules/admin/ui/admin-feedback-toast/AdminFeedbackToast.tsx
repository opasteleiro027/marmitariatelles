"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AdminFeedbackKind } from "../../domain/admin-feedback";
import styles from "./admin-feedback-toast.module.css";

type Feedback = {
  kind: AdminFeedbackKind;
  message: string;
};

export function AdminFeedbackToast() {
  const searchParams = useSearchParams();
  const kind = searchParams.get("feedback");
  const message = searchParams.get("feedbackMessage")?.trim();
  const feedback: Feedback | null =
    (kind === "success" || kind === "error") && message
      ? { kind, message }
      : null;
  const feedbackKey = feedback
    ? `${feedback.kind}:${feedback.message}`
    : null;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const visibleFeedback =
    feedback && feedbackKey !== dismissedKey ? feedback : null;
  const visibleKind = visibleFeedback?.kind;

  useEffect(() => {
    if (!visibleKind || !feedbackKey) return;

    const timeout = window.setTimeout(
      () => {
        setDismissedKey(feedbackKey);
        clearFeedbackParameters();
      },
      visibleKind === "success" ? 5000 : 8000,
    );
    return () => window.clearTimeout(timeout);
  }, [feedbackKey, visibleKind]);

  if (!visibleFeedback) return null;

  return (
    <aside
      aria-atomic="true"
      className={`${styles.toast} ${styles[visibleFeedback.kind]}`}
      role={visibleFeedback.kind === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true" className={styles.icon}>
        {visibleFeedback.kind === "success" ? "✓" : "!"}
      </span>
      <div>
        <strong>
          {visibleFeedback.kind === "success"
            ? "Alteração salva"
            : "Não foi possível salvar"}
        </strong>
        <p>{visibleFeedback.message}</p>
      </div>
      <button
        aria-label="Fechar aviso"
        onClick={() => {
          setDismissedKey(feedbackKey);
          clearFeedbackParameters();
        }}
        type="button"
      >
        ×
      </button>
    </aside>
  );
}

function clearFeedbackParameters() {
  const url = new URL(window.location.href);
  url.searchParams.delete("feedback");
  url.searchParams.delete("feedbackMessage");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}
