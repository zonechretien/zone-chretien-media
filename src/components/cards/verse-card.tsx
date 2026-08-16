import Link from "next/link";
import { Quote } from "lucide-react";
import type { Verse } from "@prisma/client";
import { dateToUrlSlug, formatDate } from "@/lib/utils";

export function VerseCard({ verse }: { verse: Verse }) {
  return (
    <Link
      href={`/versets/${dateToUrlSlug(verse.date)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-navy p-6 text-white transition hover:border-gold hover:shadow-lg"
    >
      <Quote size={20} className="text-gold" />
      <p className="mt-3 line-clamp-3 text-lg font-medium leading-snug">{verse.text}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-gold">{verse.reference}</span>
        <span className="text-white/60">{formatDate(verse.date)}</span>
      </div>
    </Link>
  );
}
