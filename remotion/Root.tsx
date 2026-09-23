import { Composition } from "remotion";
import { TEMPLATES } from "./templates";

/** Compositions utilisées par le rendu du studio local (une par template). */
export function RemotionRoot() {
  const verset = TEMPLATES.Verset;
  const initial = verset.metadata(verset.defaultProps);
  return (
    <Composition
      id={verset.id}
      component={verset.component}
      defaultProps={verset.defaultProps}
      width={initial.width}
      height={initial.height}
      fps={initial.fps}
      durationInFrames={initial.durationInFrames}
      // Revalidation zod avant tout rendu : des données invalides donnent une
      // erreur claire au lieu d'une vidéo cassée.
      calculateMetadata={({ props }) => verset.metadata({ ...props, ...verset.schema.parse(props) })}
    />
  );
}
