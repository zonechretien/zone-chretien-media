import { createElement, useMemo, type ComponentType } from "react";
import { ReelScreens } from "./engine/ReelScreens";
import type { RuntimeProps } from "./schemas";
import { TEMPLATE_METAS, layoutFor, templateMeta, type AnyTemplateProps, type TemplateId, type TemplateMeta } from "./template-meta";

/**
 * Registre complet des templates (description + composant) : seule source de
 * vérité partagée par l'aperçu du CMS (@remotion/player) et le rendu du studio.
 * Tous les templates utilisent le même moteur d'écrans (engine/ReelScreens).
 */
export type TemplateDefinition = TemplateMeta<AnyTemplateProps> & { component: ComponentType<AnyTemplateProps & RuntimeProps> };

function componentFor(id: TemplateId): ComponentType<AnyTemplateProps & RuntimeProps> {
  const meta = templateMeta(id);
  function Template(props: AnyTemplateProps & RuntimeProps) {
    const layout = useMemo(() => layoutFor(meta, props), [props]);
    return createElement(ReelScreens, {
      layout,
      background: props.background,
      music: props.music,
      voiceOver: props.voiceOver,
      mediaBaseUrl: props.mediaBaseUrl,
      showSafeZones: props.showSafeZones,
    });
  }
  Template.displayName = `Template${id}`;
  return Template;
}

export const TEMPLATES = Object.fromEntries(
  (Object.keys(TEMPLATE_METAS) as TemplateId[]).map((id) => [id, { ...templateMeta(id), component: componentFor(id) }]),
) as Record<TemplateId, TemplateDefinition>;

export { TEMPLATE_METAS, isTemplateId, type TemplateId } from "./template-meta";
