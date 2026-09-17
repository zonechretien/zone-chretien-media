"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { useHistory } from "@/lib/personalization";
import { EmptyState } from "@/components/shared/empty-state";

type ResolvedBibleHistoryItem = {
  type: "bible";
  id: string;
  data: { bookSlug: string; bookName: string; chapterNumber: number };
};

export function BibleHistoryView() {
  const history = useHistory();
  const bibleRefs = history.filter((h) => h.type === "bible");
  const key = bibleRefs.map((r) => r.id).join(",");

  const [items, setItems] = useState<ResolvedBibleHistoryItem[] | null>(null);

  useEffect(() => {
    if (bibleRefs.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetch("/api/content/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: bibleRefs.map(({ type, id }) => ({ type, id })) }),
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

  if (items === null) return null;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Aucun chapitre consulté pour le moment"
        description="Les chapitres bibliques que vous lisez apparaîtront ici, du plus récent au plus ancien."
      />
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/bible/${item.data.bookSlug}/${item.data.chapterNumber}`}
          className="block rounded-xl border border-border bg-surface-elevated px-4 py-3 font-medium text-foreground transition hover:border-gold hover:text-gold"
        >
          {item.data.bookName} {item.data.chapterNumber}
        </Link>
      ))}
    </div>
  );
}
