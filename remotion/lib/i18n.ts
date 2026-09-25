import type { ReelLanguage } from "../schemas";

/**
 * Libellés fixes des Reels en français et en créole haïtien (traductions
 * relues et validées par Zone-Chrétien). Les textes d'exemple des templates
 * restent en français ; la devise « Inspiré par la foi, animé par la Parole »
 * reste en français dans les deux langues (brand.ts).
 */

export type LabelKey =
  | "kickerVerset"
  | "kickerVersetDuJour"
  | "kickerPriere"
  | "kickerDevotion"
  | "kickerCitation"
  | "kickerInspiration"
  | "kickerTemoignage"
  | "kickerEvenement"
  | "ctaDevotion"
  | "ctaRejoindre"
  | "ctaEvenement";

export const LABELS: Record<ReelLanguage, Record<LabelKey, string>> = {
  fr: {
    kickerVerset: "Parole du jour",
    kickerVersetDuJour: "Verset du jour",
    kickerPriere: "Prions ensemble",
    kickerDevotion: "Dévotion du jour",
    kickerCitation: "Citation",
    kickerInspiration: "Inspiration",
    kickerTemoignage: "Témoignage",
    kickerEvenement: "Événement",
    ctaDevotion: "Lis la dévotion sur zone-chretien.org",
    ctaRejoindre: "Rejoins-nous sur zone-chretien.org",
    ctaEvenement: "Entrée libre — viens avec tes amis !",
  },
  ht: {
    kickerVerset: "Pawòl jounen an",
    kickerVersetDuJour: "Vèsè jounen an",
    kickerPriere: "Ann priye ansanm",
    kickerDevotion: "Devosyon jounen an",
    kickerCitation: "Sitasyon",
    kickerInspiration: "Enspirasyon",
    kickerTemoignage: "Temwayaj",
    kickerEvenement: "Evènman",
    ctaDevotion: "Li devosyon an sou zone-chretien.org",
    ctaRejoindre: "Vin jwenn nou sou zone-chretien.org",
    ctaEvenement: "Antre gratis — vini ak zanmi w !",
  },
};

export const label = (language: ReelLanguage, key: LabelKey) => LABELS[language][key];

/**
 * Changement de langue d'un projet : l'accroche et l'appel à l'action sont
 * traduits s'ils sont encore un libellé par défaut de l'autre langue ; un
 * texte saisi par l'utilisateur n'est jamais modifié.
 */
export function translateDefaultLabels<T extends Record<string, unknown>>(data: T, from: ReelLanguage, to: ReelLanguage): T {
  if (from === to) return data;
  const out: Record<string, unknown> = { ...data };
  for (const field of ["kicker", "callToAction"]) {
    const value = out[field];
    if (typeof value !== "string") continue;
    const key = (Object.keys(LABELS[from]) as LabelKey[]).find((k) => LABELS[from][k] === value.trim());
    if (key) out[field] = LABELS[to][key];
  }
  return out as T;
}

// ---------------------------------------------------------------------------
// Dates et heures (écrites à la main, sans Intl : aperçu et rendu identiques)
// ---------------------------------------------------------------------------

const DAYS: Record<ReelLanguage, string[]> = {
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  ht: ["Dimanch", "Lendi", "Madi", "Mèkredi", "Jedi", "Vandredi", "Samdi"],
};
const MONTHS: Record<ReelLanguage, string[]> = {
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  ht: ["janvye", "fevriye", "mas", "avril", "me", "jen", "jiyè", "out", "septanm", "oktòb", "novanm", "desanm"],
};
const FIRST: Record<ReelLanguage, string> = { fr: "1er", ht: "1ye" };

/** « 2026-10-12 » → « Lundi 12 octobre 2026 » / « Lendi 12 oktòb 2026 » (« 1er » / « 1ye » le premier du mois). */
export function formatEventDate(iso: string, language: ReelLanguage = "fr"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${DAYS[language][date.getUTCDay()]} ${day === 1 ? FIRST[language] : day} ${MONTHS[language][month - 1]} ${year}`;
}

/** Heures du soir en créole (« 7è30 nan aswè ») : de 18 h à 23 h 59. */
const EVENING_FROM = 18;

/**
 * « 19:30 » → « 19 h 30 » (français) ; en créole, « 7è30 nan aswè » le soir,
 * « 9 h 30 » aux autres heures. « 09:00 » → « 9 h ».
 */
export function formatEventTime(hhmm: string, language: ReelLanguage = "fr"): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return "";
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 23 || min > 59) return "";
  const mm = String(min).padStart(2, "0");
  if (language === "ht" && h >= EVENING_FROM) return `${h - 12}è${min === 0 ? "" : mm} nan aswè`;
  return min === 0 ? `${h} h` : `${h} h ${mm}`;
}
