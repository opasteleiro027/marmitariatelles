"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  classifyOrderPulse,
  type OrderPulse,
} from "../../domain/order-pulse";
import styles from "./admin-order-list.module.css";

const POLLING_INTERVAL_MS = 5_000;

function playOrderAlert(context: AudioContext) {
  const startAt = context.currentTime;
  [0, 0.22].forEach((delay, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = index === 0 ? 660 : 880;
    gain.gain.setValueAtTime(0.0001, startAt + delay);
    gain.gain.exponentialRampToValueAtTime(0.22, startAt + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + delay + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt + delay);
    oscillator.stop(startAt + delay + 0.18);
  });
}

export function AdminOrderLiveUpdates({
  initialPulse,
}: {
  initialPulse: OrderPulse;
}) {
  const router = useRouter();
  const pulseRef = useRef(initialPulse);
  const checkingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    pulseRef.current = initialPulse;
  }, [initialPulse]);

  useEffect(
    () => () => {
      void audioContextRef.current?.close();
    },
    [],
  );

  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      await audioContextRef.current?.close();
      audioContextRef.current = null;
      setSoundEnabled(false);
      setNotification("Alerta sonoro desativado.");
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextConstructor) {
      setNotification("Este navegador não oferece alerta sonoro.");
      return;
    }

    try {
      const context = new AudioContextConstructor();
      await context.resume();
      audioContextRef.current = context;
      playOrderAlert(context);
      setSoundEnabled(true);
      setNotification("Alerta sonoro ativado.");
    } catch {
      setNotification("O navegador bloqueou o som. Tente ativar novamente.");
    }
  }, [soundEnabled]);

  useEffect(() => {
    async function checkForUpdates() {
      if (document.hidden || checkingRef.current) return;
      checkingRef.current = true;
      try {
        const response = await fetch("/api/admin/orders/pulse", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const nextPulse = (await response.json()) as OrderPulse;
        const change = classifyOrderPulse(pulseRef.current, nextPulse);
        pulseRef.current = nextPulse;
        if (change === "unchanged") return;

        if (change === "new-order") {
          setNotification("Novo pedido recebido. Lista atualizada.");
          const context = audioContextRef.current;
          if (soundEnabled && context) {
            await context.resume();
            playOrderAlert(context);
          }
        }
        router.refresh();
      } catch {
        // Uma falha temporária não interrompe as próximas verificações.
      } finally {
        checkingRef.current = false;
      }
    }

    const intervalId = window.setInterval(
      checkForUpdates,
      POLLING_INTERVAL_MS,
    );
    const handleVisibility = () => {
      if (!document.hidden) void checkForUpdates();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router, soundEnabled]);

  return (
    <div className={styles.liveControls}>
      <div className={styles.liveStatus}>
        <span aria-hidden="true" />
        <span>Atualização automática · 5s</span>
      </div>
      <button
        aria-pressed={soundEnabled}
        className={soundEnabled ? styles.soundEnabled : undefined}
        onClick={() => void toggleSound()}
        type="button"
      >
        <span aria-hidden="true">{soundEnabled ? "🔊" : "🔔"}</span>
        {soundEnabled ? "Desativar som" : "Ativar som"}
      </button>
      <p aria-live="polite" className={styles.liveAnnouncement}>
        {notification}
      </p>
    </div>
  );
}
