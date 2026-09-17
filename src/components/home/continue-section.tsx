"use client";

import { useEffect, useState } from "react";
import { useHistory } from "@/lib/personalization";
import { SectionHeading } from "@/components/shared/section-heading";
import { ResolvedContentCard, type ResolvedContentItem } from "@/components/shared/resolved-content-card";

const DISPLAY_COUNT = 5;

export function ContinueSection() {
  const history = useHistory();
  const [items, setItems] = useState<ResolvedContentItem[]>([]);

  // L'historique biblique (type "bible") partage cette même liste (voir
  // src/lib/personalization.ts) mais n'a pas de carte de rendu ici — cette
  // section reste dédiée aux 5 types de contenu classiques, la lecture
  // biblique a son propre historique dédié sur /bible/mon-historique.
  const recent = history.filter((h) => h.type !== "bible").slice(0, DISPLAY_COUNT);
  const key = recent.map((h) => `${h.type}-${h.id}`).join(",");

  useEffect(() => {
    if (recent.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetch("/api/content/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: recent }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Reprise" title="Reprendre où vous en étiez" className="mb-6" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <ResolvedContentCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}
