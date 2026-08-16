import Link from "next/link";
import { BookMarked } from "lucide-react";
import type { Devotion } from "@prisma/client";
import { formatDate, truncate } from "@/lib/utils";

export function DevotionCard({ devotion }: { devotion: Devotion }) {
  return (
    <Link
      href={`/devotions/${devotion.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated p-5 transition hover:border-gold hover:shadow-lg"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold">
        <BookMarked size={14} />
        {formatDate(devotion.date)}
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold text-foreground">{devotion.title}</h3>
      <p className="mt-1 text-sm font-medium text-muted">{devotion.mainVerseRef}</p>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{truncate(devotion.reflection, 110)}</p>
    </Link>
  );
}
