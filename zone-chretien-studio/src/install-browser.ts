/**
 * Télécharge une seule fois le navigateur de rendu de Remotion (Chrome
 * Headless Shell), dans zone-chretien-studio/node_modules/.remotion/ : il reste
 * sur le disque, aucun droit administrateur n'est nécessaire, et le rendu
 * fonctionne ensuite hors ligne.
 */
import { ensureBrowser } from "@remotion/renderer";
import { explainRenderError, useStudioWorkingDir } from "./render";

async function main() {
  useStudioWorkingDir();
  console.log("Vérification du navigateur de rendu…");
  const status = await ensureBrowser();
  if (status.type === "local-puppeteer-browser" || status.type === "user-defined-path") {
    console.log(`Navigateur de rendu prêt : ${status.path}`);
  } else {
    throw new Error(`Navigateur de rendu indisponible (${status.type}).`);
  }
}

main().catch((err) => {
  console.error(explainRenderError(err));
  process.exit(1);
});
