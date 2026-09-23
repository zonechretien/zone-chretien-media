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

/** Erreur dont le message est déjà rédigé pour l'utilisateur. */
export class UserFacingError extends Error {}

/** Traduit les erreurs techniques les plus courantes en messages compréhensibles. */
export function explainRenderError(err: unknown): string {
  if (err instanceof UserFacingError) return err.message;
  const message = err instanceof Error ? err.message : String(err);
  if (/cancel/i.test(message)) return "Rendu annulé.";
  if (/ENOSPC/i.test(message)) return "Espace disque insuffisant pour enregistrer la vidéo.";
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|getaddrinfo|fetch failed/i.test(message) && /browser|chrome|download|storage\.googleapis/i.test(message)) {
    return "Navigateur de rendu absent et impossible à télécharger (pas de connexion Internet). Connecte-toi une fois à Internet puis relance le studio.";
  }
  if (/Failed to launch the browser/i.test(message)) {
    return "Le navigateur de rendu n'a pas pu démarrer. Relance le studio ; si le problème persiste, vérifie que le dossier du studio est près de la racine du disque (chemins Windows limités à 260 caractères).";
  }
  if (/Could not find composition|No composition with the ID/i.test(message)) return "Template inconnu.";
  if (/ZodError|invalid_type|Invalid input|too_small|too_big/i.test(message)) return `Données du Reel invalides : ${message}`;
  if (/Unsupported|Invalid data found|could not find codec|moov atom/i.test(message)) return `Format de média non supporté : ${message}`;
  return `Le rendu a échoué : ${message}`;
}

// Le bundle des templates est construit une seule fois par session du studio
// (~20 s) ; un « git pull » des templates demande donc de relancer le studio.
let serveUrlPromise: Promise<string> | null = null;
export function getServeUrl(onProgress?: (percent: number) => void): Promise<string> {
  if (!serveUrlPromise) {
    serveUrlPromise = bundleTemplates(onProgress).catch((e) => {
      serveUrlPromise = null;
      throw e;
    });
  }
  return serveUrlPromise;
}

export type RenderRequest = {
  templateId: string;
  props: Record<string, unknown>;
  outputPath: string;
  /** URL des médias servis par le studio (http://127.0.0.1:<port>/media/). */
  mediaBaseUrl?: string;
  onProgress?: (p: { stage: "preparation" | "rendu"; percent: number }) => void;
  cancelSignal?: CancelSignal;
};

export async function renderReel(req: RenderRequest): Promise<void> {
  useStudioWorkingDir();
  await ensureBrowser();

  const serveUrl = await getServeUrl((percent) => req.onProgress?.({ stage: "preparation", percent }));

  // Les zones sûres ne sont qu'une aide à l'aperçu : jamais dans le MP4.
  const inputProps = { ...req.props, mediaBaseUrl: req.mediaBaseUrl, showSafeZones: false };

  // calculateMetadata revalide les props avec le schéma zod du template.
  const composition = await selectComposition({ serveUrl, id: req.templateId, inputProps });

  fs.mkdirSync(path.dirname(req.outputPath), { recursive: true });
  // Rendu dans un fichier temporaire, renommé seulement en cas de succès :
  // jamais de MP4 incomplet dans Exports/.
  const partial = `${req.outputPath}.partiel.mp4`;
  try {
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      // Réglages « réseaux sociaux » : yuv420p en plage limitée + couleurs bt709,
      // lus correctement par Instagram, TikTok, YouTube et les téléphones.
      pixelFormat: "yuv420p",
      colorSpace: "bt709",
      jpegQuality: 95,
      outputLocation: partial,
      inputProps,
      cancelSignal: req.cancelSignal,
      licenseKey: licenseKey(),
      onProgress: ({ progress }) => req.onProgress?.({ stage: "rendu", percent: Math.round(progress * 100) }),
    });
    fs.renameSync(partial, req.outputPath);
  } finally {
    fs.rmSync(partial, { force: true });
  }
}
