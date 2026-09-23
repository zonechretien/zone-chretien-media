/**
 * Ajustement du texte sans mesure DOM : logique pure, testable, identique dans
 * l'aperçu du CMS et au rendu (donc même découpage des écrans des deux côtés).
 *
 * La largeur de chaque caractère est estimée (en « em ») de façon volontairement
 * pessimiste : on préfère un texte un peu plus petit qu'un texte qui déborde.
 */

const NARROW = new Set([..."iljıI'’.,:;!|·"]);
const SEMI_NARROW = new Set([..."ftr()[]-–«»\"“”"]);
const WIDE = new Set([..."mwMWŒœÆæ"]);

/** Espaces « ordinaires » où une ligne peut être coupée. Les espaces insécables
 * (U+00A0, U+202F de la typographie française) n'en font pas partie : `\s` les
 * inclurait, d'où cette classe explicite. */
const ORDINARY_SPACES = /[ \t\r\n]+/g;

/** Marge de sécurité appliquée à toutes les estimations de largeur. */
const SAFETY = 1.08;

export function estimateCharWidthEm(ch: string): number {
  if (ch === " " || ch === "\u00A0" || ch === "\u202F") return 0.26;
  if (NARROW.has(ch)) return 0.3;
  if (SEMI_NARROW.has(ch)) return 0.4;
  if (WIDE.has(ch)) return 0.88;
  if (/[0-9]/.test(ch)) return 0.58;
  if (ch !== ch.toLowerCase()) return 0.72; // majuscule (accentuée ou non)
  return 0.54;
}

export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) em += estimateCharWidthEm(ch);
  return em * fontSize * SAFETY;
}

/** Découpe en lignes (mots entiers) ; null si un mot seul dépasse la largeur. */
export function wrapLines(text: string, fontSize: number, maxWidth: number): string[] | null {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (estimateTextWidth(word, fontSize) > maxWidth) return null;
    const candidate = current ? `${current} ${word}` : word;
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export type FitOptions = {
  maxWidth: number;
  maxHeight: number;
  maxFontSize: number;
  minFontSize: number;
  lineHeight: number;
};

/** Plus grande taille de police (pas de 2 px) pour laquelle le texte tient dans la boîte. */
export function fitText(text: string, o: FitOptions): { fontSize: number; lines: string[] } | null {
  for (let size = o.maxFontSize; size >= o.minFontSize; size -= 2) {
    const lines = wrapLines(text, size, o.maxWidth);
    if (lines && lines.length * size * o.lineHeight <= o.maxHeight) return { fontSize: size, lines };
  }
  return null;
}


export function wordCount(text: string): number {
  return text.split(" ").filter(Boolean).length;
}

/** Phrases (ponctuation forte conservée en fin de phrase). */
export function splitSentences(text: string): string[] {
  return text
    .replace(ORDINARY_SPACES, " ")
    .trim()
    .split(/(?<=[.!?;:»])[ ]+/)
    .filter(Boolean);
}

/** Propositions (coupure après les virgules), pour les phrases trop longues. */
export function splitClauses(sentence: string): string[] {
  return sentence.split(/(?<=,)[ ]+/).filter(Boolean);
}

export type PaginateOptions = FitOptions & {
  /** En dessous de cette taille, on préfère passer à plusieurs écrans. */
  readableFontSize: number;
  /** Nombre maximal de mots par écran (lisibilité sur téléphone). */
  maxWordsPerPage: number;
};

export type Pagination = { fontSize: number; pages: string[] };

/**
 * Répartit un texte sur un ou plusieurs écrans :
 * 1. le moins d'écrans possible, chacun lisible (taille ≥ readableFontSize,
 *    au plus maxWordsPerPage mots) ;
 * 2. à nombre d'écrans égal, les écrans les plus équilibrés ;
 * 3. une taille de police commune à tous les écrans.
 * Les coupures se font de préférence entre phrases, puis après une virgule,
 * et seulement en dernier recours au milieu d'une proposition.
 * Ne renvoie jamais un écran qui déborde.
 */
export function paginateText(text: string, o: PaginateOptions): Pagination {
  const clean = text.replace(ORDINARY_SPACES, " ").trim();
  const single = fitText(clean, o);
  if (single && single.fontSize >= o.readableFontSize && wordCount(clean) <= o.maxWordsPerPage) {
    return { fontSize: single.fontSize, pages: [clean] };
  }

  const pageFit: FitOptions = { ...o, minFontSize: o.readableFontSize };
  const fits = (t: string) => wordCount(t) <= o.maxWordsPerPage && fitText(t, pageFit) !== null;

  // Unités insécables : phrases → propositions → morceaux de mots.
  const units: string[] = [];
  const pushSplitByWords = (part: string) => {
    let chunk = "";
    for (const word of part.split(" ")) {
      const candidate = chunk ? `${chunk} ${word}` : word;
      if (chunk && !fits(candidate)) {
        units.push(chunk);
        chunk = word;
      } else {
        chunk = candidate;
      }
    }
    if (chunk) units.push(chunk);
  };
  for (const sentence of splitSentences(clean)) {
    if (fits(sentence)) units.push(sentence);
    else {
      for (const clause of splitClauses(sentence)) {
        if (fits(clause)) units.push(clause);
        else pushSplitByWords(clause);
      }
    }
  }

  // Programmation dynamique : minimum d'écrans, puis minimum du plus long écran (en mots).
  const m = units.length;
  const join = (a: number, b: number) => units.slice(a, b).join(" ");
  const fitMemo = new Map<string, boolean>();
  const canGroup = (a: number, b: number) => {
    const key = `${a}:${b}`;
    if (!fitMemo.has(key)) fitMemo.set(key, fits(join(a, b)));
    return fitMemo.get(key)!;
  };

  let prev: number[] = Array(m + 1).fill(Infinity);
  prev[0] = 0;
  const choices: number[][] = [];
  for (let k = 1; k <= m; k++) {
    const cur: number[] = Array(m + 1).fill(Infinity);
    const choice: number[] = Array(m + 1).fill(-1);
    for (let i = 1; i <= m; i++) {
      for (let j = i - 1; j >= 0; j--) {
        if (prev[j] === Infinity) continue;
        if (!canGroup(j, i)) break; // plus long encore ne tiendra pas non plus
        const cost = Math.max(prev[j], wordCount(join(j, i)));
        if (cost < cur[i]) {
          cur[i] = cost;
          choice[i] = j;
        }
      }
    }
    choices.push(choice);
    if (cur[m] !== Infinity) {
      const pages: string[] = [];
      let end = m;
      for (let level = k - 1; level >= 0; level--) {
        const start = choices[level][end];
        pages.unshift(join(start, end));
        end = start;
      }
      return { fontSize: commonFontSize(pages, o), pages };
    }
    prev = cur;
  }

  // Inatteignable (chaque unité tient seule sur un écran) — garde-fou.
  return { fontSize: commonFontSize(units, o), pages: units };
}

/** Taille commune = la plus petite des tailles maximales de chaque écran. */
function commonFontSize(pages: string[], o: FitOptions): number {
  let fontSize = o.maxFontSize;
  for (const page of pages) {
    const fit = fitText(page, o);
    fontSize = Math.min(fontSize, fit ? fit.fontSize : o.minFontSize);
  }
  return fontSize;
}
