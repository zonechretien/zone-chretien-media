"use client";

import { Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { retimeFromSentences, sentenceStarts } from "@reels/lib/sync/manual";
import type { NarrationScript } from "@reels/lib/sync/script";
import type { VoiceOverProps, VoiceSyncProps } from "@reels/schemas";
import { mediaUrl } from "@/lib/reels/studio-client";

/** Temps de réaction moyen entre le début entendu d'une phrase et l'appui sur la touche. */
const REACTION_SECONDS = 0.15;
const NUDGE = 0.1;

const fmt = (t: number | null) => (t === null ? "—" : `${t.toFixed(2)} s`);

/**
 * Calage manuel : écouter la voix off et appuyer sur Espace (ou Entrée) au
 * début de chaque phrase. Chaque début reste ensuite réglable (± 0,1 s),
 * réécoutable, et l'on peut reprendre le calage à partir de n'importe quelle
 * phrase. Corrige aussi un résultat automatique (son rythme mot à mot est conservé).
 */
export function ManualSync({
  voice,
  script,
  base,
  weak,
  onApply,
}: {
  voice: VoiceOverProps;
  script: NarrationScript;
  base: VoiceSyncProps | null;
  weak: number[];
  onApply: (sync: VoiceSyncProps) => void;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [starts, setStarts] = useState<(number | null)[]>(() =>
    base ? sentenceStarts(base.words, script.sentences) : script.sentences.map(() => null),
  );
  /** Phrase dont on attend le début (mode écoute), ou null. */
  const [cursor, setCursor] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const stopAt = useRef<number | null>(null);

  // Nouvelle voix ou nouveau texte : on repart de zéro.
  useEffect(() => {
    setStarts(base ? sentenceStarts(base.words, script.sentences) : script.sentences.map(() => null));
    setCursor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.path, script.hash]);

  const mark = useCallback(() => {
    const a = audio.current;
    if (!a || cursor === null) return;
    const t = Math.max(0, Math.round((a.currentTime - REACTION_SECONDS) * 100) / 100);
    setStarts((prev) => prev.map((v, k) => (k === cursor ? t : v)));
    setCursor(cursor + 1 < script.sentences.length ? cursor + 1 : null);
    if (cursor + 1 >= script.sentences.length) a.pause();
  }, [cursor, script.sentences.length]);

  useEffect(() => {
    if (cursor === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) mark();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [cursor, mark]);

  function listenFrom(k: number) {
    const a = audio.current;
    if (!a) return;
    const prev = k > 0 ? starts[k - 1] : null;
    stopAt.current = null;
    a.currentTime = Math.max(0, prev ?? 0);
    setCursor(k);
    void a.play();
  }

  function playSentence(k: number) {
    const a = audio.current;
    const s = starts[k];
    if (!a || s === null) return;
    setCursor(null);
    const next = starts.slice(k + 1).find((x) => x !== null) ?? null;
    stopAt.current = next;
    a.currentTime = Math.max(0, s - 0.2);
    void a.play();
  }

  const nudge = (k: number, d: number) =>
    setStarts((prev) => prev.map((v, i) => (i === k && v !== null ? Math.max(0, Math.round((v + d) * 100) / 100) : v)));

  const complete = starts.every((s): s is number => s !== null);
  const ordered = complete && starts.every((s, k) => k === 0 || (s as number) > (starts[k - 1] as number));

  function apply() {
    if (!complete || !ordered) return;
    const s = starts as number[];
    const speechEnd = voice.mediaDurationSeconds ?? s[s.length - 1] + 3;
    const words = retimeFromSentences({
      scriptWords: script.words.map((w) => w.text),
      sentences: script.sentences,
      starts: s,
      speechEnd,
      base: base ? base.words : null,
    });
    onApply({
      source: "manuel",
      audioPath: voice.path,
      scriptHash: script.hash,
      // Silence du début retiré : la vidéo commence 0,3 s avant la première phrase.
      trimStartSeconds: Math.max(0, Math.round((s[0] - 0.3) * 100) / 100),
      words,
      confidence: 1,
      model: null,
      weakSentences: [],
    });
  }

  const small = "rounded-md border border-border p-1 text-foreground/70 hover:border-gold hover:text-gold disabled:opacity-40";

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs text-foreground/70">
        Cliquez sur <strong>Écouter et caler</strong>, puis appuyez sur <kbd className="rounded border border-border px-1">Espace</kbd> au tout début de chaque
        phrase (surlignée en or). Réglez ensuite chaque début si besoin, puis appliquez.
        {!base && " Sans synchronisation automatique, le mot par mot est estimé à l'intérieur de chaque phrase."}
      </p>
      <audio
        ref={audio}
        src={mediaUrl(voice.path)}
        preload="auto"
        controls
        className="mb-3 h-9 w-full"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCursor(null);
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setNow(t);
          if (stopAt.current !== null && t >= stopAt.current) {
            e.currentTarget.pause();
            stopAt.current = null;
          }
        }}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light"
          onClick={() => (cursor !== null && playing ? audio.current?.pause() : listenFrom(cursor ?? 0))}
        >
          {cursor !== null && playing ? <Pause size={14} /> : <Play size={14} />}
          {cursor !== null && playing ? "Pause" : cursor !== null && cursor > 0 ? `Reprendre à la phrase ${cursor + 1}` : "Écouter et caler"}
        </button>
        {cursor !== null && playing && (
          <button type="button" className="rounded-full border-2 border-gold px-4 py-2 text-xs font-semibold text-gold" onClick={mark}>
            Début de la phrase {cursor + 1} (Espace)
          </button>
        )}
        <span className="text-xs tabular-nums text-muted">{now.toFixed(1)} s</span>
      </div>

      <ol className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {script.sentences.map((s, k) => {
          const bad = k > 0 && starts[k] !== null && starts[k - 1] !== null && (starts[k] as number) <= (starts[k - 1] as number);
          return (
            <li
              key={k}
              className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${cursor === k ? "bg-gold/15 ring-1 ring-gold" : ""} ${weak.includes(k) ? "border-l-2 border-amber-500" : ""}`}
            >
              <span className="w-6 shrink-0 text-right text-muted">{k + 1}</span>
              <span className="min-w-0 flex-1 truncate text-foreground/80" title={s.text}>{s.text}</span>
              <span className={`w-16 shrink-0 text-right tabular-nums ${bad ? "text-red-500" : "text-foreground/70"}`}>{fmt(starts[k])}</span>
              <button type="button" className={small} onClick={() => nudge(k, -NUDGE)} disabled={starts[k] === null} aria-label={`Phrase ${k + 1} : 0,1 s plus tôt`}>
                <Minus size={12} />
              </button>
              <button type="button" className={small} onClick={() => nudge(k, NUDGE)} disabled={starts[k] === null} aria-label={`Phrase ${k + 1} : 0,1 s plus tard`}>
                <Plus size={12} />
              </button>
              <button type="button" className={small} onClick={() => playSentence(k)} disabled={starts[k] === null} aria-label={`Écouter la phrase ${k + 1}`}>
                <Play size={12} />
              </button>
              <button type="button" className={small} onClick={() => listenFrom(k)} aria-label={`Reprendre le calage à la phrase ${k + 1}`} title="Reprendre le calage ici">
                <RotateCcw size={12} />
              </button>
            </li>
          );
        })}
      </ol>

      {complete && !ordered && <p className="mt-2 text-xs text-red-500">Chaque phrase doit commencer après la précédente (heures en rouge).</p>}
      <button
        type="button"
        className="mt-3 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-navy disabled:opacity-50"
        disabled={!complete || !ordered}
        onClick={apply}
      >
        Appliquer le calage
      </button>
      {!complete && <span className="ml-2 text-xs text-muted">{starts.filter((s) => s === null).length} phrase(s) sans début.</span>}
    </div>
  );
}
