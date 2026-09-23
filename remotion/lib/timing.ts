/**
 * Calcul du minutage d'une vidéo découpée en écrans (logique pure, partagée
 * entre l'aperçu et le rendu pour garantir la même durée des deux côtés).
 */

export type Segment = { from: number; duration: number };

export type SequenceTiming = {
  introFrames: number;
  segments: Segment[];
  endCard: Segment;
  totalFrames: number;
};

export type TimingOptions = {
  fps: number;
  /** Durée « naturelle » de chaque écran, en secondes. */
  segmentSeconds: number[];
  introSeconds: number;
  endCardSeconds: number;
  /** Durée totale imposée (null = durée naturelle). */
  durationSeconds: number | null;
  /** Aucun écran ne descend sous cette durée, même si la durée imposée est courte. */
  minSegmentSeconds: number;
};

/** Temps de lecture confortable d'un écran de texte affiché mot par mot. */
export function readingSeconds(wordCount: number): number {
  const seconds = wordCount / 3 + 1.6;
  return Math.min(14, Math.max(3.5, seconds));
}

export function computeSequenceTiming(o: TimingOptions): SequenceTiming {
  const introFrames = Math.round(o.introSeconds * o.fps);
  const endFrames = Math.round(o.endCardSeconds * o.fps);

  let seconds = o.segmentSeconds;
  if (o.durationSeconds !== null && seconds.length > 0) {
    const available = o.durationSeconds - o.introSeconds - o.endCardSeconds;
    const natural = seconds.reduce((a, b) => a + b, 0);
    const scale = available / natural;
    seconds = seconds.map((s) => Math.max(o.minSegmentSeconds, s * scale));
  }

  const segments: Segment[] = [];
  let cursor = introFrames;
  for (const s of seconds) {
    const duration = Math.round(s * o.fps);
    segments.push({ from: cursor, duration });
    cursor += duration;
  }

  const endCard = { from: cursor, duration: endFrames };
  return { introFrames, segments, endCard, totalFrames: cursor + endFrames };
}
