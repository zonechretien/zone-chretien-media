import { AbsoluteFill } from "remotion";
import { FORMATS, type FormatId } from "../formats";

/** Superposition des zones sûres (aperçu uniquement, jamais dans le MP4 exporté). */
export function SafeZoneOverlay({ format }: { format: FormatId }) {
  const { safe } = FORMATS[format];
  const hatch = "repeating-linear-gradient(45deg, rgba(255,60,60,0.28) 0 12px, rgba(255,60,60,0.12) 12px 24px)";
  const band = (style: React.CSSProperties) => <div style={{ position: "absolute", background: hatch, ...style }} />;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {band({ top: 0, left: 0, right: 0, height: safe.top })}
      {band({ bottom: 0, left: 0, right: 0, height: safe.bottom })}
      {band({ top: safe.top, bottom: safe.bottom, left: 0, width: safe.left })}
      {band({ top: safe.top, bottom: safe.bottom, right: 0, width: safe.right })}
      <div
        style={{
          position: "absolute",
          top: safe.top,
          left: safe.left,
          right: safe.right,
          bottom: safe.bottom,
          border: "3px dashed rgba(255,255,255,0.7)",
        }}
      />
    </AbsoluteFill>
  );
}
