"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavoriteVerses, useFavorites } from "@/lib/personalization";
import { EmptyState } from "@/components/shared/empty-state";

type ResolvedBibleFavorite = {
  type: "bible";
  id: string;
  data: { bookSlug: string; bookName: string; chapterNumber: number };
};

export function FavoriteVersesView() {
  const verses = useFavoriteVerses();
  const favorites = useFavorites();
  const chapterRefs = favorites.filter((f) => f.type === "bible");
  const chapterKey = chapterRefs.map((r) => r.id).join(",");

  const [chapters, setChapters] = useState<ResolvedBibleFavorite[] | null>(null);

  useEffect(() => {
    if (chapterRefs.length === 0) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    fetch("/api/content/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: chapterRefs.map(({ type, id }) => ({ type, id })) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setChapters(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setChapters([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterKey]);

  const hasVerses = verses.length > 0;
  const hasChapters = (chapters?.length ?? 0) > 0;

  if (!hasVerses && chapters !== null && !hasChapters) {
    return (
      <EmptyState
        icon={Heart}
        title="Aucun favori pour le moment"
        description="Cliquez sur le cœur à côté d'un verset ou en haut d'un chapitre, sur n'importe quelle page de la Bible, pour le retrouver ici."
      />
    );
  }

  return (
    <div className="space-y-10">
      {hasVerses && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Versets favoris</h2>
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
        </section>
      )}

      {hasChapters && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Chapitres favoris</h2>
          <div className="space-y-2">
            {chapters!.map((item) => (
              <Link
                key={item.id}
                href={`/bible/${item.data.bookSlug}/${item.data.chapterNumber}`}
                className="block rounded-xl border border-border bg-surface-elevated px-4 py-3 font-medium text-foreground transition hover:border-gold hover:text-gold"
              >
                {item.data.bookName} {item.data.chapterNumber}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
