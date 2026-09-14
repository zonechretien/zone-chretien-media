"use client";

import { useEffect } from "react";

/**
 * Le service worker (src/app/sw.ts, buildé en public/sw.js par Serwist)
 * n'était jamais enregistré côté client : le cache offline et les
 * notifications push étaient donc inactifs malgré la configuration PWA.
 * Montage unique, sans rendu visuel.
 */
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Pas de service worker actif = simplement pas de mode hors-ligne ni de
      // push pour cette session ; le site fonctionne normalement sans.
    });
  }, []);

  return null;
}
