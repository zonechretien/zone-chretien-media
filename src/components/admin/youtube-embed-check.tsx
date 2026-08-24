"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { getYoutubeId } from "@/lib/utils";

type Status = "idle" | "checking" | "ok" | "warning";

/**
 * Vérifie via l'API oEmbed de YouTube (https://www.youtube.com/oembed) si la vidéo
 * autorise l'intégration (embed). YouTube renvoie une erreur oEmbed pour les vidéos dont
 * l'intégration est désactivée (souvent le cas des clips distribués par des labels/Vevo) —
 * ce n'est qu'un indice, pas une garantie absolue, d'où le ton "pourrait" du message.
 */
export function YoutubeEmbedCheck({ url }: { url: string }) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const videoId = getYoutubeId(url);
    if (!videoId) {
      setStatus("idle");
      return;
    }

    setStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
        signal: controller.signal,
      })
        .then((res) => setStatus(res.ok ? "ok" : "warning"))
        .catch((err) => {
          if (err.name !== "AbortError") setStatus("warning");
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url]);

  if (status === "checking") {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
        <Loader2 size={12} className="animate-spin" />
        Vérification de la vidéo…
      </p>
    );
  }

  if (status === "warning") {
    return (
      <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        Cette vidéo pourrait ne pas être lisible en intégré (possible restriction
        Vevo/label) — vérifiez ou cherchez une source alternative (chaîne officielle de
        l&apos;artiste).
      </p>
    );
  }

  return null;
}
