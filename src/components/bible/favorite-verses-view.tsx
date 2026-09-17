"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavoriteVerses } from "@/lib/personalization";
import { EmptyState } from "@/components/shared/empty-state";

export function FavoriteVersesView() {
  const verses = useFavoriteVerses();

  if (verses.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Aucun verset favori pour le moment"
        description="Cliquez sur le cœur à côté d'un verset, sur n'importe quelle page de la Bible, pour le retrouver ici."
      />
    );
  }

  return (
    <div className="space-y-3">
      {[...verses].reverse().map((v) => (
        <Link
          key={`${v.bookSlug}-${v.chapter}-${v.verse}`}
          href={`/bible/${v.bookSlug}/${v.chapter}#v${v.verse}`}
          className="block rounded-xl border border-border bg-surface-elevated p-4 transition hover:border-gold"
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gold">
            {v.bookName} {v.chapter}:{v.verse}
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">{v.text}</p>
        </Link>
      ))}
    </div>
  );
}
