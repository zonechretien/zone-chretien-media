import crypto from "node:crypto";
import type { SyncLanguage } from "../../remotion/lib/sync/numbers";
import type { ModelId, SyncResult } from "./whisper";

/**
 * File des synchronisations (une à la fois : Whisper occupe tout le
 * processeur). Même principe que la file des rendus (jobs.ts).
 */

export type SyncStatus = "en-attente" | "analyse" | "termine" | "echec" | "annule";

export type SyncJob = {
  id: string;
  chemin: string;
  langue: SyncLanguage;
  statut: SyncStatus;
  progression: number;
  message: string | null;
  resultat: SyncResult | null;
  creeLe: string;
};

export type SyncRunner = (o: {
  chemin: string;
  script: string[];
  language: SyncLanguage;
  model: ModelId;
  onProgress: (p: number) => void;
  signal: AbortSignal;
}) => Promise<SyncResult>;

type Internal = { job: SyncJob; script: string[]; controller: AbortController };

const KEEP = 20;

export class SyncQueue {
  private items: Internal[] = [];
  private running = false;

  constructor(
    private readonly run: SyncRunner,
    private readonly model: () => ModelId | null,
  ) {}

  add(chemin: string, script: string[], langue: SyncLanguage): SyncJob {
    const job: SyncJob = { id: crypto.randomUUID(), chemin, langue, statut: "en-attente", progression: 0, message: null, resultat: null, creeLe: new Date().toISOString() };
    this.items.push({ job, script, controller: new AbortController() });
    // Historique court : les anciens résultats terminés sont oubliés.
    const done = this.items.filter((i) => !["en-attente", "analyse"].includes(i.job.statut));
    if (done.length > KEEP) this.items = this.items.filter((i) => !done.slice(0, done.length - KEEP).includes(i));
    void this.next();
    return { ...job };
  }

  get(id: string): SyncJob | null {
    const it = this.items.find((i) => i.job.id === id);
    return it ? { ...it.job } : null;
  }

  cancel(id: string): SyncJob | null {
    const it = this.items.find((i) => i.job.id === id);
    if (!it) return null;
    if (it.job.statut === "en-attente") it.job.statut = "annule";
    if (it.job.statut === "analyse") it.controller.abort();
    return { ...it.job };
  }

  private async next(): Promise<void> {
    if (this.running) return;
    const it = this.items.find((i) => i.job.statut === "en-attente");
    if (!it) return;
    this.running = true;
    const { job } = it;
    job.statut = "analyse";
    try {
      const model = this.model();
      if (!model) throw new Error("Synchronisation automatique non installée : lancez INSTALLER-WHISPER.bat.");
      job.resultat = await this.run({
        chemin: job.chemin,
        script: it.script,
        language: job.langue,
        model,
        onProgress: (p) => (job.progression = Math.min(0.99, p)),
        signal: it.controller.signal,
      });
      job.statut = "termine";
      job.progression = 1;
    } catch (e) {
      job.statut = it.controller.signal.aborted ? "annule" : "echec";
      job.message = e instanceof Error ? e.message : "Synchronisation impossible.";
    } finally {
      this.running = false;
      void this.next();
    }
  }
}
