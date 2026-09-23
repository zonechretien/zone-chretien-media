"use client";

import { Clapperboard, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { recordReelExport } from "@/lib/actions/reels";
import { studio, type RenderJob, type StudioConnection } from "@/lib/reels/studio-client";

const STAGE_LABELS: Record<RenderJob["statut"], string> = {
  "en-attente": "En attente d'un autre export…",
  preparation: "Préparation des templates…",
  rendu: "Rendu en cours",
  termine: "Terminé",
  echec: "Échec",
  annule: "Annulé",
};

/**
 * Export MP4 : le navigateur demande le rendu au studio local, suit sa
 * progression, puis enregistre dans Turso le chemin RELATIF de la vidéo.
 */
export function ExportPanel({
  reelId,
  templateId,
  title,
  connection,
  blockedReason,
  prepare,
  lastExport,
  onExported,
}: {
  reelId: string;
  templateId: string;
  title: string;
  connection: StudioConnection;
  /** Raison d'empêcher l'export côté éditeur (données invalides…), sinon null. */
  blockedReason: string | null;
  /** Enregistre le projet et renvoie les props validées à exporter (null = échec). */
  prepare: () => Promise<Record<string, unknown> | null>;
  lastExport: { path: string; at: string } | null;
  /** Appelé après un export réussi et enregistré (le statut passe à « Exporté »). */
  onExported: () => void;
}) {
  const [job, setJob] = useState<RenderJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [done, setDone] = useState(lastExport);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const running = job !== null && ["en-attente", "preparation", "rendu"].includes(job.statut);
  const drive = connection.state === "online" && connection.status.disque.detecte ? connection.status.disque : null;

  let studioBlock: string | null = null;
  if (connection.state !== "online") studioBlock = "Studio local non connecté.";
  else if (!connection.status.disque.detecte) studioBlock = connection.status.disque.message;
  else if (connection.status.navigateurRendu.etat === "absent") studioBlock = connection.status.navigateurRendu.message;
  const disabledReason = blockedReason ?? studioBlock;

  function poll(id: string) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const current = await studio.render(id);
        setJob(current);
        if (current.statut === "termine" || current.statut === "echec" || current.statut === "annule") {
          if (timer.current) clearInterval(timer.current);
          if (current.statut === "termine" && current.chemin) {
            const result = await recordReelExport(reelId, current.chemin);
            if (result.error) setError(result.error);
            else onExported();
            setDone({ path: current.chemin, at: new Date().toISOString() });
          }
        }
      } catch (e) {
        if (timer.current) clearInterval(timer.current);
        setError(e instanceof Error ? e.message : "Suivi de l'export impossible.");
      }
    }, 1000);
  }

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const props = await prepare();
      if (!props) return;
      const created = await studio.startRender(templateId, title, props);
      setJob(created);
      poll(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export impossible.");
    } finally {
      setStarting(false);
    }
  }

  async function cancel() {
    if (!job) return;
    try {
      setJob(await studio.cancelRender(job.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Annulation impossible.");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={!!disabledReason || running || starting}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-50"
        >
          {starting ? <Loader2 size={16} className="animate-spin" /> : <Clapperboard size={16} />}
          Exporter en MP4
        </button>
        {running && (
          <button
            type="button"
            onClick={cancel}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-2.5 text-xs font-medium text-foreground/80 hover:border-red-500 hover:text-red-500"
          >
            <X size={14} /> Annuler
          </button>
        )}
      </div>
      {disabledReason && !running && <p className="mt-2 text-xs text-foreground/70">{disabledReason}</p>}

      {job && (
        <div className="mt-3" aria-live="polite">
          <div className="flex justify-between text-xs text-foreground/80">
            <span>{STAGE_LABELS[job.statut]}</span>
            {job.statut === "rendu" && <span>{job.progression} %</span>}
          </div>
          {running && (
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${job.statut === "rendu" ? Math.max(3, job.progression) : 3}%` }}
              />
            </div>
          )}
          {job.message && job.statut !== "termine" && <p className="mt-2 text-sm text-red-500">{job.message}</p>}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {done && (
        <p className="mt-3 text-xs text-foreground/80">
          Dernier export : <code className="break-all">{drive ? `${drive.lettre}\\${done.path.replaceAll("/", "\\")}` : done.path}</code>
          <br />
          <span className="text-muted">le {new Date(done.at).toLocaleString("fr-FR")} — sur le disque Zone-Chrétien</span>
        </p>
      )}
    </div>
  );
}
