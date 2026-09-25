import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { BRAND, withAlpha } from "../brand";
import { Background } from "../components/Background";
import { BrandMark, Wordmark } from "../components/BrandMark";
import { EndCard } from "../components/EndCard";
import { ReelAudio } from "../components/ReelAudio";
import { SafeZoneOverlay } from "../components/SafeZoneOverlay";
import { WordReveal } from "../components/WordReveal";
import { ensureBrandFonts } from "../fonts";
import type { BackgroundProps, MusicProps, RuntimeProps, VoiceOverProps } from "../schemas";
import { CTA_LINE_HEIGHT, CTA_PADDING, DETAIL_ROW, HEADING_LINE_HEIGHT, KICKER_TRACKING, LINE_HEIGHT, blockGap, headerMarkSize, referenceMargin, revealFramesFor, type LaidBlock, type LaidScreen, type ReelLayout } from "./layout";
import type { DetailIcon } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.out(Easing.cubic);
const label: React.CSSProperties = { fontFamily: BRAND.fonts.sans, fontWeight: 600, lineHeight: 1.3 };

/**
 * Rendu commun à tous les templates : fond, bande son, en-tête de marque,
 * écrans successifs (accroche dès la première image), pied persistant, écran
 * de fin, zones sûres (aperçu uniquement).
 */
export function ReelScreens({
  layout,
  background,
  music,
  voiceOver,
  mediaBaseUrl,
  showSafeZones,
}: {
  layout: ReelLayout;
  background: BackgroundProps;
  music: MusicProps | null;
  voiceOver: VoiceOverProps | null;
} & RuntimeProps) {
  ensureBrandFonts();
  const frame = useCurrentFrame();
  const { box, sizes, timing, screens } = layout;
  const endFrom = timing.endCard.from;

  const headerIn = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: easeOut });
  const lineIn = interpolate(frame, [4, 24], [0, 1], { ...clamp, easing: easeOut });
  const footerAt = timing.segments[0].from + firstRevealFrames(screens[0], timing.segments[0].duration);
  const footerIn = interpolate(frame, [footerAt - 6, footerAt + 12], [0, 1], { ...clamp, easing: easeOut });
  const contentOut = interpolate(frame, [endFrom - 12, endFrom], [1, 0], clamp);
  const markSize = headerMarkSize(layout.format);
  // Sur une photo ou une vidéo, une ombre détache le texte d'un fond chargé (héritée par tout le contenu).
  const onMedia = background.type === "image" || background.type === "video";

  return (
    <AbsoluteFill>
      <Background background={background} mediaBaseUrl={mediaBaseUrl} />
      <ReelAudio music={music} voiceOver={voiceOver} mediaBaseUrl={mediaBaseUrl} />

      <div
        style={{
          textShadow: onMedia ? BRAND.readability.photoTextShadow : undefined,
          position: "absolute",
          left: box.x,
          top: layout.group.top,
          width: box.width,
          height: layout.group.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          opacity: contentOut,
        }}
      >
        <div style={{ opacity: headerIn, transform: `translateY(${(1 - headerIn) * 24}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", height: markSize, gap: markSize * 0.28 }}>
            <BrandMark height={markSize} />
            <Wordmark fontSize={markSize * BRAND.logo.headerWordmark} />
          </div>
          {layout.kicker ? (
            <div style={{ ...label, marginTop: sizes.gapSm, fontSize: layout.kicker.fontSize, letterSpacing: `${KICKER_TRACKING}em`, color: layout.accent, whiteSpace: "nowrap" }}>
              {layout.kicker.text}
            </div>
          ) : null}
        </div>
        <div style={{ marginTop: sizes.gapSm, width: sizes.bodyMax * 1.6 * lineIn, height: 3, background: layout.accent }} />

        <div style={{ position: "relative", flexShrink: 0, width: layout.textWidth, height: layout.stageUsed, marginTop: sizes.gapLg }}>
          {timing.segments.map((seg, i) => {
            const isLast = i === timing.segments.length - 1;
            return (
              <Sequence key={i} from={seg.from} durationInFrames={isLast ? endFrom - seg.from : seg.duration} layout="none">
                <Screen screen={screens[i]} layout={layout} segmentFrames={seg.duration} fadeOutFrom={isLast ? null : seg.duration - 10} />
              </Sequence>
            );
          })}
        </div>

        {layout.persistentFooter ? (
          <div
            style={{
              ...label,
              marginTop: referenceMargin(layout, screens.at(-1)?.blocks.at(-1), layout.persistentFooter.fontSize),
              fontSize: layout.persistentFooter.fontSize,
              color: layout.accent,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              opacity: footerIn,
              transform: `translateY(${(1 - footerIn) * 16}px)`,
            }}
          >
            {layout.persistentFooter.text}
          </div>
        ) : null}
      </div>

      <Sequence from={endFrom - 6}>
        <EndCard />
      </Sequence>

      {showSafeZones ? <SafeZoneOverlay format={layout.format} /> : null}
    </AbsoluteFill>
  );
}

/** Moment où le texte principal du premier écran a fini d'apparaître. */
function firstRevealFrames(screen: LaidScreen, segmentFrames: number): number {
  const body = screen.blocks.find((b) => b.type === "body");
  return body ? revealFramesFor(body.text, segmentFrames) : 20;
}

function Screen({ screen, layout, segmentFrames, fadeOutFrom }: { screen: LaidScreen; layout: ReelLayout; segmentFrames: number; fadeOutFrom: number | null }) {
  const frame = useCurrentFrame();
  const out = fadeOutFrom === null ? 1 : interpolate(frame, [fadeOutFrom, fadeOutFrom + 10], [1, 0], clamp);

  // Enchaînement : chaque bloc commence quand le précédent est lisible.
  let cursor = 0;
  const starts = screen.blocks.map((b) => {
    const start = cursor;
    cursor += b.type === "body" ? revealFramesFor(b.text, segmentFrames) : b.type === "details" ? 10 + b.items.length * 8 : 14;
    return start;
  });
  const footerStart = cursor;

  // Avec une référence / un auteur persistant sous la scène, les écrans sont
  // calés en bas : l'écart avec le texte reste le même sur tous les écrans.
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: layout.persistentFooter ? "flex-end" : "center", opacity: out }}>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: blockGap(layout.sizes) }}>
        {screen.blocks.map((block, i) => (
          <Block key={i} block={block} start={starts[i]} segmentFrames={segmentFrames} accent={layout.accent} />
        ))}
      </div>
      {screen.footer ? (
        <Rise
          start={footerStart}
          style={{ ...label, marginTop: referenceMargin(layout, screen.blocks.at(-1), screen.footer.fontSize), fontSize: screen.footer.fontSize, color: layout.accent, letterSpacing: "0.04em", whiteSpace: "nowrap" }}
        >
          {screen.footer.text}
        </Rise>
      ) : null}
    </div>
  );
}

/** Fondu + légère montée à partir d'une image donnée. */
function Rise({ start, children, style }: { start: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [start, start + 16], [0, 1], { ...clamp, easing: easeOut });
  return <div style={{ ...style, opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}>{children}</div>;
}

function Block({ block, start, segmentFrames, accent }: { block: LaidBlock; start: number; segmentFrames: number; accent: string }) {
  const frame = useCurrentFrame();
  switch (block.type) {
    case "heading":
      return (
        <Rise start={start} style={{ fontFamily: BRAND.fonts.serif, fontWeight: 700, fontSize: block.fontSize, lineHeight: HEADING_LINE_HEIGHT, color: BRAND.colors.text, width: "100%", textWrap: "balance" }}>
          {block.text}
        </Rise>
      );
    case "body":
      return (
        <WordReveal
          text={block.text}
          startFrame={start}
          revealFrames={revealFramesFor(block.text, segmentFrames)}
          style={{ width: "100%", fontFamily: BRAND.fonts.serif, fontWeight: 500, fontSize: block.fontSize, lineHeight: LINE_HEIGHT, color: BRAND.colors.text, textWrap: "balance" }}
        />
      );
    case "details":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {block.items.map((item, i) => (
            <Rise key={i} start={start + i * 8} style={{ ...label, display: "flex", alignItems: "center", gap: block.fontSize * 0.45, height: block.fontSize * DETAIL_ROW, fontSize: block.fontSize, color: BRAND.colors.text, whiteSpace: "nowrap" }}>
              <DetailGlyph icon={item.icon} size={block.fontSize * 1.05} color={accent} />
              <span>{item.text}</span>
            </Rise>
          ))}
        </div>
      );
    case "cta": {
      const t = interpolate(frame, [start, start + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
      return (
        <div
          style={{
            ...label,
            opacity: Math.min(1, t * 1.5),
            transform: `scale(${0.9 + 0.1 * t})`,
            fontSize: block.fontSize,
            lineHeight: CTA_LINE_HEIGHT,
            maxWidth: "90%",
            padding: `${block.fontSize * CTA_PADDING}px ${block.fontSize}px`,
            borderRadius: block.fontSize * 1.1,
            background: BRAND.colors.gold,
            color: BRAND.colors.onGold,
            textShadow: "none",
            textWrap: "balance",
            boxShadow: `0 12px 40px ${withAlpha(BRAND.colors.navyDeep, 0.45)}`,
          }}
        >
          {block.text}
        </div>
      );
    }
  }
}

/** Pictogrammes simples (SVG), dans la couleur d'accent du template. */
function DetailGlyph({ icon, size, color }: { icon: DetailIcon; size: number; color: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (icon === "date") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }
  if (icon === "time") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
