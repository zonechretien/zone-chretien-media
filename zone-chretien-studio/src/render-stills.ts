/**
 * Aperçus fixes de tous les templates dans tous les formats (valeurs par
 * défaut), pour vérifier la mise en page d'un coup d'œil — par exemple après
 * avoir modifié la charte (remotion/brand.ts).
 *
 *   npm run apercus            → out/apercus/<Template>_<format>_<moment en %>.png
 *   npm run apercus -- Evenement 9:16,1:1 0.2,0.9   → un template, des formats et des moments choisis
 *   npm run apercus -- --plan <plan.json> [--sortie <dossier>]
 *        → images précises : [{ "id", "format", "props", "captures": [{ "name", "frame" }] }]
 *          (props complètes du template ; images numérotées dans la durée de la vidéo)
 */
import { ensureBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { STUDIO_DIR } from "./paths";
import { explainRenderError, getServeUrl, useStudioWorkingDir } from "./render";

type PlanItem = { id: string; format: string; props: Record<string, unknown>; captures: { name: string; frame: number }[] };

function option(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function renderPlan(serveUrl: string, planFile: string, outDir: string) {
  const plan = JSON.parse(fs.readFileSync(planFile, "utf8")) as PlanItem[];
  for (const item of plan) {
    const inputProps = { ...item.props, format: item.format, showSafeZones: false };
    const composition = await selectComposition({ serveUrl, id: item.id, inputProps });
    for (const capture of item.captures) {
      const frame = Math.min(composition.durationInFrames - 1, Math.max(0, capture.frame));
      const output = path.join(outDir, capture.name);
      await renderStill({ composition, serveUrl, inputProps, frame, output, imageFormat: "png" });
      console.log(`${path.relative(STUDIO_DIR, output)}  (${(frame / composition.fps).toFixed(1)} s / ${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
    }
  }
}

async function main() {
  useStudioWorkingDir();
  await ensureBrowser();
  console.log("Préparation des templates…");
  const serveUrl = await getServeUrl();

  const planFile = option("plan");
  if (planFile) {
    const outDir = path.resolve(option("sortie") ?? path.join(STUDIO_DIR, "out", "apercus"));
    fs.mkdirSync(outDir, { recursive: true });
    await renderPlan(serveUrl, path.resolve(planFile), outDir);
    return;
  }

  const [templateArg, formatArg, momentArg] = process.argv.slice(2);
  const TEMPLATES = templateArg ? templateArg.split(",") : ["Verset", "Priere", "Devotion", "Citation", "Evenement"];
  const FORMATS = formatArg ? formatArg.split(",") : ["9:16", "1:1", "16:9"];
  /** Moments capturés, en part de la durée (par défaut : accroche, milieu, dernier écran de contenu). */
  const MOMENTS = momentArg ? momentArg.split(",").map(Number) : [0.1, 0.45, 0.8];
  const outDir = path.join(STUDIO_DIR, "out", "apercus");
  fs.mkdirSync(outDir, { recursive: true });

  for (const id of TEMPLATES) {
    for (const format of FORMATS) {
      const inputProps = { format, showSafeZones: false };
      const composition = await selectComposition({ serveUrl, id, inputProps });
      for (const moment of MOMENTS) {
        const frame = Math.min(composition.durationInFrames - 1, Math.round(composition.durationInFrames * moment));
        const output = path.join(outDir, `${id}_${format.replace(":", "x")}_${Math.round(moment * 100)}.png`);
        await renderStill({ composition, serveUrl, inputProps, frame, output, imageFormat: "png" });
        console.log(`${path.relative(STUDIO_DIR, output)}  (${(frame / composition.fps).toFixed(1)} s / ${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
      }
    }
  }
}

main().catch((err) => {
  console.error(explainRenderError(err));
  process.exit(1);
});
