import type { ContentType } from "@prisma/client";
import { BRAND } from "@reels/brand";
import type { ThemeId } from "@reels/engine/types";
import type { CitationProps, DevotionProps, PriereProps, VersetProps } from "@reels/schemas";
import { label } from "@reels/lib/i18n";
import { defaultBackground, type AnyTemplateProps, type TemplateId } from "@reels/template-meta";

/**
 * « Transformer en Reel » : quel template utiliser pour chaque type de contenu
 * du CMS, et comment préremplir ses champs. Logique pure (testée).
 *
 * Un type absent de REEL_SOURCES affiche un bouton « Fonction en
 * développement ».
 */

export type ReelSourceType = Extract<ContentType, "VERSE" | "DEVOTION" | "PRAYER" | "INSPIRATION" | "TESTIMONY" | "ARTICLE">;

export type ReelDraft = { title: string; templateId: TemplateId; props: AnyTemplateProps };

/** Types de contenu transformables, et le template utilisé. */
export const REEL_SOURCES: Partial<Record<ReelSourceType, { templateId: TemplateId; label: string }>> = {
  VERSE: { templateId: "Verset", label: "Verset du jour → template Verset" },
  DEVOTION: { templateId: "Devotion", label: "Dévotion → template Dévotion" },
  PRAYER: { templateId: "Priere", label: "Prière → template Prière" },
  INSPIRATION: { templateId: "Citation", label: "Inspiration → template Citation" },
  TESTIMONY: { templateId: "Citation", label: "Témoignage → template Citation" },
};

/** Pourquoi un type n'est pas encore transformable (affiché à côté du bouton désactivé). */
export const REEL_SOURCES_PENDING: Partial<Record<ReelSourceType, string>> = {
  ARTICLE: "Pas de template adapté aux articles pour l'instant.",
};

const common = (theme: ThemeId) => ({
  format: "9:16" as const,
  background: defaultBackground(theme),
  durationSeconds: null,
  music: null,
  voiceOver: null,
  language: "fr" as const,
});

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/**
 * Raccourcit un texte trop long pour le template en coupant après la dernière
 * phrase complète qui tient (sinon au dernier mot entier, avec « … »).
 */
export function clipToSentences(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const head = clean.slice(0, max);
  const lastEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "), head.lastIndexOf("… "));
  if (lastEnd > max * 0.4) return head.slice(0, lastEnd + 1).trim();
  return `${head.slice(0, head.lastIndexOf(" ", max - 1)).trimEnd()}…`;
}

export function draftFromVerse(
  verse: { reference: string; text: string; date: Date },
  opts: { formattedReference: string | null; isLsg1910: boolean },
): ReelDraft {
  const day = verse.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const reference = opts.formattedReference ?? verse.reference;
  const props: VersetProps = {
    ...common("Verset"),
    kicker: label("fr", "kickerVersetDuJour"),
    reference: reference.trim(),
    text: clipToSentences(verse.text, 1500),
    showVersion: opts.isLsg1910,
  };
  return { title: clip(`Verset du jour — ${reference} (${day})`, 120), templateId: "Verset", props };
}

export function draftFromDevotion(
  devotion: { title: string; mainVerseRef: string; mainVerseText: string; reflection: string },
  opts: { formattedReference: string | null; isLsg1910: boolean },
): ReelDraft {
  const props: DevotionProps = {
    ...common("Devotion"),
    kicker: label("fr", "kickerDevotion"),
    title: clip(devotion.title.trim(), 80),
    verseReference: (opts.formattedReference ?? devotion.mainVerseRef).trim(),
    verseText: clipToSentences(devotion.mainVerseText, 600),
    reflection: clipToSentences(devotion.reflection, 1200),
    callToAction: label("fr", "ctaDevotion"),
    showVersion: opts.isLsg1910,
  };
  return { title: clip(`Dévotion — ${devotion.title}`, 120), templateId: "Devotion", props };
}

export function draftFromPrayer(prayer: { title: string; content: string }): ReelDraft {
  const props: PriereProps = {
    ...common("Priere"),
    kicker: label("fr", "kickerPriere"),
    title: clip(prayer.title.trim(), 80),
    text: clipToSentences(prayer.content, 1500),
    verseReference: "",
    verseText: "",
    showVersion: true,
  };
  return { title: clip(`Prière — ${prayer.title}`, 120), templateId: "Priere", props };
}

export function draftFromQuote(
  kind: "INSPIRATION" | "TESTIMONY",
  content: { title: string; text: string; author: string | null },
): ReelDraft {
  const kicker = label("fr", kind === "INSPIRATION" ? "kickerInspiration" : "kickerTemoignage");
  const props: CitationProps = {
    ...common("Citation"),
    kicker,
    quote: clipToSentences(content.text, 800),
    author: clip((content.author ?? "").trim() || BRAND.name, 60),
  };
  return { title: clip(`${kicker} — ${content.title}`, 120), templateId: "Citation", props };
}

/**
 * Le texte saisi dans le CMS est-il bien celui de la LSG 1910 ? On compare en
 * ignorant la casse, la ponctuation et les espaces : « LSG 1910 » n'est
 * affiché sur le Reel que si c'est le cas (jamais d'attribution erronée).
 */
export function sameBibleText(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  return norm(a).length > 0 && norm(a) === norm(b);
}

/** Libellé et page d'administration du contenu d'origine d'un Reel. */
export const SOURCE_INFO: Record<ReelSourceType, { label: string; adminPath: string }> = {
  VERSE: { label: "Verset du jour", adminPath: "/admin/versets" },
  DEVOTION: { label: "Dévotion", adminPath: "/admin/devotions" },
  PRAYER: { label: "Prière", adminPath: "/admin/prieres" },
  INSPIRATION: { label: "Inspiration", adminPath: "/admin/inspirations" },
  TESTIMONY: { label: "Témoignage", adminPath: "/admin/temoignages" },
  ARTICLE: { label: "Article", adminPath: "/admin/articles" },
};

export function isReelSourceType(value: string): value is ReelSourceType {
  return Object.prototype.hasOwnProperty.call(SOURCE_INFO, value);
}

/** Filtre « ?source=VERSE:<id> » de la liste des Reels. */
export function parseSourceFilter(value: string | undefined): { sourceType: ReelSourceType; sourceId: string } | null {
  const m = /^([A-Z]+):([A-Za-z0-9_-]{1,64})$/.exec(value ?? "");
  if (!m || !isReelSourceType(m[1])) return null;
  return { sourceType: m[1], sourceId: m[2] };
}
