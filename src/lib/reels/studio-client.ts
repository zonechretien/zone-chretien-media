"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Client du studio local (zone-chretien-studio), appelé DEPUIS LE NAVIGATEUR :
 * Vercel ne contacte jamais le studio et ne voit passer aucune vidéo.
 * Voir zone-chretien-studio/README.md §6 pour l'interface du studio.
 */
export const STUDIO_URL = (process.env.NEXT_PUBLIC_ZC_STUDIO_URL ?? "http://127.0.0.1:4317").replace(/\/$/, "");
export const STUDIO_MEDIA_URL = `${STUDIO_URL}/media/`;

export const STUDIO_NOT_RUNNING =
  "Studio local non lancé. Double-cliquez sur LANCER-STUDIO.bat (dossier zone-chretien-studio du disque), puis réessayez. Si le navigateur demande l'accès aux appareils de cet ordinateur ou du réseau local, cliquez sur Autoriser.";

export type StudioStatus = {
  application: string;
  version: string;
  developpePar: string;
  /** `dossier` : chemin du dossier de la bibliothèque (ex. D:\Zone-Chretien-Studio) ; absent avec un studio plus ancien. */
  disque: { detecte: true; lettre: string; dossier?: string; nom: string } | { detecte: false; message: string };
  navigateurRendu: { etat: "verification" | "pret" | "absent"; message: string | null };
  rendusEnCours: number;
  /** Synchronisation automatique (Whisper) ; absent avec un studio plus ancien. */
  synchronisation?: { etat: "pret"; modele: string } | { etat: "absent"; message: string };
};

export type SyncWord = { start: number; end: number; match: number };

export type SyncJob = {
  id: string;
  statut: "en-attente" | "analyse" | "termine" | "echec" | "annule";
  progression: number;
  message: string | null;
  resultat: { words: SyncWord[]; confidence: number; trimStartSeconds: number; model: string; recognizedText: string; seconds: number } | null;
};

export type LibraryItem = {
  chemin: string;
  nom: string;
  dossier: string;
  type: "image" | "video" | "audio" | "font";
  taille: number;
  modifieLe: string;
  miniature: boolean;
};

export type RenderJob = {
  id: string;
  templateId: string;
  titre: string;
  statut: "en-attente" | "preparation" | "rendu" | "termine" | "echec" | "annule";
  progression: number;
  message: string | null;
  chemin: string | null;
};

export class StudioError extends Error {}

async function call<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 8000, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${STUDIO_URL}${path}`, {
      ...rest,
      // L'en-tête X-ZC-Studio oblige le navigateur à demander l'autorisation au
      // studio (pré-vol CORS) : exigé par le studio pour toute écriture.
      headers: rest.method === "POST" ? { "X-ZC-Studio": "1", ...rest.headers } : rest.headers,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    throw new StudioError(STUDIO_NOT_RUNNING);
  }
  const body = (await res.json().catch(() => null)) as (T & { erreur?: string }) | null;
  if (!res.ok) throw new StudioError(body?.erreur ?? `Le studio a répondu une erreur (${res.status}).`);
  return body as T;
}

export const studio = {
  status: () => call<StudioStatus>("/api/etat", { timeoutMs: 2500 }),
  retryDrive: () => call<StudioStatus>("/api/disque/detecter", { method: "POST" }),
  library: () => call<{ dossiers: Record<string, LibraryItem[]> }>("/api/bibliotheque"),
  mediaInfo: (chemin: string) =>
    call<{ chemin: string; type: string; dureeSecondes: number | null }>(`/api/media-info?chemin=${encodeURIComponent(chemin)}`),
  startRender: (templateId: string, titre: string, props: unknown) =>
    call<RenderJob>("/api/rendus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, titre, props }),
    }),
  render: (id: string) => call<RenderJob>(`/api/rendus/${id}`),
  cancelRender: (id: string) => call<RenderJob>(`/api/rendus/${id}/annuler`, { method: "POST" }),
  /** Lance la synchronisation du texte exact (mots affichés) sur une voix off du disque. */
  startSync: (chemin: string, mots: string[], langue: "fr" | "ht") =>
    call<SyncJob>("/api/synchronisations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chemin, mots, langue }),
    }),
  sync: (id: string) => call<SyncJob>(`/api/synchronisations/${id}`),
  cancelSync: (id: string) => call<SyncJob>(`/api/synchronisations/${id}/annuler`, { method: "POST" }),
  /** Dépose une voix off enregistrée au micro dans le dossier VoixOff/ du disque. */
  uploadVoiceOver: (audio: Blob) =>
    call<{ chemin: string; dureeSecondes: number | null }>("/api/voix-off", {
      method: "POST",
      headers: { "Content-Type": audio.type || "audio/webm" },
      body: audio,
      timeoutMs: 60_000,
    }),
};

export function thumbnailUrl(chemin: string): string {
  return `${STUDIO_URL}/api/miniature?chemin=${encodeURIComponent(chemin)}`;
}

export function mediaUrl(chemin: string): string {
  return STUDIO_MEDIA_URL + chemin.split("/").map(encodeURIComponent).join("/");
}

export type StudioConnection =
  | { state: "checking" }
  | { state: "offline"; message: string }
  | { state: "online"; status: StudioStatus };

/** État du studio, revérifié toutes les 5 s et au retour sur l'onglet. */
export function useStudioConnection() {
  const [connection, setConnection] = useState<StudioConnection>({ state: "checking" });
  const mounted = useRef(true);

  const refresh = useCallback(async (retryDrive = false) => {
    try {
      const status = retryDrive ? await studio.retryDrive() : await studio.status();
      if (mounted.current) setConnection({ state: "online", status });
    } catch (e) {
      if (mounted.current) setConnection({ state: "offline", message: e instanceof Error ? e.message : STUDIO_NOT_RUNNING });
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return { connection, refresh };
}
