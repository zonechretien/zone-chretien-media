import { Fragment } from "react";
import { Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";
import type { WordFrames } from "../lib/sync/timing";
import type { TextStyle } from "../schemas";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Style « mot » : mots pas encore prononcés, atténués (restent lisibles, contraste de la charte). */
const UPCOMING_OPACITY = 0.45;
/** Le mot prononcé reste en or un court instant après sa fin (pas de clignotement entre deux mots). */
const HOLD_FRAMES = 4;

/**
 * Texte synchronisé sur la voix off, mot par mot (images relatives à l'écran) :
 * - « phrase » : chaque phrase apparaît (fondu + légère montée) quand elle est prononcée ;
 * - « mot » : l'écran entier est visible, atténué ; le mot prononcé passe en or,
 *   les mots déjà dits restent en blanc.
 * Les mots sont découpés comme dans WordReveal : lignes coupées aux mêmes endroits.
 */
export function SyncedWords({ text, words, style, css }: { text: string; words: WordFrames[]; style: TextStyle; css?: React.CSSProperties }) {
  const frame = useCurrentFrame();
  const parts = text.split(" ").filter(Boolean);
  const base = (css?.color as string | undefined) ?? BRAND.colors.text;

  return (
    <div style={css}>
      {parts.map((word, i) => {
        const w = words[i];
        const appear = w ? interpolate(frame, [w.reveal, w.reveal + (style === "mot" ? 8 : 12)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
        let opacity = appear;
        let color = base;
        if (style === "mot" && w) {
          const next = words[i + 1]?.start ?? Infinity;
          const holdUntil = Math.min(w.end + HOLD_FRAMES, next);
          // 0 avant le mot, 1 pendant, puis retour au blanc (transitions de 3 images).
          const on = Math.min(interpolate(frame, [w.start - 3, w.start], [0, 1], clamp), interpolate(frame, [holdUntil, holdUntil + 3], [1, 0], clamp));
          const said = interpolate(frame, [w.start - 3, w.start], [UPCOMING_OPACITY, 1], clamp);
          opacity = appear * said;
          color = interpolateColors(on, [0, 1], [base, BRAND.colors.gold]);
        }
        const rise = style === "phrase" ? (1 - appear) * 0.35 : 0;
        return (
          <Fragment key={i}>
            <span style={{ display: "inline-block", opacity, color, transform: rise ? `translateY(${rise}em)` : undefined }}>{word}</span>
            {i < parts.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </div>
  );
}
