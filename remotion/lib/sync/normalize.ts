import { numberToWords, type SyncLanguage } from "./numbers";

/**
 * Mot affiché (ou reconnu par Whisper) → petits mots comparables : minuscules,
 * sans accents ni ponctuation, apostrophes et traits d'union découpés, nombres
 * écrits en toutes lettres. « l’Éternel » → [l, eternel] ; « 3:16 » →
 * [trois, seize] ; « M’ap » → [m, ap].
 */
export function normalizeTokens(word: string, language: SyncLanguage): string[] {
  const plain = word
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    // Apostrophes, traits d'union, séparateurs de références (3:16, 8-10, 3.16) : coupures.
    .replace(/[’'`ʼ‘\-–—:./,;]/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, " ");

  const tokens: string[] = [];
  for (const part of plain.split(" ")) {
    if (!part) continue;
    // Chiffres collés à des lettres (« 2e », « 10h ») : séparés.
    for (const piece of part.match(/\p{N}+|\p{L}+/gu) ?? []) {
      if (/^\p{N}+$/u.test(piece)) {
        const words = numberToWords(Number.parseInt(piece, 10), language);
        if (words) tokens.push(...words.map((w) => w.normalize("NFD").replace(/\p{M}/gu, "")));
        else tokens.push(piece);
      } else {
        tokens.push(piece);
      }
    }
  }
  return tokens;
}

/** Ressemblance de deux mots normalisés (1 = identiques, 0 = rien en commun). */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}
