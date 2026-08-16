"use client";

import { useEffect } from "react";

/**
 * Relit un brouillon déposé par le générateur IA (/admin/ia) dans
 * sessionStorage lors de la redirection vers un formulaire "nouveau", puis
 * l'efface. Ne s'exécute qu'au montage.
 */
export function useAIDraftPrefill<T>(key: string, apply: (draft: T) => void) {
  useEffect(() => {
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    sessionStorage.removeItem(key);
    try {
      apply(JSON.parse(raw) as T);
    } catch {
      // Brouillon corrompu : on ignore silencieusement.
    }
    // Volontairement au montage uniquement : `apply` capture les fonctions
    // stables de react-hook-form (reset/setValue) au premier rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
