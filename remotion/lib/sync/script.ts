/**
 * Texte lu par la voix off = texte affiché, dans l'ordre des écrans : titres,
 * textes, informations pratiques et appel à l'action. Les références et
 * auteurs (lignes dorées) n'en font pas partie : s'ils sont lus, l'alignement
 * les ignore comme des mots ajoutés.
 *
 * Les mots sont découpés exactement comme à l'affichage (espaces ordinaires,
 * typographie appliquée) : l'indice d'un mot désigne le même mot à l'écran.
 */

/** Blocs d'un écran, réduits à ce qui compte pour la narration. */
export type NarrationBlock = { type: "heading" | "body" | "cta"; text: string } | { type: "details"; items: { text: string }[] };

export type ScriptWord = {
  text: string;
  screen: number;
  block: number;
  /** Rang du mot dans son bloc (tous éléments confondus pour les détails). */
  index: number;
  sentence: number;
};

export type ScriptSentence = { first: number; last: number; text: string };

export type NarrationScript = { words: ScriptWord[]; sentences: ScriptSentence[]; hash: string };

const splitWords = (text: string) => text.split(" ").filter(Boolean);

/** Fin de phrase : ponctuation forte, éventuellement suivie d'un guillemet ou d'une espace fine. */
const SENTENCE_END = /[.!?…][\s  »”"’)]*$/u;

export function narrationScript(screens: { blocks: NarrationBlock[] }[]): NarrationScript {
  const words: ScriptWord[] = [];
  const sentences: ScriptSentence[] = [];
  let sentenceStart = 0;

  const closeSentence = () => {
    if (words.length > sentenceStart) {
      sentences.push({ first: sentenceStart, last: words.length - 1, text: words.slice(sentenceStart).map((w) => w.text).join(" ") });
      sentenceStart = words.length;
    }
  };

  screens.forEach((screen, s) => {
    screen.blocks.forEach((block, b) => {
      const parts = block.type === "details" ? block.items.map((it) => it.text) : [block.text];
      let index = 0;
      for (const part of parts) {
        for (const text of splitWords(part)) {
          words.push({ text, screen: s, block: b, index: index++, sentence: sentences.length });
          if (SENTENCE_END.test(text)) closeSentence();
        }
        // Chaque titre, ligne de détail ou appel à l'action forme sa propre phrase.
        if (block.type !== "body") closeSentence();
      }
    });
  });
  closeSentence();
  // Une phrase peut continuer sur l'écran suivant (texte long réparti) : sans incidence.
  return { words, sentences, hash: scriptHash(words.map((w) => w.text)) };
}

/** Empreinte (FNV-1a 32 bits) du texte lu : change dès qu'un mot change. */
export function scriptHash(words: string[]): string {
  let h = 0x811c9dc5;
  const s = words.join("\u0001");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
