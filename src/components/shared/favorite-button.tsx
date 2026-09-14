"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite, useIsFavorite, type FavoriteType } from "@/lib/personalization";

export function FavoriteButton({
  type,
  id,
  label,
  className,
}: {
  type: FavoriteType;
  /** Slug du contenu — identifiant stable utilisé comme clé de favori. */
  id: string;
  /** Libellé accessible du contenu (ex. le titre), pour un aria-label précis. */
  label?: string;
  className?: string;
}) {
  const active = useIsFavorite({ type, id });

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ type, id });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Retirer ${label ?? "cet élément"} des favoris` : `Ajouter ${label ?? "cet élément"} aux favoris`}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-navy/80 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-navy",
        active && "text-gold",
        className,
      )}
    >
      <Heart size={16} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
