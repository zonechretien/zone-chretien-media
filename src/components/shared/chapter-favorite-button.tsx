"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite, useIsFavorite } from "@/lib/personalization";

/**
 * Favori de chapitre entier (système générique "bible", id `bookSlug:chapterNumber`
 * — déjà résolu par /api/content/resolve). Même style fantôme que
 * VerseFavoriteButton pour rester cohérent visuellement, en légèrement plus
 * grand pour marquer une action de niveau chapitre plutôt que verset.
 */
export function ChapterFavoriteButton({
  bookSlug,
  bookName,
  chapterNumber,
  className,
}: {
  bookSlug: string;
  bookName: string;
  chapterNumber: number;
  className?: string;
}) {
  const id = `${bookSlug}:${chapterNumber}`;
  const active = useIsFavorite({ type: "bible", id });
  const label = `${bookName} ${chapterNumber}`;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ type: "bible", id });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Retirer ${label} des chapitres favoris` : `Ajouter ${label} aux chapitres favoris`}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/40 transition hover:border-gold hover:text-gold",
        active && "border-gold text-gold",
        className,
      )}
    >
      <Heart size={16} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
