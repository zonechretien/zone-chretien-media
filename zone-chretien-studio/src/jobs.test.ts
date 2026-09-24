import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Le vrai rendu (Chrome + ffmpeg) est remplacé par un faux, piloté par le test.
const renderMock = vi.hoisted(() => ({ impl: null as null | ((req: { onProgress?: (p: { stage: "rendu"; percent: number }) => void; outputPath: string }) => Promise<void>) }));
vi.mock("./render", async (importOriginal) => {
  const original = await importOriginal<typeof import("./render")>();
  return { ...original, renderReel: (req: never) => renderMock.impl!(req) };
});

const { RenderQueue } = await import("./jobs");

let root: string;
beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "zc-jobs-"));
  fs.mkdirSync(path.join(root, "Fonds"));
  fs.writeFileSync(path.join(root, "Fonds", "ciel.jpg"), "x");
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

const props = (bgPath = "Fonds/ciel.jpg") => ({ background: { type: "image", path: bgPath, dim: 0.4 } });

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 200 && !check(); i++) await new Promise((r) => setTimeout(r, 5));
}

describe("RenderQueue", () => {
  it("rend dans Exports/ avec un nom lisible et un chemin relatif", async () => {
    renderMock.impl = async (req) => {
      req.onProgress?.({ stage: "rendu", percent: 50 });
      fs.writeFileSync(req.outputPath, "mp4");
    };
    const q = new RenderQueue(() => root, "http://127.0.0.1:4317/media/", () => 10e9);
    const job = q.add("Verset", "Prière du matin", props());
    await waitFor(() => q.get(job.id)!.statut === "termine");
    const done = q.get(job.id)!;
    expect(done.chemin).toMatch(/^Exports\/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_priere-du-matin\.mp4$/);
    expect(fs.existsSync(path.join(root, ...done.chemin!.split("/")))).toBe(true);
  });

  it("échoue clairement si un média est introuvable", async () => {
    renderMock.impl = async () => {};
    const q = new RenderQueue(() => root, "", () => 10e9);
    const job = q.add("Verset", "x", props("Fonds/absent.jpg"));
    await waitFor(() => q.get(job.id)!.statut === "echec");
    expect(q.get(job.id)!.message).toBe("Média introuvable : Fonds/absent.jpg");
  });

  it("échoue clairement si le disque est presque plein", async () => {
    const q = new RenderQueue(() => root, "", () => 100 * 1024 * 1024);
    const job = q.add("Verset", "x", props());
    await waitFor(() => q.get(job.id)!.statut === "echec");
    expect(q.get(job.id)!.message).toMatch(/Espace disque insuffisant/);
  });

  it("échoue clairement si le disque n'est pas branché", async () => {
    const q = new RenderQueue(() => null, "", () => 10e9);
    const job = q.add("Verset", "x", props());
    await waitFor(() => q.get(job.id)!.statut === "echec");
    expect(q.get(job.id)!.message).toMatch(/Disque Zone-Chrétien non détecté/);
  });

  it("annule un rendu en attente et un rendu en cours ; une progression tardive ne le relance pas", async () => {
    let progress!: (p: { stage: "rendu"; percent: number }) => void;
    renderMock.impl = (req) =>
      new Promise<void>((_resolve, reject) => {
        progress = req.onProgress!;
        (req as unknown as { cancelSignal: (cb: () => void) => void }).cancelSignal(() =>
          reject(new Error("renderMedia() got cancelled")),
        );
      });
    const q = new RenderQueue(() => root, "", () => 10e9);
    const first = q.add("Verset", "premier", props());
    const second = q.add("Verset", "second", props());
    await waitFor(() => typeof progress === "function");

    expect(q.cancel(second.id)!.statut).toBe("annule");
    q.cancel(first.id);
    await waitFor(() => q.get(first.id)!.statut === "annule");
    progress({ stage: "rendu", percent: 80 }); // arrive après l'annulation
    expect(q.get(first.id)!.statut).toBe("annule");
    expect(q.get(first.id)!.message).toBe("Rendu annulé.");
    expect(q.get(second.id)!.statut).toBe("annule");
  });
});
