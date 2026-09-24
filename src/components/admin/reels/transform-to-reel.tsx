import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { prisma } from "@/lib/db";
import { REEL_SOURCES, REEL_SOURCES_PENDING, type ReelSourceType } from "@/lib/reels/sources";
import { TransformToReelButton } from "./transform-to-reel-button";

/**
 * « Transformer en Reel » sur la page d'édition d'un contenu du CMS.
 * Pour un type pas encore pris en charge, le bouton est affiché désactivé avec
 * la mention « Fonction en développement » (jamais de faux bouton).
 */
export async function TransformToReel({ sourceType, sourceId }: { sourceType: ReelSourceType; sourceId: string }) {
  const pending = REEL_SOURCES_PENDING[sourceType];
  if (!REEL_SOURCES[sourceType]) {
    return (
      <div className="flex flex-col items-end" title={pending}>
        <span
          aria-disabled
          className="flex cursor-not-allowed items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-2 text-sm text-foreground/50"
        >
          <Clapperboard size={16} /> Transformer en Reel
        </span>
        <span className="mt-1 text-xs text-muted">Fonction en développement</span>
      </div>
    );
  }

  const existing = await prisma.reelProject.count({ where: { sourceType, sourceId } });
  return (
    <div className="flex flex-col items-end">
      <TransformToReelButton sourceType={sourceType} sourceId={sourceId} />
      {existing > 0 && (
        <Link href={`/admin/reels?source=${sourceType}:${sourceId}`} className="mt-1 text-xs text-foreground/70 underline-offset-2 hover:text-gold hover:underline">
          {existing} Reel{existing > 1 ? "s" : ""} déjà créé{existing > 1 ? "s" : ""} depuis ce contenu
        </Link>
      )}
    </div>
  );
}
