"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  classifyOrderPulse,
  type OrderPulse,
} from "../../domain/order-pulse";
import styles from "./admin-order-monitor.module.css";

const POLLING_INTERVAL_MS = 5_000;
const ALERT_AUDIO_URL = "/audio/new-order.mp3";
const DEFAULT_VOLUME = 80;

type AudioState = "loading" | "waiting" | "ready" | "unavailable";

export function AdminOrderMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  const pulseRef = useRef<OrderPulse | null>(null);
  const checkingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const soundEnabledRef = useRef(true);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [audioState, setAudioState] = useState<AudioState>("loading");
  const [notification, setNotification] = useState(
    "Som de novos pedidos ativo por padrão.",
  );

  useEffect(() => {
    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextConstructor) {
      const unavailableTimer = window.setTimeout(() => {
        setAudioState("unavailable");
        setNotification("Este navegador não oferece alerta sonoro.");
      });
      return () => window.clearTimeout(unavailableTimer);
    }

    const context = new AudioContextConstructor();
    audioContextRef.current = context;
    let cancelled = false;

    const markContextState = () => {
      if (cancelled) return;
      setAudioState(
        audioBufferRef.current && context.state === "running"
          ? "ready"
          : "waiting",
      );
    };
    const unlockAudio = () => {
      void context.resume().then(markContextState).catch(() => undefined);
    };

    window.addEventListener("pointerdown", unlockAudio, { capture: true });
    window.addEventListener("keydown", unlockAudio, { capture: true });

    void fetch(ALERT_AUDIO_URL, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Áudio indisponível.");
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        if (cancelled) return;
        audioBufferRef.current = buffer;
        markContextState();
        void context.resume().then(markContextState).catch(() => undefined);
      })
      .catch(() => {
        if (cancelled) return;
        setAudioState("unavailable");
        setNotification("Não foi possível carregar o som de novos pedidos.");
      });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlockAudio, {
        capture: true,
      });
      window.removeEventListener("keydown", unlockAudio, { capture: true });
      audioSourceRef.current?.stop();
      void context.close();
    };
  }, []);

  const playAlert = useCallback(async () => {
    if (!soundEnabledRef.current) return;
    const context = audioContextRef.current;
    const buffer = audioBufferRef.current;
    if (!context || !buffer) {
      setNotification("O som ainda está sendo preparado.");
      return;
    }

    try {
      await context.resume();
      if (context.state !== "running") {
        setAudioState("waiting");
        setNotification(
          "Clique em qualquer lugar do painel para liberar o som.",
        );
        return;
      }

      try {
        audioSourceRef.current?.stop();
      } catch {
        // A fonte anterior já terminou.
      }
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = volumeRef.current / 100;
      source.connect(gain);
      gain.connect(context.destination);
      source.onended = () => {
        if (audioSourceRef.current === source) {
          audioSourceRef.current = null;
        }
      };
      audioSourceRef.current = source;
      source.start();
      setAudioState("ready");
    } catch {
      setAudioState("waiting");
      setNotification("Clique no painel e teste o som novamente.");
    }
  }, []);

  const toggleSound = useCallback(() => {
    const nextEnabled = !soundEnabledRef.current;
    soundEnabledRef.current = nextEnabled;
    setSoundEnabled(nextEnabled);
    if (!nextEnabled) {
      try {
        audioSourceRef.current?.stop();
      } catch {
        // O áudio já terminou.
      }
      setNotification("Alerta sonoro silenciado.");
      return;
    }
    setNotification("Alerta sonoro ativo.");
  }, []);

  function updateVolume(nextValue: number) {
    const nextVolume = Math.min(100, Math.max(0, nextValue));
    volumeRef.current = nextVolume;
    setVolume(nextVolume);
  }

  useEffect(() => {
    async function checkForUpdates() {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const response = await fetch("/api/admin/orders/pulse", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const nextPulse = (await response.json()) as OrderPulse;
        const previousPulse = pulseRef.current;
        pulseRef.current = nextPulse;
        if (!previousPulse) return;
        const change = classifyOrderPulse(previousPulse, nextPulse);
        if (change === "unchanged") return;

        if (change === "new-order") {
          setNotification("Novo pedido recebido. Lista atualizada.");
          await playAlert();
        }
        if (pathname === "/admin" || pathname === "/admin/pedidos") {
          router.refresh();
        }
      } catch {
        // Uma falha temporária não interrompe as próximas verificações.
      } finally {
        checkingRef.current = false;
      }
    }

    void checkForUpdates();
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
  }, [pathname, playAlert, router]);

  const soundStatus =
    audioState === "unavailable"
      ? "Som indisponível"
      : audioState === "ready"
        ? `Som ativo · ${volume}%`
        : "Som ativo · aguardando interação";

  return (
    <div className={styles.liveControls}>
      <div className={styles.liveStatus}>
        <span aria-hidden="true" />
        <span>Atualização automática · 5s</span>
      </div>
      <div className={styles.soundControls}>
        <span className={styles.soundStatus}>{soundStatus}</span>
        <label className={styles.volumeControl}>
          <span>Volume</span>
          <input
            aria-label="Volume do alerta de novo pedido"
            disabled={!soundEnabled || audioState === "unavailable"}
            max="100"
            min="0"
            onChange={(event) => updateVolume(Number(event.target.value))}
            type="range"
            value={volume}
          />
          <output>{volume}%</output>
        </label>
        <button
          disabled={!soundEnabled || audioState === "unavailable"}
          onClick={() => void playAlert()}
          type="button"
        >
          Testar som
        </button>
        <button
          aria-pressed={soundEnabled}
          className={soundEnabled ? styles.soundEnabled : undefined}
          onClick={toggleSound}
          type="button"
        >
          <span aria-hidden="true">{soundEnabled ? "🔊" : "🔕"}</span>
          {soundEnabled ? "Silenciar" : "Ativar som"}
        </button>
      </div>
      <p aria-live="polite" className={styles.liveAnnouncement}>
        {notification}
      </p>
    </div>
  );
}
