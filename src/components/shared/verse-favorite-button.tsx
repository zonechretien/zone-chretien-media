"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavoriteVerse, useIsVerseFavorite, type FavoriteVerseRef } from "@/lib/personalization";

export function VerseFavoriteButton({ verse, className }: { verse: FavoriteVerseRef; className?: string }) {
  const active = useIsVerseFavorite(verse.bookSlug, verse.chapter, verse.verse);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteVerse(verse);
  }

  const label = `${verse.bookName} ${verse.chapter}:${verse.verse}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Retirer ${label} des versets favoris` : `Ajouter ${label} aux versets favoris`}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-foreground/30 transition hover:text-gold",
        active && "text-gold",
        className,
      )}
    >
      <Heart size={14} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
