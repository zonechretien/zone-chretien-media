"use client";

import { Player } from "@remotion/player";
import { useMemo } from "react";
import { BRAND } from "@reels/brand";
import { TEMPLATES, type TemplateId } from "@reels/templates";
import type { AnyTemplateProps } from "@reels/template-meta";

/**
 * Aperçu en direct : le MÊME composant Remotion que celui rendu en MP4 par le
 * studio local, donc un aperçu identique à la vidéo finale.
 * Chargé uniquement dans le navigateur (next/dynamic, ssr: false).
 */
export default function ReelPreview({
  templateId,
  props,
  mediaBaseUrl,
  showSafeZones,
}: {
  templateId: TemplateId;
  props: AnyTemplateProps;
  mediaBaseUrl?: string;
  showSafeZones: boolean;
}) {
  const template = TEMPLATES[templateId];
  const meta = useMemo(() => template.metadata(props), [template, props]);
  const inputProps = useMemo(() => ({ ...props, mediaBaseUrl, showSafeZones }), [props, mediaBaseUrl, showSafeZones]);

  return (
    <Player
      component={template.component}
      inputProps={inputProps}
      durationInFrames={meta.durationInFrames}
      compositionWidth={meta.width}
      compositionHeight={meta.height}
      fps={meta.fps}
      controls
      loop
      clickToPlay
      // À l'arrêt, l'aperçu montre le verset déjà apparu (vers 3 s) plutôt que la
      // toute première image, encore vide au début de l'animation d'entrée.
      initialFrame={Math.min(3 * meta.fps, meta.durationInFrames - 1)}
      style={{ width: "100%", aspectRatio: `${meta.width} / ${meta.height}`, borderRadius: 12, overflow: "hidden", background: BRAND.colors.navyDeep }}
    />
  );
}
