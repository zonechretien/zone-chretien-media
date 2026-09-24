import { Fragment } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * Apparition mot par mot (fondu + légère montée). `revealFrames` borne la
 * durée totale de l'apparition, quel que soit le nombre de mots.
 */
export function WordReveal({
  text,
  startFrame,
  revealFrames,
  style,
}: {
  text: string;
  startFrame: number;
  revealFrames: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const wordAnim = 14;
  const stagger = words.length > 1 ? Math.min(4, Math.max(0, revealFrames - wordAnim) / (words.length - 1)) : 0;

  return (
    <div style={style}>
      {words.map((word, i) => {
        const start = startFrame + i * stagger;
        const t = interpolate(frame, [start, start + wordAnim], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        // L'espace reste hors du <span> : le navigateur coupe les lignes aux
        // mêmes endroits que l'estimation de text-fit.ts (texte ordinaire).
        return (
          <Fragment key={i}>
            <span style={{ display: "inline-block", opacity: t, transform: `translateY(${(1 - t) * 0.35}em)` }}>
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </div>
  );
}
