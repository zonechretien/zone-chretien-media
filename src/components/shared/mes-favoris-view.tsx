"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites, type FavoriteType } from "@/lib/personalization";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { ResolvedContentCard, type ResolvedContentItem } from "@/components/shared/resolved-content-card";

const GROUPS: { type: FavoriteType; title: string; grid: string }[] = [
  { type: "song", title: "Chansons", grid: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" },
  { type: "playlist", title: "Playlists", grid: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" },
  { type: "article", title: "Articles", grid: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" },
  { type: "devotion", title: "Dévotions", grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" },
  { type: "testimony", title: "Témoignages", grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" },
];

export function MesFavorisView() {
  const favorites = useFavorites();
  const [items, setItems] = useState<ResolvedContentItem[] | null>(null);

  useEffect(() => {
    if (favorites.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetch("/api/content/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: favorites }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [favorites]);

  if (items === null) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          icon={Heart}
          title="Aucun favori pour le moment"
          description="Cliquez sur le cœur d'une chanson, playlist, article, dévotion ou témoignage pour le retrouver ici."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
      {GROUPS.map(({ type, title, grid }) => {
        const groupItems = items.filter((item) => item.type === type);
        if (groupItems.length === 0) return null;
        return (
          <section key={type}>
            <SectionHeading title={title} className="mb-6" />
            <div className={grid}>
              {groupItems.map((item) => (
                <ResolvedContentCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
