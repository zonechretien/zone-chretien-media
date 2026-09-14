"use client";

import { useEffect } from "react";
import { recordHistory, type FavoriteType } from "@/lib/personalization";

/**
 * Monté (sans rendu visuel) sur les pages de détail pour enregistrer
 * automatiquement la consultation dans l'historique local (`zc_historique`).
 */
export function HistoryRecorder({ type, id }: { type: FavoriteType; id: string }) {
  useEffect(() => {
    recordHistory({ type, id });
  }, [type, id]);

  return null;
}
