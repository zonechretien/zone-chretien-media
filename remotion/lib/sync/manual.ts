import type { ScriptSentence } from "./script";

/**
 * Calage manuel (logique pure) : l'utilisateur fixe le début de chaque phrase
 * en écoutant la voix off. Les mots de chaque phrase suivent :
 * - s'il existe un minutage automatique, son rythme est conservé (déplacé,
 *   et resserré seulement si la phrase n'a plus la place) ;
 * - sinon, les mots sont répartis selon leur longueur, à un débit de lecture
 *   ordinaire, sans déborder sur la phrase suivante.
 */

export type WordSpan = [start: number, end: number];

/** Débit de lecture ordinaire (secondes par lettre, ~2,5 mots par seconde). */
export const SECONDS_PER_LETTER = 0.075;

const letters = (w: string) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, "").length);
const round = (x: number) => Math.round(x * 1000) / 1000;

/** Début de chaque phrase d'après un minutage mot à mot. */
export function sentenceStarts(words: WordSpan[], sentences: ScriptSentence[]): number[] {
  return sentences.map((s) => words[s.first]?.[0] ?? 0);
}

export function retimeFromSentences(o: {
  scriptWords: string[];
  sentences: ScriptSentence[];
  /** Début de chaque phrase (secondes depuis le début du fichier), croissants. */
  starts: number[];
  /** Fin de la parole (secondes) : borne de la dernière phrase. */
  speechEnd: number;
  /** Minutage automatique précédent (même texte), ou null. */
  base: WordSpan[] | null;
}): WordSpan[] {
  const out: WordSpan[] = o.scriptWords.map(() => [0, 0]);
  o.sentences.forEach((s, k) => {
    const start = o.starts[k];
    const limit = k + 1 < o.sentences.length ? Math.max(start, o.starts[k + 1] - 0.05) : Math.max(start, o.speechEnd);
    const idx = Array.from({ length: s.last - s.first + 1 }, (_, i) => s.first + i);

    if (o.base) {
      const oa = o.base[s.first][0];
      const ob = o.base[s.last][1];
      const natural = Math.max(0.01, ob - oa);
      const scale = Math.min(1, (limit - start) / natural);
      for (const i of idx) out[i] = [round(start + (o.base[i][0] - oa) * scale), round(start + (o.base[i][1] - oa) * scale)];
      return;
    }

    const total = idx.reduce((n, i) => n + letters(o.scriptWords[i]), 0);
    const span = Math.min(limit - start, total * SECONDS_PER_LETTER);
    let cursor = start;
    for (const i of idx) {
      const d = (span * letters(o.scriptWords[i])) / total;
      out[i] = [round(cursor), round(cursor + d)];
      cursor += d;
    }
  });
  return out;
}
