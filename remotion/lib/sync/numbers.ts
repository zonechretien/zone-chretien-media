/**
 * Nombres écrits en toutes lettres (français et créole haïtien), pour que
 * l'alignement reconnaisse « Jean 3:16 » lu « Jean trois seize » ou « Jan twa
 * sèz », et les chiffres que Whisper écrit à la place des mots (« 3 16 »).
 * Seuls les mots comptent (pas de traits d'union) : l'alignement compare des
 * mots normalisés, sans accents.
 */

export type SyncLanguage = "fr" | "ht";

const FR_UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const FR_TENS: Record<number, string> = { 20: "vingt", 30: "trente", 40: "quarante", 50: "cinquante", 60: "soixante" };

function frBelow100(n: number): string[] {
  if (n <= 16) return [FR_UNITS[n]];
  if (n < 20) return ["dix", FR_UNITS[n - 10]];
  if (n < 70) {
    const tens = Math.floor(n / 10) * 10;
    const unit = n % 10;
    if (unit === 0) return [FR_TENS[tens]];
    if (unit === 1) return [FR_TENS[tens], "et", "un"];
    return [FR_TENS[tens], FR_UNITS[unit]];
  }
  if (n < 80) return n === 71 ? ["soixante", "et", "onze"] : ["soixante", ...frBelow100(n - 60)];
  if (n === 80) return ["quatre", "vingts"];
  return ["quatre", "vingt", ...frBelow100(n - 80)];
}

function frWords(n: number): string[] {
  if (n < 100) return frBelow100(n);
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const head = h === 1 ? ["cent"] : [FR_UNITS[h], rest === 0 ? "cents" : "cent"];
    return rest === 0 ? head : [...head, ...frBelow100(rest)];
  }
  const t = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = t === 1 ? ["mille"] : [...frWords(t), "mille"];
  return rest === 0 ? head : [...head, ...frWords(rest)];
}

// Créole haïtien : orthographe officielle (1979), la plus courante dans les Bibles et la presse.
const HT_UNITS = ["zewo", "en", "de", "twa", "kat", "senk", "sis", "sèt", "uit", "nèf", "dis", "onz", "douz", "trèz", "katòz", "kenz", "sèz", "disèt", "dizuit", "diznèf"];
const HT_TENS: Record<number, string> = { 20: "ven", 30: "trant", 40: "karant", 50: "senkant", 60: "swasant" };
/** Dizaines suivies d'une unité : « vennde », « trannde »… (forme liée). */
const HT_TENS_LINKED: Record<number, string> = { 20: "venn", 30: "trann", 40: "karann", 50: "senkann", 60: "swasann" };

function htBelow100(n: number): string[] {
  if (n < 20) return [HT_UNITS[n]];
  if (n >= 70 && n < 80) return [`swasann${HT_UNITS[n - 60]}`];
  if (n === 80) return ["katreven"];
  if (n > 80) return [`katreven${HT_UNITS[n - 80]}`];
  const tens = Math.floor(n / 10) * 10;
  const unit = n % 10;
  if (unit === 0) return [HT_TENS[tens]];
  if (unit === 1) return [`${HT_TENS[tens]}teyen`];
  return [`${HT_TENS_LINKED[tens]}${HT_UNITS[unit]}`];
}

function htWords(n: number): string[] {
  if (n < 100) return htBelow100(n);
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const head = h === 1 ? ["san"] : [HT_UNITS[h], "san"];
    return rest === 0 ? head : [...head, ...htBelow100(rest)];
  }
  const t = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = t === 1 ? ["mil"] : [...htWords(t), "mil"];
  return rest === 0 ? head : [...head, ...htWords(rest)];
}

/** Nombre entier en toutes lettres (liste de mots), ou null au-delà de 999 999. */
export function numberToWords(n: number, language: SyncLanguage): string[] | null {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) return null;
  return language === "ht" ? htWords(n) : frWords(n);
}
