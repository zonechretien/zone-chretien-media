import { Img } from "remotion";
import { BRAND, wordmarkText } from "../brand";
import { brandAsset } from "../media";

/**
 * Monogramme officiel « ZC » (public/reels/logo/monogramme.svg), sans fond.
 * Img bloque le rendu tant que le fichier n'est pas chargé : jamais d'image
 * sans logo dans le MP4.
 */
export function BrandMark({ height }: { height: number }) {
  return (
    <Img
      src={brandAsset(BRAND.logo.monogram)}
      alt={BRAND.name}
      style={{ height, width: height * BRAND.logo.monogramRatio, display: "block" }}
    />
  );
}

/** Logotype « ZONE-CHRÉTIEN » en Bebas Neue : « ZONE- » blanc cassé, « CHRÉTIEN » or, comme le logo officiel. */
export function Wordmark({ fontSize }: { fontSize: number }) {
  const [first, ...rest] = wordmarkText().split("-");
  return (
    <span style={{ fontFamily: BRAND.fonts.display, fontSize, lineHeight: 1, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
      <span style={{ color: BRAND.colors.text }}>{first}-</span>
      <span style={{ color: BRAND.colors.gold }}>{rest.join("-")}</span>
    </span>
  );
}
