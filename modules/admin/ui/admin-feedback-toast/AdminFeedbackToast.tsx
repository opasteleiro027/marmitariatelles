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
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const kind = searchParams.get("feedback");
    const message = searchParams.get("feedbackMessage")?.trim();
    if ((kind !== "success" && kind !== "error") || !message) {
      setFeedback(null);
      return;
    }

    setFeedback({ kind, message });

    const timeout = window.setTimeout(
      () => {
        setFeedback(null);
        clearFeedbackParameters();
      },
      kind === "success" ? 5000 : 8000,
    );
    return () => window.clearTimeout(timeout);
  }, [searchParams]);

  if (!feedback) return null;

  return (
    <aside
      aria-atomic="true"
      className={`${styles.toast} ${styles[feedback.kind]}`}
      role={feedback.kind === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true" className={styles.icon}>
        {feedback.kind === "success" ? "✓" : "!"}
      </span>
      <div>
        <strong>
          {feedback.kind === "success"
            ? "Alteração salva"
            : "Não foi possível salvar"}
        </strong>
        <p>{feedback.message}</p>
      </div>
      <button
        aria-label="Fechar aviso"
        onClick={() => {
          setFeedback(null);
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
