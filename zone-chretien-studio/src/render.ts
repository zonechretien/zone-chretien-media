import { ensureBrowser, renderMedia, selectComposition, type CancelSignal } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { bundleTemplates } from "./bundle";
import { STUDIO_DIR } from "./paths";

/**
 * Remotion range son navigateur de rendu dans le node_modules du dossier
 * courant : on se place toujours dans le studio pour qu'il soit téléchargé une
 * seule fois, sur le disque, à côté du studio (jamais dans le profil Windows).
 */
export function useStudioWorkingDir(): void {
  process.chdir(STUDIO_DIR);
}

/** Licence Remotion (voir remotion.dev/license). Non renseignée : Remotion affiche un avertissement. */
function licenseKey(): string | undefined {
  return process.env.REMOTION_LICENSE_KEY?.trim() || undefined;
}

export class RenderError extends Error {}

/** Traduit les erreurs techniques les plus courantes en messages compréhensibles. */
export function explainRenderError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/cancel/i.test(message)) return "Rendu annulé.";
  if (/ENOSPC/i.test(message)) return "Espace disque insuffisant pour enregistrer la vidéo.";
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|getaddrinfo/i.test(message) && /browser|chrome|download/i.test(message)) {
    return "Navigateur de rendu absent et impossible à télécharger (pas de connexion Internet). Connectez-vous une fois à Internet puis relancez « npm run navigateur ».";
  }
  if (/Could not find composition|No composition with the ID/i.test(message)) return "Template inconnu.";
  if (/ZodError|invalid_type|Invalid input/i.test(message)) return `Données du Reel invalides : ${message}`;
  return `Le rendu a échoué : ${message}`;
}

export type RenderRequest = {
  templateId: string;
  props: Record<string, unknown>;
  outputPath: string;
  onProgress?: (p: { stage: "bundle" | "render"; percent: number }) => void;
  cancelSignal?: CancelSignal;
};

export async function renderReel(req: RenderRequest): Promise<void> {
  useStudioWorkingDir();
  await ensureBrowser();

  const serveUrl = await bundleTemplates((percent) => req.onProgress?.({ stage: "bundle", percent }));

  // Les zones sûres ne sont qu'une aide à l'aperçu : jamais dans le MP4.
  const inputProps = { ...req.props, showSafeZones: false };

  // calculateMetadata revalide les props avec le schéma zod du template.
  const composition = await selectComposition({ serveUrl, id: req.templateId, inputProps });

  fs.mkdirSync(path.dirname(req.outputPath), { recursive: true });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    // Réglages « réseaux sociaux » : yuv420p en plage limitée + couleurs bt709,
    // lus correctement par Instagram, TikTok, YouTube et les téléphones.
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    jpegQuality: 95,
    outputLocation: req.outputPath,
    inputProps,
    cancelSignal: req.cancelSignal,
    licenseKey: licenseKey(),
    onProgress: ({ progress }) => req.onProgress?.({ stage: "render", percent: Math.round(progress * 100) }),
  });
}
