/**
 * Rendu d'un Reel en ligne de commande.
 *
 *   npm run rendu -- --template Verset --props exemples/verset-psaume-34.json --out out/verset.mp4
 *   npm run rendu -- --template Evenement --format 16:9 --out out/evenement.mp4
 *
 * Sans --props, les valeurs d'exemple du template sont utilisées.
 * Templates : Verset, Priere, Devotion, Citation, Evenement. Formats : 9:16, 1:1, 16:9.
 *
 * Ctrl+C annule proprement le rendu en cours.
 */
import { makeCancelSignal } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { explainRenderError, renderReel } from "./render";
import { STUDIO_DIR } from "./paths";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const templateId = arg("template");
  const propsFile = arg("props");
  const out = arg("out");
  const format = arg("format");
  if (!templateId || !out) {
    console.error("Usage : npm run rendu -- --template <Id> [--props <fichier.json>] [--format 9:16|1:1|16:9] --out <fichier.mp4>");
    process.exit(2);
  }

  // Chemins relatifs au dossier du studio (jamais de chemin absolu enregistré).
  const outputPath = path.resolve(STUDIO_DIR, out);
  const props = propsFile
    ? (JSON.parse(fs.readFileSync(path.resolve(STUDIO_DIR, propsFile), "utf8")) as Record<string, unknown>)
    : {};
  if (format) props.format = format;

  const { cancelSignal, cancel } = makeCancelSignal();
  process.on("SIGINT", () => {
    console.log("\nAnnulation du rendu…");
    cancel();
  });

  let lastLine = "";
  const started = Date.now();
  await renderReel({
    templateId,
    props,
    outputPath,
    cancelSignal,
    onProgress: ({ stage, percent }) => {
      const line = `${stage === "preparation" ? "Préparation des templates" : "Rendu"} : ${percent} %`;
      if (line !== lastLine) {
        process.stdout.write(`\r${line}   `);
        lastLine = line;
      }
    },
  });

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\nVidéo enregistrée : ${path.relative(STUDIO_DIR, outputPath)} (${seconds} s)`);
}

main().catch((err) => {
  console.error(`\n${explainRenderError(err)}`);
  process.exit(1);
});
