import type { z } from "zod";
import { BRAND } from "./brand";
import { layoutReel, type ReelLayout } from "./engine/layout";
import type { ReelSpec } from "./engine/types";
import { FORMAT_IDS, type FormatId } from "./formats";
import {
  citationSchema,
  devotionSchema,
  evenementSchema,
  priereSchema,
  versetSchema,
  type CitationProps,
  type DevotionProps,
  type EvenementProps,
  type PriereProps,
  type VersetProps,
} from "./schemas";
import { citationSpec, devotionSpec, effectiveDuration, evenementSpec, priereSpec, versetSpec } from "./templates/specs";

/**
 * Description des templates, SANS composant React : utilisable côté serveur
 * (actions du CMS : validation, création d'un projet) comme côté client.
 * Les composants sont ajoutés par templates.ts.
 */

/** Champs communs à tous les templates (voir baseTemplateSchema). */
type BaseProps = VersetProps | PriereProps | DevotionProps | CitationProps | EvenementProps;

export type TemplateMeta<P> = {
  id: string;
  label: string;
  description: string;
  schema: z.ZodType<P>;
  /** Formats validés visuellement pour ce template. */
  formats: FormatId[];
  defaultProps: (format: FormatId) => P;
  /** Props → écrans (logique pure, partagée par l'aperçu et le rendu). */
  spec: (props: P) => ReelSpec;
  /** Dimensions et durée calculées depuis les props (identiques aperçu / rendu). */
  metadata: (props: P) => { width: number; height: number; durationInFrames: number; fps: number };
};

const common = (format: FormatId) => ({
  format,
  background: { type: "gradient" as const, from: BRAND.colors.navyLight, to: BRAND.colors.navyDeep },
  durationSeconds: null,
  music: null,
  voiceOver: null,
});

/** Mise en page d'un projet (props → écrans → tailles, pages et minutage). */
export function layoutFor<P extends BaseProps>(meta: Pick<TemplateMeta<P>, "spec">, props: P): ReelLayout {
  return layoutReel(meta.spec(props), props.format, effectiveDuration(props));
}

function define<P extends BaseProps>(def: Omit<TemplateMeta<P>, "formats" | "metadata">): TemplateMeta<P> {
  return {
    ...def,
    formats: [...FORMAT_IDS],
    metadata: (props) => {
      const L = layoutFor(def, props);
      return { width: L.width, height: L.height, durationInFrames: L.timing.totalFrames, fps: BRAND.fps };
    },
  };
}

const verset = define<VersetProps>({
  id: "Verset",
  label: "Verset / Inspiration",
  description: "Un verset mis en valeur, apparition mot par mot, avec sa référence.",
  schema: versetSchema,
  spec: versetSpec,
  defaultProps: (format) => ({
    ...common(format),
    kicker: "Parole du jour",
    reference: "Psaume 34:8",
    text: "Sentez et voyez combien l'Éternel est bon! Heureux l'homme qui cherche en lui son refuge!",
    showVersion: true,
  }),
});

const priere = define<PriereProps>({
  id: "Priere",
  label: "Prière",
  description: "Un titre court, le texte de la prière et un verset facultatif, dans une ambiance douce.",
  schema: priereSchema,
  spec: priereSpec,
  defaultProps: (format) => ({
    ...common(format),
    kicker: "Prions ensemble",
    title: "Prière du matin",
    text: "Seigneur, merci pour ce nouveau jour que tu m'accordes. Guide mes pas, éclaire mes décisions et remplis mon cœur de ta paix. Amen.",
    verseReference: "Philippiens 4:6",
    verseText:
      "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.",
    showVersion: true,
  }),
});

const devotion = define<DevotionProps>({
  id: "Devotion",
  label: "Dévotion",
  description: "Titre, verset, réflexion courte et appel à l'action final.",
  schema: devotionSchema,
  spec: devotionSpec,
  defaultProps: (format) => ({
    ...common(format),
    kicker: "Dévotion du jour",
    title: "Ma grâce te suffit",
    verseReference: "2 Corinthiens 12:9",
    verseText:
      "et il m'a dit: Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse. Je me glorifierai donc bien plus volontiers de mes faiblesses, afin que la puissance de Christ repose sur moi.",
    reflection:
      "Paul a demandé trois fois que son épreuve lui soit ôtée ; Dieu a répondu que sa grâce suffisait. Aujourd'hui, confie-lui ta faiblesse : c'est là que sa force se montre.",
    callToAction: "Lis la dévotion sur zone-chretien.org",
    showVersion: true,
  }),
});

const citation = define<CitationProps>({
  id: "Citation",
  label: "Citation",
  description: "Une citation mise en valeur et son auteur.",
  schema: citationSchema,
  spec: citationSpec,
  defaultProps: (format) => ({
    ...common(format),
    kicker: "Citation",
    quote: "Tu nous as faits pour toi, Seigneur, et notre cœur est sans repos tant qu'il ne repose en toi.",
    author: "Saint Augustin",
  }),
});

const evenement = define<EvenementProps>({
  id: "Evenement",
  label: "Annonce d'événement",
  description: "Nom, date, heure, lieu, visuel et appel à l'action.",
  schema: evenementSchema,
  spec: evenementSpec,
  defaultProps: (format) => ({
    ...common(format),
    kicker: "Événement",
    name: "Soirée de louange",
    date: "2026-10-17",
    time: "19:30",
    place: "Église de la Grâce",
    description: "Une soirée pour adorer ensemble, prier les uns pour les autres et partager un moment fraternel.",
    callToAction: "Entrée libre — viens avec tes amis !",
  }),
});

export const TEMPLATE_METAS = { Verset: verset, Priere: priere, Devotion: devotion, Citation: citation, Evenement: evenement } as const;
export type TemplateId = keyof typeof TEMPLATE_METAS;
export type AnyTemplateProps = BaseProps;

export function isTemplateId(id: string): id is TemplateId {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_METAS, id);
}

/** Description d'un template sans distinction de ses props (registre générique). */
export function templateMeta(id: TemplateId): TemplateMeta<AnyTemplateProps> {
  return TEMPLATE_METAS[id] as unknown as TemplateMeta<AnyTemplateProps>;
}

/** Valide des props enregistrées (JSON) pour un template donné. */
export function parseTemplateData(templateId: TemplateId, data: unknown) {
  return (TEMPLATE_METAS[templateId].schema as z.ZodType<unknown>).safeParse(data);
}
