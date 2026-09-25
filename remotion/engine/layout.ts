import { BRAND } from "../brand";
import { FORMATS, contentBox, type FormatId } from "../formats";
import { fitText, paginateText, wordCount, wrapLines } from "../lib/text-fit";
import { computeSequenceTiming, type SequenceTiming } from "../lib/timing";
import { narrationScript, type NarrationScript } from "../lib/sync/script";
import { activeSync, computeSyncedTiming, type WordFrames } from "../lib/sync/timing";
import type { TextStyle, VoiceOverProps } from "../schemas";
import { frenchQuote, frenchTypography } from "../lib/typography";
import type { DetailIcon, ReelSpec, ScreenBlock } from "./types";

/**
 * Mise en page d'un ReelSpec (logique pure) : tailles de police, découpage du
 * texte en écrans, minutage. Aucune mesure DOM : l'aperçu du CMS et le rendu
 * MP4 obtiennent exactement la même mise en page.
 */

type Sizes = {
  kicker: number;
  footer: number;
  headingMax: number;
  headingMin: number;
  bodyMax: number;
  bodyReadable: number;
  bodyMin: number;
  details: number;
  cta: number;
  gapSm: number;
  gapLg: number;
  maxWords: number;
  /** Largeur utile du texte, en part de la zone sûre (lignes trop longues illisibles en 16:9). */
  textWidthRatio: number;
};

export const SIZES: Record<FormatId, Sizes> = {
  "9:16": { kicker: 38, footer: 44, headingMax: 100, headingMin: 56, bodyMax: 88, bodyReadable: 58, bodyMin: 50, details: 56, cta: 60, gapSm: 26, gapLg: 56, maxWords: 26, textWidthRatio: 1 },
  "1:1": { kicker: 32, footer: 36, headingMax: 84, headingMin: 46, bodyMax: 70, bodyReadable: 46, bodyMin: 40, details: 44, cta: 46, gapSm: 18, gapLg: 36, maxWords: 22, textWidthRatio: 1 },
  "16:9": { kicker: 32, footer: 38, headingMax: 92, headingMin: 50, bodyMax: 76, bodyReadable: 50, bodyMin: 42, details: 48, cta: 50, gapSm: 18, gapLg: 36, maxWords: 30, textWidthRatio: 0.82 },
};

export const LINE_HEIGHT = 1.34;
export const HEADING_LINE_HEIGHT = 1.15;
const LABEL_LINE_HEIGHT = 1.3;
export const KICKER_TRACKING = 0.2;
/** Espace vertical entre deux lignes de détails, en part de la taille du texte. */
export const DETAIL_ROW = 1.9;
/** Interligne d'un appel à l'action et marge intérieure verticale (en part de la taille du texte). */
export const CTA_LINE_HEIGHT = 1.25;
export const CTA_PADDING = 0.7;

export type LaidBlock =
  | { type: "heading"; lines: number; fontSize: number; text: string }
  | { type: "body"; fontSize: number; text: string }
  | { type: "details"; fontSize: number; items: { icon: DetailIcon; text: string }[] }
  | { type: "cta"; fontSize: number; lines: number; text: string };

export type LaidScreen = { blocks: LaidBlock[]; footer: { text: string; fontSize: number } | null; words: number };

export type ReelLayout = {
  format: FormatId;
  width: number;
  height: number;
  box: ReturnType<typeof contentBox>;
  sizes: Sizes;
  textWidth: number;
  kicker: { text: string; fontSize: number } | null;
  persistentFooter: { text: string; fontSize: number } | null;
  /** Couleur d'accent du template (charte : BRAND.themes). */
  accent: string;
  /** Hauteur disponible pour le contenu des écrans (budget de la mise en page). */
  stageHeight: number;
  /** Hauteur réellement occupée par les écrans (le plus haut d'entre eux). */
  stageUsed: number;
  /** Écart visuel constant entre un texte et sa référence ou son auteur. */
  referenceGap: number;
  /** Bloc complet (en-tête, écrans, pied) : centré sur l'image, sans jamais sortir de la zone sûre. */
  group: { top: number; height: number };
  screens: LaidScreen[];
  timing: SequenceTiming;
  /** Texte lu par la voix off (mots dans l'ordre des écrans, phrases). */
  script: NarrationScript;
  /** Synchronisation sur la voix off, si elle est valable pour ce texte et cette voix. */
  sync: { style: TextStyle; words: WordFrames[] } | null;
};

/** Interlignage au-dessus et au-dessous d'un bloc (la moitié de l'interligne en trop). */
export function halfLeading(block: LaidBlock | undefined): number {
  if (!block) return 0;
  if (block.type === "body") return ((LINE_HEIGHT - 1) / 2) * block.fontSize;
  if (block.type === "heading") return ((HEADING_LINE_HEIGHT - 1) / 2) * block.fontSize;
  return 0;
}

/**
 * Marge au-dessus d'une référence / d'un auteur, qui compense l'interlignage
 * du texte et du libellé : l'espace VISIBLE entre les lettres reste égal à
 * referenceGap quelle que soit la taille du texte (donc sa longueur).
 */
export function referenceMargin(layout: Pick<ReelLayout, "referenceGap">, lastBlock: LaidBlock | undefined, footerFontSize: number): number {
  return layout.referenceGap - halfLeading(lastBlock) - ((LABEL_LINE_HEIGHT - 1) / 2) * footerFontSize;
}

/** Taille du monogramme de l'en-tête (charte : BRAND.logo.headerSize). */
export function headerMarkSize(format: FormatId): number {
  const f = FORMATS[format];
  return Math.round(Math.min(f.width, f.height) * BRAND.logo.headerSize);
}

/** Taille d'un libellé d'une seule ligne, réduite si nécessaire pour tenir en largeur. */
function singleLineSize(text: string, maxSize: number, maxWidth: number, extraEmPerChar = 0): number {
  const chars = [...text].length;
  const min = Math.round(maxSize * 0.55);
  const fit = fitText(text, {
    maxWidth: maxWidth - chars * extraEmPerChar * maxSize,
    maxHeight: maxSize * LABEL_LINE_HEIGHT,
    maxFontSize: maxSize,
    minFontSize: min,
    lineHeight: LABEL_LINE_HEIGHT,
  });
  return fit ? fit.fontSize : min;
}

/** Temps de lecture d'un écran : proportionnel au nombre de mots, borné. */
export function screenSeconds(words: number, hasBody: boolean): number {
  const seconds = words / 3 + (hasBody ? 1.6 : 1.4);
  return Math.min(14, Math.max(hasBody ? 3.5 : 2.6, seconds));
}

const typo = (s: string) => frenchTypography(s.replace(/\s+/g, " ").trim());

export function layoutReel(spec: ReelSpec, format: FormatId, durationSeconds: number | null, voice: VoiceOverProps | null = null): ReelLayout {
  const f = FORMATS[format];
  const box = contentBox(format);
  const s = SIZES[format];
  const textWidth = Math.floor(box.width * s.textWidthRatio);

  const kickerText = typo(spec.kicker).toUpperCase();
  const kicker = kickerText ? { text: kickerText, fontSize: singleLineSize(kickerText, s.kicker, box.width, KICKER_TRACKING) } : null;
  const footerLine = (text: string) => ({ text: typo(text), fontSize: singleLineSize(typo(text), s.footer, textWidth) });
  const persistentFooter = spec.persistentFooter ? footerLine(spec.persistentFooter) : null;

  // En-tête : monogramme + logotype, accroche, trait doré. Pied : ligne persistante.
  const referenceGap = Math.round(s.gapLg * 0.6);
  const header = headerMarkSize(format) + (kicker ? s.gapSm + kicker.fontSize * LABEL_LINE_HEIGHT : 0) + s.gapSm + 3;
  const footer = persistentFooter ? referenceGap + persistentFooter.fontSize * LABEL_LINE_HEIGHT : 0;
  const stageHeight = Math.floor((box.height - header - footer - 2 * s.gapLg) * 0.97);

  const screens: LaidScreen[] = [];
  for (const screen of spec.screens) {
    const screenFooter = screen.footer ? footerLine(screen.footer) : null;
    const footerHeight = screenFooter ? screenFooter.fontSize * LABEL_LINE_HEIGHT + referenceGap : 0;

    // Blocs fixes (hors texte principal) : hauteur réservée, texte principal dans le reste.
    const fixed: LaidBlock[] = [];
    let fixedHeight = 0;
    let body: Extract<ScreenBlock, { type: "body" }> | null = null;
    let bodyIndex = -1;
    // Titre : place réduite s'il partage l'écran avec le texte principal ou des détails (nom d'un événement).
    const headingBudget = screen.blocks.some((b) => b.type === "body") ? stageHeight * 0.34 : screen.blocks.some((b) => b.type === "details") ? stageHeight * 0.45 : stageHeight * 0.8;

    screen.blocks.forEach((block, i) => {
      if (block.type === "body") {
        body = block;
        bodyIndex = i;
        return;
      }
      let laid: LaidBlock;
      let height: number;
      if (block.type === "heading") {
        const text = typo(block.text);
        const fit =
          fitText(text, { maxWidth: textWidth, maxHeight: headingBudget, maxFontSize: s.headingMax, minFontSize: s.headingMin, lineHeight: HEADING_LINE_HEIGHT }) ??
          { fontSize: s.headingMin, lines: wrapLines(text, s.headingMin, textWidth) ?? [text] };
        laid = { type: "heading", lines: fit.lines.length, fontSize: fit.fontSize, text };
        height = fit.lines.length * fit.fontSize * HEADING_LINE_HEIGHT;
      } else if (block.type === "details") {
        const items = block.items.filter((it) => it.text.trim()).map((it) => ({ icon: it.icon, text: typo(it.text) }));
        // Taille commune, réduite si une ligne ne tient pas en largeur (pictogramme compris).
        const size = Math.min(...items.map((it) => singleLineSize(it.text, s.details, textWidth - s.details * 1.6)), s.details);
        laid = { type: "details", fontSize: size, items };
        height = items.length * size * DETAIL_ROW;
      } else {
        const text = typo(block.text);
        // Appel à l'action bien visible : jusqu'à 2 lignes plutôt qu'une police trop petite.
        const maxWidth = textWidth * 0.9 - s.cta * 2;
        const fit =
          fitText(text, { maxWidth, maxHeight: s.cta * CTA_LINE_HEIGHT * 2, maxFontSize: s.cta, minFontSize: Math.round(s.cta * 0.6), lineHeight: CTA_LINE_HEIGHT }) ??
          { fontSize: Math.round(s.cta * 0.6), lines: wrapLines(text, Math.round(s.cta * 0.6), maxWidth) ?? [text] };
        laid = { type: "cta", fontSize: fit.fontSize, lines: fit.lines.length, text };
        height = ctaHeight(fit.fontSize, fit.lines.length);
      }
      fixed.push(laid);
      fixedHeight += height + s.gapLg * 0.6;
    });

    const words = (blocks: LaidBlock[]) =>
      blocks.reduce(
        (n, b) => n + (b.type === "details" ? b.items.reduce((m, it) => m + wordCount(it.text), 0) : wordCount(b.text)),
        0,
      );

    if (!body) {
      const blocks = fixed;
      screens.push({ blocks, footer: screenFooter, words: words(blocks) });
      continue;
    }

    // Texte principal : réparti sur autant d'écrans que nécessaire. Les blocs
    // placés avant lui restent sur le premier écran, ceux placés après et le
    // pied d'écran sur le dernier.
    const b = body as Extract<ScreenBlock, { type: "body" }>;
    const before = fixed.slice(0, screen.blocks.slice(0, bodyIndex).filter((x) => x.type !== "body").length);
    const after = fixed.slice(before.length);
    const bodyHeight = Math.max(stageHeight * 0.3, stageHeight - fixedHeight - footerHeight);
    const text = b.quote ? frenchQuote(typo(b.text)) : typo(b.text);
    const pagination = paginateText(text, {
      maxWidth: textWidth,
      maxHeight: bodyHeight,
      maxFontSize: s.bodyMax,
      minFontSize: s.bodyMin,
      readableFontSize: s.bodyReadable,
      maxWordsPerPage: s.maxWords,
      lineHeight: LINE_HEIGHT,
    });
    pagination.pages.forEach((page, i) => {
      const last = i === pagination.pages.length - 1;
      const blocks: LaidBlock[] = [
        ...(i === 0 ? before : []),
        { type: "body", fontSize: pagination.fontSize, text: page },
        ...(last ? after : []),
      ];
      screens.push({ blocks, footer: last ? screenFooter : null, words: words(blocks) });
    });
  }

  // Minutage : calé mot à mot sur la voix off si elle est synchronisée, sinon selon la longueur du texte.
  const script = narrationScript(screens);
  const sync = voice ? activeSync(voice, script) : null;
  const synced =
    voice && sync
      ? computeSyncedTiming({ voice, sync, script, screenCount: screens.length, fps: BRAND.fps, introSeconds: 0.3, endCardSeconds: BRAND.endCardSeconds })
      : null;
  const timing =
    synced?.timing ??
    computeSequenceTiming({
      fps: BRAND.fps,
      segmentSeconds: screens.map((sc) => screenSeconds(sc.words, sc.blocks.some((bl) => bl.type === "body"))),
      introSeconds: 0.3,
      endCardSeconds: BRAND.endCardSeconds,
      durationSeconds,
      minSegmentSeconds: 2.5,
    });

  // Placement vertical : bloc compact (hauteur du plus haut écran), centré sur
  // l'image pour un équilibre visuel, mais toujours entièrement dans la zone sûre.
  const partial = { sizes: s, textWidth, referenceGap };
  const stageUsed = Math.min(stageHeight, Math.ceil(Math.max(...screens.map((sc) => screenHeight(sc, partial)))));
  const footerUsed = persistentFooter
    ? referenceMargin(partial, screens.at(-1)?.blocks.at(-1), persistentFooter.fontSize) + persistentFooter.fontSize * LABEL_LINE_HEIGHT
    : 0;
  const groupHeight = Math.ceil(header + s.gapLg + stageUsed + footerUsed);
  const centered = (f.height - groupHeight) / 2;
  const top = Math.round(Math.min(Math.max(centered, box.y), box.y + box.height - groupHeight));

  return {
    format,
    width: f.width,
    height: f.height,
    box,
    sizes: s,
    textWidth,
    kicker,
    persistentFooter,
    accent: BRAND.themes[spec.theme].accent,
    stageHeight,
    stageUsed,
    referenceGap,
    group: { top, height: groupHeight },
    screens,
    timing,
    script,
    sync: synced ? { style: synced.style, words: synced.words } : null,
  };
}

/** Hauteur occupée par un écran (pour vérifier qu'il tient dans la scène). */
export function screenHeight(screen: LaidScreen, layout: Pick<ReelLayout, "sizes" | "textWidth" | "referenceGap">): number {
  const s = layout.sizes;
  let h = 0;
  screen.blocks.forEach((b, i) => {
    if (i > 0) h += blockGap(s);
    if (b.type === "heading") h += b.lines * b.fontSize * HEADING_LINE_HEIGHT;
    else if (b.type === "details") h += b.items.length * b.fontSize * DETAIL_ROW;
    else if (b.type === "cta") h += ctaHeight(b.fontSize, b.lines);
    else {
      const lines = fitText(b.text, { maxWidth: layout.textWidth, maxHeight: Infinity, maxFontSize: b.fontSize, minFontSize: b.fontSize, lineHeight: LINE_HEIGHT })?.lines.length ?? Infinity;
      h += lines * b.fontSize * LINE_HEIGHT;
    }
  });
  if (screen.footer) h += referenceMargin(layout, screen.blocks.at(-1), screen.footer.fontSize) + screen.footer.fontSize * LABEL_LINE_HEIGHT;
  return h;
}

/** Espace entre deux blocs d'un même écran. */
export function blockGap(s: Pick<Sizes, "gapLg">): number {
  return s.gapLg * 0.6;
}

export function ctaHeight(fontSize: number, lines: number): number {
  return fontSize * (lines * CTA_LINE_HEIGHT + 2 * CTA_PADDING);
}

/** Durée d'apparition mot par mot d'un texte (bornée à 45 % de la durée de l'écran). */
export function revealFramesFor(text: string, segmentFrames: number): number {
  return Math.round(Math.min(segmentFrames * 0.45, wordCount(text) * 4 + 14));
}
