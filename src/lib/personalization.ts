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

export type FavoriteType = "song" | "playlist" | "article" | "devotion" | "testimony" | "bible";

/**
 * `id` = slug du contenu (stable, déjà unique en base) pour les types de
 * contenu classiques ; pour `"bible"`, `id` = `${bookSlug}:${chapterNumber}`
 * (un chapitre biblique n'a pas de slug propre en base).
 */
export type ContentRef = { type: FavoriteType; id: string };

export type HistoryEntry = ContentRef & { viewedAt: string };

/**
 * Un verset favori est stocké intégralement (texte compris) plutôt que comme
 * une simple référence à résoudre plus tard : contrairement aux 5 types de
 * `FavoriteType`, un verset n'a pas de slug en base à passer à
 * `/api/content/resolve` — inutile d'inventer un identifiant composite pour
 * un aller-retour API que le texte dénormalisé rend superflu.
 */
export type FavoriteVerseRef = {
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

/** Un plan de lecture démarré côté visiteur ; `daysRead` = numéros de jour cochés. */
export type ActivePlan = {
  planSlug: string;
  startedAt: string;
  daysRead: number[];
};

const FAVORITES_KEY = "zc_favoris";
const HISTORY_KEY = "zc_historique";
const FAVORITE_VERSES_KEY = "zc_versets_favoris";
const ACTIVE_PLANS_KEY = "zc_plans_actifs";
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

// --- Versets favoris --------------------------------------------------------

function sameVerse(a: FavoriteVerseRef, b: { bookSlug: string; chapter: number; verse: number }) {
  return a.bookSlug === b.bookSlug && a.chapter === b.chapter && a.verse === b.verse;
}

export function getFavoriteVerses(): FavoriteVerseRef[] {
  return readJson<FavoriteVerseRef[]>(FAVORITE_VERSES_KEY, []);
}

export function isVerseFavorite(bookSlug: string, chapter: number, verse: number): boolean {
  return getFavoriteVerses().some((v) => sameVerse(v, { bookSlug, chapter, verse }));
}

/** Ajoute ou retire un verset des favoris et retourne la nouvelle liste. */
export function toggleFavoriteVerse(ref: FavoriteVerseRef): FavoriteVerseRef[] {
  const current = getFavoriteVerses();
  const next = current.some((v) => sameVerse(v, ref))
    ? current.filter((v) => !sameVerse(v, ref))
    : [...current, ref];
  writeJson(FAVORITE_VERSES_KEY, next);
  return next;
}

// --- Plans de lecture ---------------------------------------------------

export function getActivePlans(): ActivePlan[] {
  return readJson<ActivePlan[]>(ACTIVE_PLANS_KEY, []);
}

export function getActivePlan(planSlug: string): ActivePlan | undefined {
  return getActivePlans().find((p) => p.planSlug === planSlug);
}

/** Démarre un plan (aucun effet s'il est déjà démarré) et retourne la nouvelle liste. */
export function startPlan(planSlug: string): ActivePlan[] {
  const current = getActivePlans();
  if (current.some((p) => p.planSlug === planSlug)) return current;
  const next = [...current, { planSlug, startedAt: new Date().toISOString(), daysRead: [] }];
  writeJson(ACTIVE_PLANS_KEY, next);
  return next;
}

/** Coche/décoche un jour comme lu (démarre le plan automatiquement si besoin). */
export function toggleDayRead(planSlug: string, dayNumber: number): ActivePlan[] {
  const current = getActivePlans();
  const existing = current.find((p) => p.planSlug === planSlug);

  const plan: ActivePlan = existing ?? { planSlug, startedAt: new Date().toISOString(), daysRead: [] };
  const daysRead = plan.daysRead.includes(dayNumber)
    ? plan.daysRead.filter((d) => d !== dayNumber)
    : [...plan.daysRead, dayNumber].sort((a, b) => a - b);
  const updatedPlan = { ...plan, daysRead };

  const next = existing
    ? current.map((p) => (p.planSlug === planSlug ? updatedPlan : p))
    : [...current, updatedPlan];
  writeJson(ACTIVE_PLANS_KEY, next);
  return next;
}

/** Premier numéro de jour non coché (1..totalDays), ou `null` si tout est lu. */
export function getNextDay(daysRead: number[], totalDays: number): number | null {
  for (let day = 1; day <= totalDays; day++) {
    if (!daysRead.includes(day)) return day;
  }
  return null;
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
const EMPTY_FAVORITE_VERSES: FavoriteVerseRef[] = [];
const EMPTY_ACTIVE_PLANS: ActivePlan[] = [];
const getFavoritesSnapshot = createSnapshotCache<ContentRef[]>(FAVORITES_KEY, EMPTY_FAVORITES);
const getHistorySnapshot = createSnapshotCache<HistoryEntry[]>(HISTORY_KEY, EMPTY_HISTORY);
const getFavoriteVersesSnapshot = createSnapshotCache<FavoriteVerseRef[]>(
  FAVORITE_VERSES_KEY,
  EMPTY_FAVORITE_VERSES,
);
const getActivePlansSnapshot = createSnapshotCache<ActivePlan[]>(ACTIVE_PLANS_KEY, EMPTY_ACTIVE_PLANS);

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

export function useFavoriteVerses(): FavoriteVerseRef[] {
  return useSyncExternalStore(subscribe, getFavoriteVersesSnapshot, () => EMPTY_FAVORITE_VERSES);
}

export function useIsVerseFavorite(bookSlug: string, chapter: number, verse: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getFavoriteVersesSnapshot().some((v) => sameVerse(v, { bookSlug, chapter, verse })),
    () => false,
  );
}

export function useActivePlans(): ActivePlan[] {
  return useSyncExternalStore(subscribe, getActivePlansSnapshot, () => EMPTY_ACTIVE_PLANS);
}

export function useActivePlan(planSlug: string): ActivePlan | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getActivePlansSnapshot().find((p) => p.planSlug === planSlug),
    () => undefined,
  );
}
