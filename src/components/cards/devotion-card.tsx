import Link from "next/link";
import { BookMarked } from "lucide-react";
import type { Devotion } from "@prisma/client";
import { formatDate, truncate } from "@/lib/utils";
import { markdownToText } from "@/lib/markdown";
import { FavoriteButton } from "@/components/shared/favorite-button";

export function DevotionCard({ devotion }: { devotion: Devotion }) {
  return (
    <Link
      href={`/devotions/${devotion.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated p-5 transition hover:border-gold hover:shadow-lg"
    >
      <FavoriteButton type="devotion" id={devotion.slug} label={devotion.title} className="absolute right-3 top-3" />
      <div className="flex items-center gap-2 pr-8 text-xs font-semibold uppercase tracking-wide text-navy dark:text-gold-soft">
        <BookMarked size={14} />
        {formatDate(devotion.date)}
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold text-foreground">{devotion.title}</h3>
      <p className="mt-1 text-sm font-medium text-muted">{devotion.mainVerseRef}</p>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{truncate(markdownToText(devotion.reflection), 110)}</p>
    </Link>
  );
}
