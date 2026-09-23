import { BRAND } from "../brand";
import { FORMATS, contentBox, type FormatId } from "../formats";
import { fitText, paginateText, type Pagination } from "../lib/text-fit";
import { durationFittedToVoice } from "../lib/audio";
import { computeSequenceTiming, readingSeconds, type SequenceTiming } from "../lib/timing";
import { frenchQuote, frenchTypography } from "../lib/typography";
import type { VersetProps } from "../schemas";

/** Tailles de base par format (en px, dans le repère de la vidéo). */
const SIZES: Record<FormatId, { brand: number; kicker: number; reference: number; gapSm: number; gapLg: number; textMax: number; textReadable: number; textMin: number; maxWords: number }> = {
  "9:16": { brand: 30, kicker: 34, reference: 44, gapSm: 26, gapLg: 56, textMax: 88, textReadable: 58, textMin: 50, maxWords: 26 },
  "1:1": { brand: 24, kicker: 28, reference: 36, gapSm: 18, gapLg: 36, textMax: 70, textReadable: 46, textMin: 40, maxWords: 22 },
  "16:9": { brand: 24, kicker: 28, reference: 38, gapSm: 18, gapLg: 36, textMax: 78, textReadable: 50, textMin: 42, maxWords: 30 },
};

export const LINE_HEIGHT = 1.34;
const LABEL_LINE_HEIGHT = 1.3;
/** Espacement des lettres des libellés en capitales (en em). */
export const KICKER_TRACKING = 0.2;

export type VersetLayout = {
  width: number;
  height: number;
  box: ReturnType<typeof contentBox>;
  sizes: (typeof SIZES)[FormatId];
  kickerSize: number;
  referenceSize: number;
  referenceLabel: string;
  textAreaHeight: number;
  pagination: Pagination;
  timing: SequenceTiming;
};

/** Taille d'un libellé sur une seule ligne, réduite si nécessaire pour tenir en largeur. */
function singleLineSize(text: string, maxSize: number, maxWidth: number, extraEmPerChar = 0): number {
  const chars = [...text].length;
  const fit = fitText(text, { maxWidth: maxWidth - chars * extraEmPerChar * maxSize, maxHeight: maxSize * LABEL_LINE_HEIGHT, maxFontSize: maxSize, minFontSize: Math.round(maxSize * 0.55), lineHeight: LABEL_LINE_HEIGHT });
  return fit ? fit.fontSize : Math.round(maxSize * 0.55);
}

export function computeVersetLayout(p: VersetProps): VersetLayout {
  const format = FORMATS[p.format];
  const box = contentBox(p.format);
  const sizes = SIZES[p.format];

  const kickerSize = p.kicker ? singleLineSize(frenchTypography(p.kicker).toUpperCase(), sizes.kicker, box.width, KICKER_TRACKING) : 0;
  const referenceLabel = frenchTypography(`${p.reference}${p.showVersion ? " · LSG 1910" : ""}`);
  const referenceSize = singleLineSize(referenceLabel, sizes.reference, box.width);

  const header =
    sizes.brand * LABEL_LINE_HEIGHT + (kickerSize ? sizes.gapSm + kickerSize * LABEL_LINE_HEIGHT : 0) + sizes.gapSm + 3;
  const footer = referenceSize * LABEL_LINE_HEIGHT;
  const textAreaHeight = Math.floor((box.height - header - footer - 2 * sizes.gapLg) * 0.97);

  const pagination = paginateText(frenchQuote(frenchTypography(p.text)), {
    maxWidth: box.width,
    maxHeight: textAreaHeight,
    maxFontSize: sizes.textMax,
    minFontSize: sizes.textMin,
    readableFontSize: sizes.textReadable,
    maxWordsPerPage: sizes.maxWords,
    lineHeight: LINE_HEIGHT,
  });

  const timing = computeSequenceTiming({
    fps: BRAND.fps,
    segmentSeconds: pagination.pages.map((page) => readingSeconds(page.split(" ").length)),
    introSeconds: 0.3,
    endCardSeconds: BRAND.endCardSeconds,
    // Durée calée sur la voix off si demandé, sinon durée imposée ou automatique.
    durationSeconds: durationFittedToVoice(p.voiceOver, BRAND.endCardSeconds) ?? p.durationSeconds,
    minSegmentSeconds: 2.5,
  });

  return {
    width: format.width,
    height: format.height,
    box,
    sizes,
    kickerSize,
    referenceSize,
    referenceLabel,
    textAreaHeight,
    pagination,
    timing,
  };
}

/** Durée d'apparition mot par mot d'un écran (bornée à 45 % de sa durée). */
export function revealFramesFor(page: string, segmentFrames: number): number {
  const words = page.split(" ").length;
  return Math.round(Math.min(segmentFrames * 0.45, words * 4 + 14));
}
