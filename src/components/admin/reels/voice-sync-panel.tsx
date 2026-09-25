"use client";

import { AlertTriangle, CheckCircle2, Hand, Loader2, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { NarrationScript } from "@reels/lib/sync/script";
import { SYNC_CONFIDENCE_OK, syncQuality, weakSentences } from "@reels/lib/sync/quality";
import type { ReelLanguage, TextStyle, VoiceOverProps, VoiceSyncProps } from "@reels/schemas";
import { selectClass } from "@/components/admin/form-fields";
import { studio, type SyncJob } from "@/lib/reels/studio-client";
import { ManualSync } from "./manual-sync";

export const LANGUAGE_LABELS: Record<ReelLanguage, string> = { fr: "Français", ht: "Créole haïtien" };

const pct = (x: number) => `${Math.round(x * 100)} %`;

/** État de la synchronisation enregistrée par rapport au texte et à la voix actuels. */
export function syncState(voice: VoiceOverProps | null, script: NarrationScript): "aucune" | "valide" | "perimee" {
  const s = voice?.sync;
  if (!voice || !s) return "aucune";
  return s.audioPath === voice.path && s.scriptHash === script.hash && s.words.length === script.words.length ? "valide" : "perimee";
}

/**
 * Synchronisation du texte sur la voix off : automatique (Whisper, studio
 * local) ou calée à la main. Un résultat automatique peu fiable n'est jamais
 * appliqué sans l'accord de l'utilisateur.
 */
export function VoiceSyncPanel({
  voice,
  script,
  language,
  studioOnline,
  whisper,
  onChange,
  onLanguage,
}: {
  voice: VoiceOverProps;
  script: NarrationScript;
  language: ReelLanguage;
  studioOnline: boolean;
  whisper: { etat: "pret"; modele: string } | { etat: "absent"; message: string } | undefined;
  onChange: (patch: Partial<Pick<VoiceOverProps, "sync" | "textStyle">>) => void;
  onLanguage: (language: ReelLanguage) => void;
}) {
  const [job, setJob] = useState<SyncJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Résultat automatique peu fiable, en attente d'une décision. */
  const [pending, setPending] = useState<VoiceSyncProps | null>(null);
  const [manual, setManual] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => void (poll.current && clearInterval(poll.current)), []);

  const state = syncState(voice, script);
  const sync = state === "valide" ? voice.sync! : null;
  const running = job?.statut === "en-attente" || job?.statut === "analyse";
  const words = script.words.map((w) => w.text);

  function finish(j: SyncJob) {
    if (!j.resultat) return;
    const r = j.resultat;
    const weak = weakSentences(r.words.map((w) => w.match), script.sentences);
    const result: VoiceSyncProps = {
      source: "auto",
      audioPath: voice.path,
      scriptHash: script.hash,
      trimStartSeconds: r.trimStartSeconds,
      words: r.words.map((w) => [w.start, w.end]),
      confidence: r.confidence,
      model: r.model,
      weakSentences: weak,
    };
    if (r.confidence >= SYNC_CONFIDENCE_OK) {
      onChange({ sync: result });
      setPending(null);
    } else {
      setPending(result);
    }
  }

  async function start() {
    setError(null);
    setPending(null);
    try {
      const j = await studio.startSync(voice.path, words, language);
      setJob(j);
      poll.current = setInterval(async () => {
        try {
          const cur = await studio.sync(j.id);
          setJob(cur);
          if (!["en-attente", "analyse"].includes(cur.statut)) {
            if (poll.current) clearInterval(poll.current);
            if (cur.statut === "termine") finish(cur);
            else if (cur.statut === "echec") setError(cur.message ?? "Synchronisation impossible.");
          }
        } catch (e) {
          if (poll.current) clearInterval(poll.current);
          setError(e instanceof Error ? e.message : "Studio injoignable.");
          setJob(null);
        }
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Synchronisation impossible.");
    }
  }

  const button = "flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-gold hover:text-gold disabled:opacity-50";
  const quality = sync ? (sync.source === "manuel" ? "bonne" : syncQuality(sync.confidence, sync.weakSentences.length)) : null;
  const canAuto = studioOnline && whisper?.etat === "pret" && !!voice.mediaDurationSeconds;

  return (
    <div className="mt-2 rounded-xl border border-border bg-foreground/[0.02] p-4" aria-live="polite">
      <p className="mb-3 text-sm font-medium text-foreground">Synchronisation du texte sur la voix</p>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-foreground/70">
          Langue de la voix
          <select className={`${selectClass} mt-1`} value={language} onChange={(e) => onLanguage(e.target.value as ReelLanguage)} disabled={running}>
            {(Object.keys(LANGUAGE_LABELS) as ReelLanguage[]).map((l) => (
              <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
            ))}
          </select>
        </label>
        <fieldset className="min-w-0 text-xs text-foreground/70">
          <legend>Affichage du texte</legend>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup">
            {(
              [
                ["phrase", "Phrase par phrase"],
                ["mot", "Mot par mot"],
              ] as [TextStyle, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={voice.textStyle === value}
                onClick={() => onChange({ textStyle: value })}
                className={
                  voice.textStyle === value
                    ? "rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-gold hover:text-gold"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* État */}
      {state === "aucune" && !pending && (
        <p className="mb-3 text-xs text-muted">Non synchronisé : le texte suit un minutage estimé, sans lien avec la voix.</p>
      )}
      {state === "perimee" && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Synchronisation périmée : le texte ou la voix off ont changé depuis. Le Reel utilise le minutage estimé — relancez la synchronisation.
        </p>
      )}
      {sync && quality && (
        <p
          className={
            quality === "bonne"
              ? "mb-3 flex items-start gap-1.5 text-xs text-emerald-600"
              : "mb-3 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
          }
        >
          {quality === "bonne" ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
          <span>
            {sync.source === "manuel" ? "Calé à la main." : `Synchronisé automatiquement (modèle ${sync.model}) — confiance ${pct(sync.confidence)}.`}
            {sync.trimStartSeconds > 0 ? ` Silence du début retiré : ${sync.trimStartSeconds.toFixed(1).replace(".", ",")} s.` : ""}
            {quality !== "bonne" && sync.weakSentences.length > 0 && (
              <>
                {" "}À vérifier dans l&apos;aperçu : {sync.weakSentences.length} phrase{sync.weakSentences.length > 1 ? "s" : ""} mal reconnue{sync.weakSentences.length > 1 ? "s" : ""} (
                {sync.weakSentences.map((k) => `n° ${k + 1}`).join(", ")}). Corrigez-les avec le calage manuel.
              </>
            )}
          </span>
        </p>
      )}

      {pending && (
        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400" role="alert">
          <p className="flex items-start gap-1.5 font-semibold">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Synchronisation automatique peu fiable : seulement {pct(pending.confidence)} du texte a été retrouvé dans la voix.
          </p>
          <p className="mt-1">
            La vidéo risque d&apos;être décalée. Causes fréquentes : texte lu différent du texte affiché, bruit, voix trop basse
            {language === "ht" ? ", reconnaissance du créole encore faible" : ""}. Le résultat n&apos;a pas été appliqué.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => { setManual(true); }}>
              <Hand size={14} /> Caler à la main (conseillé)
            </button>
            <button type="button" className={button} onClick={() => { onChange({ sync: pending }); setPending(null); setManual(true); }}>
              Appliquer quand même, puis corriger
            </button>
            <button type="button" className={button} onClick={() => setPending(null)}>
              <X size={14} /> Ignorer
            </button>
          </div>
        </div>
      )}

      {running && job && (
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-foreground/70">
            <Loader2 size={14} className="animate-spin" />
            {job.statut === "en-attente" ? "En attente…" : `Analyse de la voix… ${pct(job.progression)}`}
            <button type="button" className="ml-auto text-xs underline" onClick={() => void studio.cancelSync(job.id).catch(() => undefined)}>
              Annuler
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-gold transition-all" style={{ width: `${Math.round(job.progression * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} onClick={start} disabled={!canAuto || running}>
          <Wand2 size={14} /> Synchroniser automatiquement
        </button>
        <button type="button" className={button} onClick={() => setManual((v) => !v)} disabled={!studioOnline || running}>
          <Hand size={14} /> {manual ? "Fermer le calage manuel" : "Caler à la main"}
        </button>
        {voice.sync && (
          <button type="button" className={button} onClick={() => onChange({ sync: null })} disabled={running}>
            <X size={14} /> Retirer la synchronisation
          </button>
        )}
      </div>
      {!studioOnline && <p className="mt-2 text-xs text-muted">Lancez le studio local pour synchroniser.</p>}
      {studioOnline && whisper?.etat === "absent" && <p className="mt-2 text-xs text-muted">{whisper.message} Le calage manuel reste disponible.</p>}
      {studioOnline && whisper === undefined && <p className="mt-2 text-xs text-muted">Studio trop ancien pour la synchronisation automatique : mettez-le à jour.</p>}
      {studioOnline && !voice.mediaDurationSeconds && <p className="mt-2 text-xs text-muted">Durée de la voix inconnue : rechoisissez le fichier.</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {manual && studioOnline && (
        <ManualSync
          voice={voice}
          script={script}
          base={sync?.source === "auto" ? sync : state === "valide" ? sync : null}
          weak={sync?.weakSentences ?? pending?.weakSentences ?? []}
          onApply={(s) => {
            onChange({ sync: s });
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
