"use client";

import { VerseFavoriteButton } from "@/components/shared/verse-favorite-button";

export function BibleVerseRow({
  bookSlug,
  bookName,
  chapter,
  verse,
}: {
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: { number: number; text: string };
}) {
  return (
    <p id={`v${verse.number}`} className="flex items-start gap-1.5 leading-relaxed text-foreground/90 scroll-mt-24">
      <span className="min-w-0 flex-1">
        <sup className="mr-1.5 font-semibold text-gold">{verse.number}</sup>
        {verse.text}
      </span>
      <VerseFavoriteButton
        verse={{ bookSlug, bookName, chapter, verse: verse.number, text: verse.text }}
        className="mt-0.5"
      />
    </p>
  );
}
