import { makeCancelSignal } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileTimestamp, slugifyFileName } from "./http-utils";
import { explainRenderError, renderReel, UserFacingError } from "./render";
import { resolveLibraryFile, toRelative, MediaNotFoundError, UnsafePathError } from "./safe-path";

/** Espace libre minimal exigé avant un rendu (un Reel fait rarement plus de 100 Mo). */
export const MIN_FREE_BYTES = 500 * 1024 * 1024;

export type JobStatus = "en-attente" | "preparation" | "rendu" | "termine" | "echec" | "annule";

export type Job = {
  id: string;
  templateId: string;
  titre: string;
  statut: JobStatus;
  progression: number;
  message: string | null;
  /** Chemin relatif du MP4 (dans Exports/) une fois terminé. */
  chemin: string | null;
  creeLe: string;
  termineLe: string | null;
};

/** Tous les chemins de médias référencés dans les props (clés « path »). */
export function collectMediaPaths(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => collectMediaPaths(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "path" && typeof v === "string") out.push(v);
      else collectMediaPaths(v, out);
    }
  }
  return out;
}

type Internal = { job: Job; props: Record<string, unknown>; cancel: (() => void) | null };

/**
 * File des rendus : un seul rendu à la fois (le rendu occupe déjà tous les
 * cœurs du PC), les suivants attendent leur tour.
 */
export class RenderQueue {
  private jobs = new Map<string, Internal>();
  private running = false;

  constructor(
    private readonly getRoot: () => string | null,
    private readonly mediaBaseUrl: string,
    private readonly freeBytes: (dir: string) => number = defaultFreeBytes,
  ) {}

  list(): Job[] {
    return [...this.jobs.values()].map((i) => i.job).sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  }

  get(id: string): Job | null {
    return this.jobs.get(id)?.job ?? null;
  }

  add(templateId: string, titre: string, props: Record<string, unknown>): Job {
    const job: Job = {
      id: crypto.randomUUID(),
      templateId,
      titre,
      statut: "en-attente",
      progression: 0,
      message: null,
      chemin: null,
      creeLe: new Date().toISOString(),
      termineLe: null,
    };
    this.jobs.set(job.id, { job, props, cancel: null });
    void this.next();
    return job;
  }

  cancel(id: string): Job | null {
    const item = this.jobs.get(id);
    if (!item) return null;
    if (item.job.statut === "en-attente") this.finish(item.job, "annule", "Rendu annulé.");
    else if (item.job.statut === "preparation" || item.job.statut === "rendu") item.cancel?.();
    return item.job;
  }

  private finish(job: Job, statut: JobStatus, message: string | null) {
    if (job.termineLe !== null) return;
    job.statut = statut;
    job.message = message;
    job.termineLe = new Date().toISOString();
  }

  private async next(): Promise<void> {
    if (this.running) return;
    const item = [...this.jobs.values()].find((i) => i.job.statut === "en-attente");
    if (!item) return;
    this.running = true;
    try {
      await this.run(item);
    } finally {
      this.running = false;
      void this.next();
    }
  }

  private async run(item: Internal): Promise<void> {
    const { job } = item;
    job.statut = "preparation";
    try {
      const root = this.getRoot();
      if (!root) throw new UserFacingError("Disque Zone-Chrétien non détecté. Branche le disque puis clique sur Réessayer.");

      for (const rel of collectMediaPaths(item.props)) {
        try {
          resolveLibraryFile(root, rel);
        } catch (e) {
          if (e instanceof MediaNotFoundError || e instanceof UnsafePathError) throw new UserFacingError(e.message);
          throw e;
        }
      }

      const exportsDir = path.join(root, "Exports");
      fs.mkdirSync(exportsDir, { recursive: true });
      if (this.freeBytes(exportsDir) < MIN_FREE_BYTES) {
        throw new UserFacingError("Espace disque insuffisant : libère au moins 500 Mo sur le disque Zone-Chrétien.");
      }

      const base = `${fileTimestamp(new Date())}_${slugifyFileName(job.titre, job.templateId.toLowerCase())}`;
      let output = path.join(exportsDir, `${base}.mp4`);
      for (let n = 2; fs.existsSync(output); n++) output = path.join(exportsDir, `${base}-${n}.mp4`);

      const { cancelSignal, cancel } = makeCancelSignal();
      item.cancel = cancel;
      await renderReel({
        templateId: job.templateId,
        props: item.props,
        outputPath: output,
        mediaBaseUrl: this.mediaBaseUrl,
        cancelSignal,
        onProgress: ({ stage, percent }) => {
          // Une progression tardive (après annulation) ne doit pas « ressusciter » le rendu.
          if (job.termineLe !== null) return;
          job.statut = stage;
          job.progression = stage === "rendu" ? percent : 0;
        },
      });
      job.chemin = toRelative(root, output);
      job.progression = 100;
      this.finish(job, "termine", null);
    } catch (err) {
      const message = explainRenderError(err);
      this.finish(job, message === "Rendu annulé." ? "annule" : "echec", message);
    } finally {
      item.cancel = null;
    }
  }
}

function defaultFreeBytes(dir: string): number {
  const s = fs.statfsSync(dir);
  return s.bavail * s.bsize;
}
