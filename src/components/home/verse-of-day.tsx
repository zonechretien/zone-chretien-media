import Link from "next/link";
import { Quote } from "lucide-react";
import type { Verse } from "@prisma/client";
import { dateToUrlSlug, formatDate } from "@/lib/utils";
import { ShareButtons } from "@/components/shared/share-buttons";

export function VerseOfDay({ verse }: { verse: Verse }) {
  const url = `/versets/${dateToUrlSlug(verse.date)}`;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-navy to-navy-light px-6 py-10 text-white shadow-xl sm:px-12 sm:py-14">
        <Quote size={36} className="text-gold/60" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Verset du jour · {formatDate(verse.date)}
        </p>
        <Link href={url}>
          <p className="mt-4 max-w-2xl text-2xl font-medium leading-snug sm:text-3xl">
            « {verse.text} »
          </p>
        </Link>
        <p className="mt-4 text-lg font-semibold text-gold">{verse.reference}</p>
        <div className="mt-6">
          <ShareButtons url={url} title={`${verse.reference} — ${verse.text}`} dark />
        </div>
      </div>
    </section>
  );
}
