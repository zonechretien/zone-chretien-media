import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { BrandMark } from "./BrandMark";

/** Écran de fin commun à toutes les vidéos : logo + « zone-chretien.org ». */
export function EndCard() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const unit = Math.min(width, height);

  const ease = Easing.out(Easing.cubic);
  const markIn = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const nameIn = interpolate(frame, [8, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const lineIn = interpolate(frame, [14, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const siteIn = interpolate(frame, [20, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ opacity: markIn, transform: `scale(${0.9 + 0.1 * markIn})` }}>
        <BrandMark size={unit * 0.2} />
      </div>
      <div
        style={{
          marginTop: unit * 0.045,
          opacity: nameIn,
          transform: `translateY(${(1 - nameIn) * 20}px)`,
          fontFamily: BRAND.fonts.serif,
          fontWeight: 600,
          fontSize: unit * 0.075,
          color: BRAND.colors.text,
        }}
      >
        {BRAND.name}
      </div>
      <div
        style={{
          marginTop: unit * 0.03,
          width: unit * 0.14 * lineIn,
          height: Math.max(2, unit * 0.003),
          background: BRAND.colors.gold,
        }}
      />
      <div
        style={{
          marginTop: unit * 0.03,
          opacity: siteIn,
          fontFamily: BRAND.fonts.sans,
          fontWeight: 600,
          fontSize: unit * 0.04,
          letterSpacing: "0.12em",
          color: BRAND.colors.gold,
        }}
      >
        {BRAND.website}
      </div>
    </AbsoluteFill>
  );
}
