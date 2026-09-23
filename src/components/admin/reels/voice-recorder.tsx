"use client";

import { Loader2, Mic, RotateCcw, Square, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { studio } from "@/lib/reels/studio-client";

/** Durée maximale d'un enregistrement (un Reel dure au plus 90 s). */
const MAX_SECONDS = 90;

type State =
  | { kind: "idle" }
  | { kind: "recording"; seconds: number }
  | { kind: "recorded"; blob: Blob; url: string; seconds: number }
  | { kind: "uploading"; blob: Blob; url: string; seconds: number };

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
}

function micError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Accès au micro refusé. Autorisez le micro pour ce site (icône à gauche de l'adresse), puis réessayez.";
  }
  if (name === "NotFoundError") return "Aucun micro détecté sur cet ordinateur.";
  if (name === "NotReadableError") return "Le micro est déjà utilisé par une autre application.";
  return "Impossible d'utiliser le micro.";
}

/**
 * Enregistrement d'une voix off au micro (MediaRecorder), écoute avant envoi,
 * puis dépôt dans le dossier VoixOff/ du disque via le studio local.
 */
export function VoiceRecorder({ studioOnline, onSaved }: { studioOnline: boolean; onSaved: (chemin: string, durationSeconds: number | null) => void }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanupUrl = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      cleanupUrl();
    },
    [],
  );

  const supported = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  async function start() {
    setError(null);
    cleanupUrl();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      setError(micError(e));
      return;
    }
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const started = Date.now();
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      if (timer.current) clearInterval(timer.current);
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setState({ kind: "recorded", blob, url, seconds: Math.round((Date.now() - started) / 100) / 10 });
    };
    recorder.current = rec;
    rec.start();
    setState({ kind: "recording", seconds: 0 });
    timer.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      setState({ kind: "recording", seconds });
      if (seconds >= MAX_SECONDS) rec.stop();
    }, 250);
  }

  async function upload() {
    if (state.kind !== "recorded") return;
    setError(null);
    setState({ ...state, kind: "uploading" });
    try {
      const { chemin, dureeSecondes } = await studio.uploadVoiceOver(state.blob);
      onSaved(chemin, dureeSecondes ?? state.seconds);
      cleanupUrl();
      setState({ kind: "idle" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
      setState({ ...state, kind: "recorded" });
    }
  }

  if (!supported) return <p className="mt-2 text-xs text-muted">Enregistrement au micro indisponible dans ce navigateur.</p>;

  const button = "flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-gold hover:text-gold disabled:opacity-50";

  return (
    <div className="mt-3 rounded-xl border border-dashed border-border p-3">
      <p className="mb-2 text-xs font-medium text-foreground/70">Ou enregistrer au micro</p>
      <div className="flex flex-wrap items-center gap-2">
        {state.kind === "idle" && (
          <button type="button" className={button} onClick={start} disabled={!studioOnline}>
            <Mic size={14} /> Enregistrer
          </button>
        )}
        {state.kind === "recording" && (
          <>
            <span className="flex items-center gap-2 text-sm text-red-500" aria-live="polite">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" /> Enregistrement… {state.seconds} s / {MAX_SECONDS} s
            </span>
            <button type="button" className={button} onClick={() => recorder.current?.stop()}>
              <Square size={14} /> Arrêter
            </button>
          </>
        )}
        {(state.kind === "recorded" || state.kind === "uploading") && (
          <>
            <audio src={state.url} controls className="h-9 max-w-full" />
            <button type="button" className={button} onClick={start} disabled={state.kind === "uploading"}>
              <RotateCcw size={14} /> Recommencer
            </button>
            <button type="button" className={button} onClick={upload} disabled={state.kind === "uploading" || !studioOnline}>
              {state.kind === "uploading" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Utiliser cet enregistrement
            </button>
          </>
        )}
      </div>
      {!studioOnline && <p className="mt-1 text-xs text-muted">Lancez le studio local : l&apos;enregistrement est rangé dans le dossier VoixOff du disque.</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
