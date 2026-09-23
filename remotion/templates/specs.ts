import { BRAND } from "../brand";
import type { ReelSpec, ScreenSpec } from "../engine/types";
import { durationFittedToVoice } from "../lib/audio";
import { formatEventDate, formatEventTime } from "../lib/dates";
import type { CitationProps, DevotionProps, EvenementProps, PriereProps, VersetProps, VoiceOverProps } from "../schemas";

/**
 * Chaque template = une fonction pure props → écrans. Le moteur commun
 * (engine/) s'occupe de la mise en page, du minutage et des animations.
 */

const withVersion = (reference: string, showVersion: boolean) => (showVersion ? `${reference} · LSG 1910` : reference);

/** Durée effective : calée sur la voix off si demandé, sinon imposée ou automatique (null). */
export function effectiveDuration(p: { durationSeconds: number | null; voiceOver: VoiceOverProps | null }): number | null {
  return durationFittedToVoice(p.voiceOver, BRAND.endCardSeconds) ?? p.durationSeconds;
}

export function versetSpec(p: VersetProps): ReelSpec {
  return {
    kicker: p.kicker,
    persistentFooter: withVersion(p.reference, p.showVersion),
    screens: [{ blocks: [{ type: "body", text: p.text, quote: true }] }],
  };
}

export function priereSpec(p: PriereProps): ReelSpec {
  const screens: ScreenSpec[] = [
    // Accroche : le titre seul, en grand, dès la première seconde.
    { blocks: [{ type: "heading", text: p.title }] },
    { blocks: [{ type: "body", text: p.text }] },
  ];
  if (p.verseReference && p.verseText) {
    screens.push({ blocks: [{ type: "body", text: p.verseText, quote: true }], footer: withVersion(p.verseReference, p.showVersion) });
  }
  return { kicker: p.kicker, persistentFooter: null, screens };
}

export function devotionSpec(p: DevotionProps): ReelSpec {
  const screens: ScreenSpec[] = [
    { blocks: [{ type: "heading", text: p.title }] },
    { blocks: [{ type: "body", text: p.verseText, quote: true }], footer: withVersion(p.verseReference, p.showVersion) },
    { blocks: [{ type: "body", text: p.reflection }] },
  ];
  if (p.callToAction.trim()) screens.push({ blocks: [{ type: "cta", text: p.callToAction }] });
  return { kicker: p.kicker, persistentFooter: null, screens };
}

export function citationSpec(p: CitationProps): ReelSpec {
  return {
    kicker: p.kicker,
    persistentFooter: `— ${p.author}`,
    screens: [{ blocks: [{ type: "body", text: p.quote, quote: true }] }],
  };
}

export function evenementSpec(p: EvenementProps): ReelSpec {
  const details = [
    { icon: "date" as const, text: formatEventDate(p.date) },
    { icon: "time" as const, text: formatEventTime(p.time) },
    { icon: "place" as const, text: p.place },
  ].filter((d) => d.text.trim());

  const screens: ScreenSpec[] = [{ blocks: [{ type: "heading", text: p.name }] }];
  if (details.length > 0) screens.push({ blocks: [{ type: "details", items: details }] });
  if (p.description.trim()) screens.push({ blocks: [{ type: "body", text: p.description }] });
  if (p.callToAction.trim()) screens.push({ blocks: [{ type: "cta", text: p.callToAction }] });
  return { kicker: p.kicker, persistentFooter: null, screens };
}
