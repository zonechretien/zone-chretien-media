import type { ScriptSentence } from "./script";

/**
 * Qualité d'une synchronisation automatique (logique pure, testée). En
 * dessous du seuil, l'éditeur ne l'applique pas sans l'accord explicite de
 * l'utilisateur et propose le calage manuel : jamais de vidéo décalée en silence.
 */

/** Part minimale du texte retrouvée dans la voix pour appliquer le résultat automatiquement. */
export const SYNC_CONFIDENCE_OK = 0.6;
/** Une phrase dont moins de 40 % des mots ont été retrouvés est signalée (minutage interpolé). */
export const WEAK_SENTENCE = 0.4;

/** Indices des phrases peu ou pas retrouvées dans la voix. */
export function weakSentences(matches: number[], sentences: ScriptSentence[]): number[] {
  return sentences.flatMap((s, k) => {
    const m = matches.slice(s.first, s.last + 1);
    const found = m.filter((x) => x > 0).length / Math.max(1, m.length);
    return found < WEAK_SENTENCE ? [k] : [];
  });
}

export type SyncQuality = "bonne" | "a-verifier" | "faible";

export function syncQuality(confidence: number, weakCount: number): SyncQuality {
  if (confidence < SYNC_CONFIDENCE_OK) return "faible";
  if (confidence < 0.8 || weakCount > 0) return "a-verifier";
  return "bonne";
}
