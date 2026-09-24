"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { StudioConnection } from "@/lib/reels/studio-client";
import { cn } from "@/lib/utils";

/** Indicateur « Studio local connecté / non connecté », avec le bouton Réessayer. */
export function StudioStatus({
  connection,
  onRetry,
}: {
  connection: StudioConnection;
  onRetry: (retryDrive: boolean) => Promise<void>;
}) {
  const [retrying, setRetrying] = useState(false);

  let tone: "ok" | "warn" | "off" | "wait" = "wait";
  let title = "Recherche du studio local…";
  let detail: string | null = null;

  if (connection.state === "offline") {
    tone = "off";
    title = "Studio local non connecté";
    detail = connection.message;
  } else if (connection.state === "online") {
    const { disque, navigateurRendu } = connection.status;
    if (!disque.detecte) {
      tone = "warn";
      title = "Studio local connecté — disque non détecté";
      detail = disque.message;
    } else if (navigateurRendu.etat === "absent") {
      tone = "warn";
      title = `Studio local connecté — ${disque.nom} (${disque.dossier ?? disque.lettre})`;
      detail = navigateurRendu.message;
    } else {
      tone = "ok";
      title = `Studio local connecté — ${disque.nom} (${disque.dossier ?? disque.lettre})`;
      if (navigateurRendu.etat === "verification") detail = "Vérification du navigateur de rendu…";
    }
  }

  async function retry() {
    setRetrying(true);
    try {
      await onRetry(connection.state === "online");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        tone === "ok" && "border-emerald-500/30 bg-emerald-500/10",
        tone === "warn" && "border-amber-500/30 bg-amber-500/10",
        tone === "off" && "border-red-500/30 bg-red-500/10",
        tone === "wait" && "border-border bg-surface",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          tone === "ok" && "bg-emerald-500",
          tone === "warn" && "bg-amber-500",
          tone === "off" && "bg-red-500",
          tone === "wait" && "bg-muted",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        {detail && <p className="mt-0.5 text-foreground/70">{detail}</p>}
      </div>
      {tone !== "ok" && tone !== "wait" && (
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-gold hover:text-gold disabled:opacity-60"
        >
          {retrying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Réessayer
        </button>
      )}
    </div>
  );
}
