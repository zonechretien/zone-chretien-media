import { normalizeTokens, similarity } from "./normalize";
import type { SyncLanguage } from "./numbers";

/**
 * Alignement du texte EXACT du Reel sur les mots reconnus par Whisper
 * (logique pure, testée). Whisper ne sert qu'au minutage : le texte affiché
 * reste toujours celui de l'éditeur, erreurs de reconnaissance comprises.
 *
 * 1. Chaque mot est découpé en petits mots normalisés (sans accents, nombres
 *    en toutes lettres : « 3:16 » ≈ « trois seize » ≈ « twa sèz »).
 * 2. Programmation dynamique (type Needleman-Wunsch) : mots identiques ou
 *    ressemblants associés, mots ajoutés à l'oral (« Amen ») ou non lus
 *    tolérés, mot coupé en deux ou deux mots collés par Whisper acceptés.
 * 3. Les mots non retrouvés sont placés entre les mots sûrs qui les entourent,
 *    au prorata de leur longueur.
 */

export type RecognizedWord = { text: string; start: number; end: number };

export type AlignedWord = {
  start: number;
  end: number;
  /** Ressemblance avec le mot entendu (0 = non retrouvé, minutage interpolé). */
  match: number;
};

export type Alignment = {
  words: AlignedWord[];
  /** Part du texte (pondérée par la longueur des mots) retrouvée dans la voix, de 0 à 1. */
  confidence: number;
};

/** En dessous : mots trop différents pour servir de repère. */
const MIN_SIMILARITY = 0.5;
const GAP_SCRIPT = 0.8; // mot du texte non lu
const GAP_SPOKEN = 0.7; // mot prononcé absent du texte
const SUBSTITUTION = 1.5; // deux mots différents à la même place

type Token = { text: string; owner: number; start: number; end: number };

function scriptTokens(words: string[], language: SyncLanguage): Token[] {
  const out: Token[] = [];
  words.forEach((w, i) => normalizeTokens(w, language).forEach((t) => out.push({ text: t, owner: i, start: 0, end: 0 })));
  return out;
}

/** Mots reconnus → petits mots, chacun avec sa part du minutage (au prorata du nombre de lettres). */
function spokenTokens(words: RecognizedWord[], language: SyncLanguage): Token[] {
  const out: Token[] = [];
  words.forEach((w, i) => {
    const toks = normalizeTokens(w.text, language);
    const total = toks.reduce((n, t) => n + t.length, 0) || 1;
    let cursor = w.start;
    for (const t of toks) {
      const d = ((w.end - w.start) * t.length) / total;
      out.push({ text: t, owner: i, start: cursor, end: cursor + d });
      cursor += d;
    }
  });
  return out;
}

type Move = "match" | "split" | "merge" | "skipScript" | "skipSpoken";

/** Associe chaque petit mot du texte à un intervalle entendu, avec sa ressemblance. */
function alignTokens(S: Token[], R: Token[]): { start: number; end: number; sim: number }[] {
  const n = S.length;
  const m = R.length;
  const W = m + 1;
  const cost = new Float64Array((n + 1) * W).fill(Infinity);
  const move = new Array<Move>((n + 1) * W);
  cost[0] = 0;
  const relax = (i: number, j: number, c: number, mv: Move) => {
    const k = i * W + j;
    if (c < cost[k]) {
      cost[k] = c;
      move[k] = mv;
    }
  };
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const c = cost[i * W + j];
      if (c === Infinity) continue;
      if (i < n) relax(i + 1, j, c + GAP_SCRIPT, "skipScript");
      // Départage à coût égal : mieux vaut ignorer un mot entendu tard qu'un mot entendu tôt,
      // pour que le texte prenne la PREMIÈRE occurrence (bavardage répétant la fin après l'enregistrement).
      if (j < m) relax(i, j + 1, c + GAP_SPOKEN + (m - j) * 1e-6, "skipSpoken");
      if (i < n && j < m) {
        const sim = similarity(S[i].text, R[j].text);
        relax(i + 1, j + 1, c + (sim >= MIN_SIMILARITY ? 1 - sim : SUBSTITUTION), "match");
        // Un mot du texte entendu comme deux mots (« lanmou » / « lan mou ») et l'inverse.
        if (j + 1 < m) {
          const s2 = similarity(S[i].text, R[j].text + R[j + 1].text);
          if (s2 >= 0.75) relax(i + 1, j + 2, c + 1 - s2 + 0.1, "split");
        }
        if (i + 1 < n) {
          const s2 = similarity(S[i].text + S[i + 1].text, R[j].text);
          if (s2 >= 0.75) relax(i + 2, j + 1, c + 1 - s2 + 0.1, "merge");
        }
      }
    }
  }

  const result = S.map(() => ({ start: 0, end: 0, sim: 0 }));
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = move[i * W + j];
    if (mv === "skipScript") i--;
    else if (mv === "skipSpoken") j--;
    else if (mv === "match") {
      const sim = similarity(S[i - 1].text, R[j - 1].text);
      if (sim >= MIN_SIMILARITY) result[i - 1] = { start: R[j - 1].start, end: R[j - 1].end, sim };
      i--;
      j--;
    } else if (mv === "split") {
      result[i - 1] = { start: R[j - 2].start, end: R[j - 1].end, sim: similarity(S[i - 1].text, R[j - 2].text + R[j - 1].text) };
      i--;
      j -= 2;
    } else {
      // merge : deux petits mots du texte pour un mot entendu, partagé au prorata.
      const a = S[i - 2];
      const b = S[i - 1];
      const r = R[j - 1];
      const sim = similarity(a.text + b.text, r.text);
      const mid = r.start + ((r.end - r.start) * a.text.length) / (a.text.length + b.text.length);
      result[i - 2] = { start: r.start, end: mid, sim };
      result[i - 1] = { start: mid, end: r.end, sim };
      i -= 2;
      j--;
    }
  }
  return result;
}

const weight = (w: string) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, "").length);

/**
 * Minutage de chaque mot du texte (en secondes depuis le début du fichier audio).
 * `speech` : début et fin de la parole (silences exclus), bornes des mots interpolés.
 */
export function alignScript(
  script: string[],
  recognized: RecognizedWord[],
  o: { language: SyncLanguage; speech: { start: number; end: number } },
): Alignment {
  const S = scriptTokens(script, o.language);
  const R = spokenTokens(recognized, o.language);
  const tokenTimes = R.length > 0 ? alignTokens(S, R) : S.map(() => ({ start: 0, end: 0, sim: 0 }));

  // Petits mots → mots du texte.
  const words: AlignedWord[] = script.map(() => ({ start: 0, end: 0, match: 0 }));
  const sims: number[][] = script.map(() => []);
  S.forEach((tok, k) => {
    const t = tokenTimes[k];
    sims[tok.owner].push(t.sim);
    if (t.sim === 0) return;
    const w = words[tok.owner];
    if (w.match === 0) {
      w.start = t.start;
      w.end = t.end;
      w.match = 1;
    } else {
      w.start = Math.min(w.start, t.start);
      w.end = Math.max(w.end, t.end);
    }
  });
  words.forEach((w, i) => {
    // Ressemblance moyenne des petits mots : un mot à moitié retrouvé compte à moitié.
    const s = sims[i];
    w.match = w.match === 0 || s.length === 0 ? 0 : s.reduce((a, b) => a + b, 0) / s.length;
  });

  // Repères dans l'ordre : on écarte ceux qui reviennent en arrière (répétition, faux ami).
  let last = -Infinity;
  for (const w of words) {
    if (w.match === 0) continue;
    if (w.start < last - 0.05) w.match = 0;
    else last = Math.max(last, w.end);
  }

  interpolate(words, script, o.speech);

  const total = script.reduce((n, w) => n + weight(w), 0);
  const found = script.reduce((n, w, i) => n + weight(w) * words[i].match, 0);
  return { words: words.map((w) => ({ start: round(w.start), end: round(w.end), match: round(w.match) })), confidence: total ? round(found / total) : 0 };
}

/** Place les mots non retrouvés entre les repères voisins, au prorata de leur longueur. */
function interpolate(words: AlignedWord[], script: string[], speech: { start: number; end: number }) {
  const anchors = words.map((w, i) => (w.match > 0 ? i : -1)).filter((i) => i >= 0);
  // Débit moyen (secondes par lettre) mesuré sur les mots retrouvés, pour les bords.
  const anchoredLetters = anchors.reduce((n, i) => n + weight(script[i]), 0);
  const perLetter = anchors.length >= 2 ? (words[anchors.at(-1)!].end - words[anchors[0]].start) / Math.max(1, anchoredLetters) : 0.07;

  const fill = (from: number, to: number, a: number, b: number) => {
    // Mots d'indices [from, to) répartis entre les instants a et b.
    const letters = script.slice(from, to).reduce((n, w) => n + weight(w), 0);
    let cursor = a;
    for (let i = from; i < to; i++) {
      const d = ((b - a) * weight(script[i])) / Math.max(1, letters);
      words[i].start = cursor;
      words[i].end = cursor + d;
      cursor += d;
    }
  };

  if (anchors.length === 0) {
    fill(0, words.length, speech.start, speech.end);
    return;
  }
  const first = anchors[0];
  if (first > 0) {
    const need = script.slice(0, first).reduce((n, w) => n + weight(w), 0) * perLetter;
    fill(0, first, Math.max(speech.start, words[first].start - need), words[first].start);
  }
  for (let k = 0; k + 1 < anchors.length; k++) {
    const a = anchors[k];
    const b = anchors[k + 1];
    if (b > a + 1) fill(a + 1, b, words[a].end, words[b].start);
  }
  const lastA = anchors.at(-1)!;
  if (lastA < words.length - 1) {
    const need = script.slice(lastA + 1).reduce((n, w) => n + weight(w), 0) * perLetter;
    fill(lastA + 1, words.length, words[lastA].end, Math.max(words[lastA].end, Math.min(speech.end, words[lastA].end + need)));
  }
}

const round = (x: number) => Math.round(x * 1000) / 1000;
