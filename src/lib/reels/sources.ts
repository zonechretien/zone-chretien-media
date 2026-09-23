import type { ContentType } from "@prisma/client";
import { BRAND } from "@reels/brand";
import type { VersetProps } from "@reels/schemas";
import type { TemplateId } from "@reels/template-meta";

/**
 * « Transformer en Reel » : quel template utiliser pour chaque type de contenu
 * du CMS, et comment préremplir ses champs. Logique pure (testée).
 *
 * Un type absent de REEL_SOURCES affiche un bouton « Fonction en
 * développement » : son template (Prière, Citation…) arrive à l'étape 7.
 */

export type ReelSourceType = Extract<ContentType, "VERSE" | "DEVOTION" | "PRAYER" | "INSPIRATION" | "TESTIMONY" | "ARTICLE">;

export type ReelDraft = { title: string; templateId: TemplateId; props: VersetProps };

/** Types de contenu déjà transformables, et le template utilisé. */
export const REEL_SOURCES: Partial<Record<ReelSourceType, { templateId: TemplateId; label: string }>> = {
  VERSE: { templateId: "Verset", label: "Verset du jour → template Verset" },
  DEVOTION: { templateId: "Verset", label: "Verset principal de la dévotion → template Verset" },
};

/** Pourquoi un type n'est pas encore transformable (affiché à côté du bouton désactivé). */
export const REEL_SOURCES_PENDING: Partial<Record<ReelSourceType, string>> = {
  PRAYER: "Template Prière (en développement).",
  INSPIRATION: "Template Citation (en développement).",
  TESTIMONY: "Template Citation (en développement).",
  ARTICLE: "Pas de template adapté aux articles pour l'instant.",
};

function versetProps(reference: string, text: string, kicker: string, showVersion: boolean): VersetProps {
  return {
    format: "9:16",
    background: { type: "gradient", from: BRAND.colors.navyLight, to: BRAND.colors.navyDeep },
    durationSeconds: null,
    kicker,
    reference: reference.trim(),
    text: text.trim(),
    showVersion,
    music: null,
    voiceOver: null,
  };
}

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

export function draftFromVerse(
  verse: { reference: string; text: string; date: Date },
  opts: { formattedReference: string | null; isLsg1910: boolean },
): ReelDraft {
  const day = verse.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const reference = opts.formattedReference ?? verse.reference;
  return {
    title: clip(`Verset du jour — ${reference} (${day})`, 120),
    templateId: "Verset",
    props: versetProps(reference, verse.text, "Verset du jour", opts.isLsg1910),
  };
}

export function draftFromDevotion(
  devotion: { title: string; mainVerseRef: string; mainVerseText: string },
  opts: { formattedReference: string | null; isLsg1910: boolean },
): ReelDraft {
  const reference = opts.formattedReference ?? devotion.mainVerseRef;
  return {
    title: clip(`Dévotion — ${devotion.title}`, 120),
    templateId: "Verset",
    props: versetProps(reference, devotion.mainVerseText, "Dévotion du jour", opts.isLsg1910),
  };
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
