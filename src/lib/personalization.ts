"use client";

import { useSyncExternalStore } from "react";

/**
 * Favoris + historique, stockés uniquement dans le navigateur (aucun compte
 * utilisateur pour cette première version). Point d'entrée unique pour tout
 * accès à ces deux clés localStorage : si ce système est un jour remplacé par
 * un vrai compte, seules les fonctions de ce fichier changent (appel API au
 * lieu de localStorage) — les composants qui les utilisent n'ont rien à
 * changer.
 */

export type FavoriteType = "song" | "playlist" | "article" | "devotion" | "testimony";

/** `id` = slug du contenu (stable, déjà unique en base pour ces 5 types). */
export type ContentRef = { type: FavoriteType; id: string };

export type HistoryEntry = ContentRef & { viewedAt: string };

const FAVORITES_KEY = "zc_favoris";
const HISTORY_KEY = "zc_historique";
const HISTORY_MAX = 20;
const CHANGE_EVENT = "zc:personalization";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * `useSyncExternalStore` exige que `getSnapshot` renvoie la même référence
 * tant que rien n'a changé (sinon boucle de re-render). `JSON.parse` créant
 * un nouveau tableau à chaque appel, on met en cache le résultat par clé et
 * on ne le recalcule que si la chaîne brute du localStorage a changé.
 */
function createSnapshotCache<T>(key: string, fallback: T) {
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  return (): T => {
    if (!isBrowser()) return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    cachedValue = readJson<T>(key, fallback);
    return cachedValue;
  };
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota dépassé / stockage désactivé : on abandonne silencieusement,
    // ce n'est pas une fonctionnalité critique.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function sameRef(a: ContentRef, b: ContentRef) {
  return a.type === b.type && a.id === b.id;
}

// --- Favoris ------------------------------------------------------------

export function getFavorites(): ContentRef[] {
  return readJson<ContentRef[]>(FAVORITES_KEY, []);
}

export function isFavorite(ref: ContentRef): boolean {
  return getFavorites().some((f) => sameRef(f, ref));
}

/** Ajoute ou retire `ref` des favoris et retourne la nouvelle liste. */
export function toggleFavorite(ref: ContentRef): ContentRef[] {
  const current = getFavorites();
  const next = current.some((f) => sameRef(f, ref))
    ? current.filter((f) => !sameRef(f, ref))
    : [...current, ref];
  writeJson(FAVORITES_KEY, next);
  return next;
}

// --- Historique -----------------------------------------------------------

export function getHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_KEY, []);
}

/** Enregistre une consultation : l'élément remonte en tête (pas de doublon). */
export function recordHistory(ref: ContentRef): void {
  const current = getHistory();
  const next = [
    { ...ref, viewedAt: new Date().toISOString() },
    ...current.filter((h) => !sameRef(h, ref)),
  ].slice(0, HISTORY_MAX);
  writeJson(HISTORY_KEY, next);
}

// --- Hooks React (réactifs aux changements, SSR-safe) ----------------------

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const EMPTY_FAVORITES: ContentRef[] = [];
const EMPTY_HISTORY: HistoryEntry[] = [];
const getFavoritesSnapshot = createSnapshotCache<ContentRef[]>(FAVORITES_KEY, EMPTY_FAVORITES);
const getHistorySnapshot = createSnapshotCache<HistoryEntry[]>(HISTORY_KEY, EMPTY_HISTORY);

export function useFavorites(): ContentRef[] {
  return useSyncExternalStore(subscribe, getFavoritesSnapshot, () => EMPTY_FAVORITES);
}

export function useIsFavorite(ref: ContentRef): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getFavoritesSnapshot().some((f) => sameRef(f, ref)),
    () => false,
  );
}

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribe, getHistorySnapshot, () => EMPTY_HISTORY);
}
