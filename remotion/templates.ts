import type { ComponentType } from "react";
import type { z } from "zod";
import { BRAND } from "./brand";
import { Verset } from "./compositions/Verset";
import { computeVersetLayout } from "./compositions/verset-layout";
import type { FormatId } from "./formats";
import { versetSchema, type RuntimeProps, type VersetProps } from "./schemas";

/**
 * Registre des templates : seule source de vérité partagée par l'aperçu du CMS
 * (@remotion/player), le formulaire de l'éditeur et le rendu du studio local.
 */
export type TemplateDefinition<P> = {
  id: string;
  label: string;
  description: string;
  schema: z.ZodType<P>;
  component: ComponentType<P & RuntimeProps>;
  formats: FormatId[];
  defaultProps: P;
  /** Dimensions et durée calculées depuis les props (identiques aperçu / rendu). */
  metadata: (props: P) => { width: number; height: number; durationInFrames: number; fps: number };
};

const verset: TemplateDefinition<VersetProps> = {
  id: "Verset",
  label: "Verset / Inspiration",
  description: "Un verset mis en valeur, apparition mot par mot, avec sa référence.",
  schema: versetSchema,
  component: Verset,
  // Étape 1 : seul le 9:16 est validé visuellement ; 1:1 et 16:9 à l'étape 7.
  formats: ["9:16"],
  defaultProps: {
    format: "9:16",
    background: { type: "gradient", from: BRAND.colors.navyLight, to: BRAND.colors.navyDeep },
    durationSeconds: null,
    kicker: "Parole du jour",
    reference: "Psaume 34:8",
    text: "Sentez et voyez combien l'Éternel est bon! Heureux l'homme qui cherche en lui son refuge!",
    showVersion: true,
  },
  metadata: (props) => {
    const L = computeVersetLayout(props);
    return { width: L.width, height: L.height, durationInFrames: L.timing.totalFrames, fps: BRAND.fps };
  },
};

export const TEMPLATES = { Verset: verset } as const;
export type TemplateId = keyof typeof TEMPLATES;
