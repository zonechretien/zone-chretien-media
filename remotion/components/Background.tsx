import { AbsoluteFill, Img, Loop, OffthreadVideo, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, withAlpha } from "../brand";
import { mediaUrl } from "../media";
import type { BackgroundProps } from "../schemas";

/**
 * Fond animé dès la première image (léger zoom lent, dégradé qui pivote
 * doucement), pour que la vidéo « vive » tout de suite, sans effet tape-à-l'œil.
 */
export function Background({ background, mediaBaseUrl }: { background: BackgroundProps; mediaBaseUrl?: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames);
  const zoom = interpolate(progress, [0, 1], [1.12, 1.0]);

  const url = background.type === "image" || background.type === "video" ? mediaUrl(background.path, mediaBaseUrl) : null;

  let base: React.ReactNode;
  if (background.type === "color") {
    base = <AbsoluteFill style={{ backgroundColor: background.color }} />;
  } else if ((background.type === "image" || background.type === "video") && url) {
    const media =
      background.type === "image" ? (
        <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <LoopingVideo src={url} mediaDurationSeconds={background.mediaDurationSeconds} />
      );
    // Voile jamais plus léger que le minimal de la charte, y compris en haut
    // (en-tête de marque) : le texte reste lisible même sur une photo claire.
    const dim = Math.max(background.dim, BRAND.readability.minPhotoDim);
    const veil = (alpha: number) => withAlpha(BRAND.colors.navyDeep, alpha);
    base = (
      <AbsoluteFill>
        <AbsoluteFill style={{ transform: `scale(${zoom})` }}>{media}</AbsoluteFill>
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${veil(dim)} 0%, ${veil(dim)} 55%, ${veil(Math.min(0.95, dim + 0.15))} 100%)`,
          }}
        />
      </AbsoluteFill>
    );
  } else {
    // Dégradé (ou repli si le média n'est pas disponible).
    const from = background.type === "gradient" ? background.from : BRAND.colors.navyLight;
    const to = background.type === "gradient" ? background.to : BRAND.colors.navyDeep;
    const angle = interpolate(progress, [0, 1], [160, 200]);
    base = (
      <AbsoluteFill
        style={{ background: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`, transform: `scale(${zoom})` }}
      />
    );
  }

  // Pas de halo : un dégradé net, sans zone terne au centre.
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.navyDeep, overflow: "hidden" }}>
      {base}
      {/* Vignettage : concentre le regard au centre et améliore la lisibilité. */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${withAlpha(BRAND.colors.navyDeep, 0)} 45%, ${withAlpha(BRAND.colors.navyDeep, 0.5)} 100%)` }} />
    </AbsoluteFill>
  );
}

/** Vidéo de fond muette, rejouée en boucle si elle est plus courte que le Reel. */
function LoopingVideo({ src, mediaDurationSeconds }: { src: string; mediaDurationSeconds: number | null }) {
  const { fps, durationInFrames } = useVideoConfig();
  const video = <OffthreadVideo src={src} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  const clipFrames = mediaDurationSeconds ? Math.floor(mediaDurationSeconds * fps) : null;
  if (!clipFrames || clipFrames >= durationInFrames) return video;
  return <Loop durationInFrames={clipFrames}>{video}</Loop>;
}
