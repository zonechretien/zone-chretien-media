import type { z } from "zod";
import { BRAND } from "./brand";
import { computeVersetLayout } from "./compositions/verset-layout";
import type { FormatId } from "./formats";
import { versetSchema, type VersetProps } from "./schemas";

/**
 * Description des templates, SANS composant React : utilisable côté serveur
 * (actions du CMS : validation, création d'un projet) comme côté client.
 * Les composants sont ajoutés par templates.ts.
 */
export type TemplateMeta<P> = {
  id: string;
  label: string;
  description: string;
  schema: z.ZodType<P>;
  /** Formats validés visuellement pour ce template. */
  formats: FormatId[];
  defaultProps: (format: FormatId) => P;
  /** Dimensions et durée calculées depuis les props (identiques aperçu / rendu). */
  metadata: (props: P) => { width: number; height: number; durationInFrames: number; fps: number };
};

const verset: TemplateMeta<VersetProps> = {
  id: "Verset",
  label: "Verset / Inspiration",
  description: "Un verset mis en valeur, apparition mot par mot, avec sa référence.",
  schema: versetSchema,
  // 1:1 et 16:9 seront validés visuellement à l'étape 7.
  formats: ["9:16"],
  defaultProps: (format) => ({
    format,
    background: { type: "gradient", from: BRAND.colors.navyLight, to: BRAND.colors.navyDeep },
    durationSeconds: null,
    kicker: "Parole du jour",
    reference: "Psaume 34:8",
    text: "Sentez et voyez combien l'Éternel est bon! Heureux l'homme qui cherche en lui son refuge!",
    showVersion: true,
    music: null,
    voiceOver: null,
  }),
  metadata: (props) => {
    const L = computeVersetLayout(props);
    return { width: L.width, height: L.height, durationInFrames: L.timing.totalFrames, fps: BRAND.fps };
  },
};

export const TEMPLATE_METAS = { Verset: verset } as const;
export type TemplateId = keyof typeof TEMPLATE_METAS;

export function isTemplateId(id: string): id is TemplateId {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_METAS, id);
}

/** Valide des props enregistrées (JSON) pour un template donné. */
export function parseTemplateData(templateId: TemplateId, data: unknown) {
  return (TEMPLATE_METAS[templateId].schema as z.ZodType<unknown>).safeParse(data);
}
