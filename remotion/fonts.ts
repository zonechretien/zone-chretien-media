import { loadFont } from "@remotion/fonts";
import { BRAND } from "./brand";
import { brandAsset } from "./media";

let loading: Promise<void> | null = null;

/**
 * Charge les polices de marque depuis les fichiers locaux (une seule fois par
 * page). loadFont() bloque le rendu (delayRender) tant que les polices ne
 * sont pas prêtes : aucune image n'est jamais rendue avec une police de repli.
 * Sans effet côté serveur (rendu Next.js), où `document` n'existe pas.
 */
export function ensureBrandFonts(): void {
  if (loading || typeof document === "undefined") return;
  loading = Promise.all(
    BRAND.fontFiles.map((f) =>
      loadFont({ family: f.family, url: brandAsset(f.file), style: f.style, weight: f.weight, format: "truetype" }),
    ),
  ).then(() => undefined);
}
