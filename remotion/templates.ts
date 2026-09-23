import type { ComponentType } from "react";
import { Verset } from "./compositions/Verset";
import type { RuntimeProps, VersetProps } from "./schemas";
import { TEMPLATE_METAS, type TemplateId, type TemplateMeta } from "./template-meta";

/**
 * Registre complet des templates (description + composant) : seule source de
 * vérité partagée par l'aperçu du CMS (@remotion/player) et le rendu du studio.
 */
export type TemplateDefinition<P> = TemplateMeta<P> & { component: ComponentType<P & RuntimeProps> };

const verset: TemplateDefinition<VersetProps> = { ...TEMPLATE_METAS.Verset, component: Verset };

export const TEMPLATES: { [K in TemplateId]: typeof verset } = { Verset: verset };

export { TEMPLATE_METAS, isTemplateId, type TemplateId } from "./template-meta";
