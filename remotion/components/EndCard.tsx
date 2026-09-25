import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { BrandMark, Wordmark } from "./BrandMark";

/** Écran de fin commun à toutes les vidéos : monogramme, logotype, devise et « zone-chretien.org ». */
export function EndCard() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const unit = Math.min(width, height);

  const ease = Easing.out(Easing.cubic);
  const at = (from: number, to: number) => interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const markIn = at(0, 18);
  const nameIn = at(8, 26);
  const taglineIn = at(12, 30);
  const lineIn = at(16, 36);
  const siteIn = at(20, 38);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
      <div style={{ opacity: markIn, transform: `scale(${0.9 + 0.1 * markIn})` }}>
        <BrandMark height={unit * BRAND.logo.endCardSize} />
      </div>
      <div style={{ marginTop: unit * 0.045, opacity: nameIn, transform: `translateY(${(1 - nameIn) * 20}px)` }}>
        <Wordmark fontSize={unit * 0.1} />
      </div>
      <div
        style={{
          marginTop: unit * 0.018,
          opacity: taglineIn,
          fontFamily: BRAND.fonts.serif,
          fontStyle: "italic",
          fontSize: unit * 0.038,
          color: BRAND.colors.textMuted,
        }}
      >
        {BRAND.tagline}
      </div>
      <div style={{ marginTop: unit * 0.04, width: unit * 0.14 * lineIn, height: Math.max(3, unit * 0.003), background: BRAND.colors.gold }} />
      <div
        style={{
          marginTop: unit * 0.035,
          opacity: siteIn,
          fontFamily: BRAND.fonts.sans,
          fontWeight: 600,
          fontSize: unit * 0.042,
          letterSpacing: "0.12em",
          color: BRAND.colors.gold,
        }}
      >
        {BRAND.website}
      </div>
    </AbsoluteFill>
  );
}
