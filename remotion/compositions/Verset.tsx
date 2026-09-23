import { useMemo } from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";
import { Background } from "../components/Background";
import { BrandMark } from "../components/BrandMark";
import { EndCard } from "../components/EndCard";
import { ReelAudio } from "../components/ReelAudio";
import { SafeZoneOverlay } from "../components/SafeZoneOverlay";
import { WordReveal } from "../components/WordReveal";
import { ensureBrandFonts } from "../fonts";
import { frenchTypography } from "../lib/typography";
import type { RuntimeProps, VersetProps } from "../schemas";
import { KICKER_TRACKING, LINE_HEIGHT, computeVersetLayout, revealFramesFor } from "./verset-layout";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.out(Easing.cubic);

/**
 * Template « Verset / Inspiration » : le verset apparaît mot par mot, sur un
 * ou plusieurs écrans selon sa longueur, avec sa référence mise en valeur.
 *
 * Accroche (3 premières secondes) : le fond bouge dès la première image, la
 * marque et le libellé montent pendant que le trait doré se dessine, et les
 * premiers mots du verset apparaissent dès 0,3 s.
 */
export function Verset(props: VersetProps & RuntimeProps) {
  ensureBrandFonts();
  const frame = useCurrentFrame();
  const L = useMemo(() => computeVersetLayout(props), [props]);
  const { box, sizes, timing, pagination } = L;
  const endFrom = timing.endCard.from;

  const headerIn = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: easeOut });
  const lineIn = interpolate(frame, [4, 24], [0, 1], { ...clamp, easing: easeOut });
  const firstReveal = timing.segments[0].from + revealFramesFor(pagination.pages[0], timing.segments[0].duration);
  const referenceIn = interpolate(frame, [firstReveal - 6, firstReveal + 12], [0, 1], { ...clamp, easing: easeOut });
  const contentOut = interpolate(frame, [endFrom - 12, endFrom], [1, 0], clamp);

  const label: React.CSSProperties = { fontFamily: BRAND.fonts.sans, fontWeight: 600, lineHeight: 1.3 };

  return (
    <AbsoluteFill>
      <Background background={props.background} mediaBaseUrl={props.mediaBaseUrl} />
      <ReelAudio music={props.music} voiceOver={props.voiceOver} mediaBaseUrl={props.mediaBaseUrl} />

      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          opacity: contentOut,
        }}
      >
        <div style={{ opacity: headerIn, transform: `translateY(${(1 - headerIn) * 24}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ ...label, display: "flex", alignItems: "center", gap: sizes.brand * 0.45, fontSize: sizes.brand, letterSpacing: "0.18em", color: BRAND.colors.textMuted }}>
            <BrandMark size={sizes.brand * 1.3} />
            <span>{BRAND.name.toUpperCase()}</span>
          </div>
          {props.kicker ? (
            <div style={{ ...label, marginTop: sizes.gapSm, fontSize: L.kickerSize, letterSpacing: `${KICKER_TRACKING}em`, color: BRAND.colors.gold, whiteSpace: "nowrap" }}>
              {frenchTypography(props.kicker).toUpperCase()}
            </div>
          ) : null}
        </div>
        <div style={{ marginTop: sizes.gapSm, width: sizes.textMax * 1.6 * lineIn, height: 3, background: BRAND.colors.gold }} />

        <div style={{ position: "relative", width: "100%", height: L.textAreaHeight, marginTop: sizes.gapLg, marginBottom: sizes.gapLg }}>
          {timing.segments.map((seg, i) => {
            const page = pagination.pages[i];
            const isLast = i === timing.segments.length - 1;
            return (
              <Sequence key={i} from={seg.from} durationInFrames={isLast ? endFrom - seg.from : seg.duration} layout="none">
                <Page
                  text={page}
                  fontSize={pagination.fontSize}
                  revealFrames={revealFramesFor(page, seg.duration)}
                  fadeOutFrom={isLast ? null : seg.duration - 10}
                />
              </Sequence>
            );
          })}
        </div>

        <div style={{ ...label, fontSize: L.referenceSize, color: BRAND.colors.gold, letterSpacing: "0.04em", whiteSpace: "nowrap", opacity: referenceIn, transform: `translateY(${(1 - referenceIn) * 16}px)` }}>
          {L.referenceLabel}
        </div>
      </div>

      <Sequence from={endFrom - 6}>
        <EndCard />
      </Sequence>

      {props.showSafeZones ? <SafeZoneOverlay format={props.format} /> : null}
    </AbsoluteFill>
  );
}

function Page({ text, fontSize, revealFrames, fadeOutFrom }: { text: string; fontSize: number; revealFrames: number; fadeOutFrom: number | null }) {
  const frame = useCurrentFrame();
  const out = fadeOutFrom === null ? 1 : interpolate(frame, [fadeOutFrom, fadeOutFrom + 10], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: out }}>
      <WordReveal
        text={text}
        startFrame={0}
        revealFrames={revealFrames}
        style={{
          width: "100%",
          fontFamily: BRAND.fonts.serif,
          fontWeight: 500,
          fontSize,
          lineHeight: LINE_HEIGHT,
          color: BRAND.colors.text,
          textWrap: "balance",
        }}
      />
    </div>
  );
}
