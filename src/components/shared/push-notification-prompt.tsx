"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

const DISMISSED_KEY = "zc_push_prompt_dismissed";
const SHOW_DELAY_MS = 4000;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "error">("idle");

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission === "denied") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => {
        if (!cancelled && !existing) {
          timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        }
      })
      .catch(() => {
        // Pas de SW prêt (échec d'enregistrement) : on ne propose pas le push.
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function handleActivate() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        localStorage.setItem(DISMISSED_KEY, "1");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("subscribe-failed");

      localStorage.setItem(DISMISSED_KEY, "1");
      setVisible(false);
    } catch {
      setStatus("error");
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-lg items-center gap-3 rounded-2xl border border-gold/30 bg-navy px-4 py-3 text-white shadow-xl sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Bell size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">Recevez le verset du jour</p>
          {status === "denied" ? (
            <p className="text-xs text-white/60">
              Permission refusée — vous pouvez l&apos;activer depuis les réglages du navigateur.
            </p>
          ) : status === "error" ? (
            <p className="text-xs text-white/60">Une erreur est survenue, réessayez plus tard.</p>
          ) : (
            <p className="text-xs text-white/60">Une notification chaque matin, désactivable à tout moment.</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleActivate}
          disabled={status === "loading"}
          className="shrink-0 rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold text-navy transition hover:brightness-95 disabled:opacity-60"
        >
          {status === "loading" ? "…" : "Activer"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
