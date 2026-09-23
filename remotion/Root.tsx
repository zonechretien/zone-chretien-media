import { Composition } from "remotion";
import { TEMPLATES, type TemplateId } from "./templates";

/** Compositions utilisées par le rendu du studio local (une par template). */
export function RemotionRoot() {
  return (
    <>
      {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => {
        const t = TEMPLATES[id];
        const defaults = t.defaultProps("9:16");
        const initial = t.metadata(defaults);
        return (
          <Composition
            key={id}
            id={id}
            component={t.component}
            defaultProps={defaults}
            width={initial.width}
            height={initial.height}
            fps={initial.fps}
            durationInFrames={initial.durationInFrames}
            // Revalidation zod avant tout rendu : des données invalides donnent une
            // erreur claire au lieu d'une vidéo cassée.
            calculateMetadata={({ props }) => t.metadata({ ...props, ...(t.schema.parse(props) as object) } as typeof props)}
          />
        );
      })}
    </>
  );
}
