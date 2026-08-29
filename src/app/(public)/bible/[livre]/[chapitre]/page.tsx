import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { getBibleChapter } from "@/lib/queries/bible";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ livre: string; chapitre: string }> };

function parseChapterNumber(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { livre, chapitre } = await params;
  const chapterNumber = parseChapterNumber(chapitre);
  if (!chapterNumber) return {};
  const data = await getBibleChapter(livre, chapterNumber);
  if (!data) return {};

  const excerpt = data.chapter.verses
    .slice(0, 3)
    .map((v) => v.text)
    .join(" ")
    .slice(0, 155);

  return pageMetadata({
    title: `${data.book.name} ${chapterNumber} — La Bible`,
    description: excerpt,
    path: `/bible/${data.book.slug}/${chapterNumber}`,
  });
}

export default async function BibleChapterPage({ params }: Props) {
  const { livre, chapitre } = await params;
  const chapterNumber = parseChapterNumber(chapitre);
  if (!chapterNumber) notFound();

  const data = await getBibleChapter(livre, chapterNumber);
  if (!data) notFound();

  const { book, chapter, prev, next } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <ChevronRight size={12} />
        <Link href="/bible" className="hover:text-foreground">Bible</Link>
        <ChevronRight size={12} />
        <Link href={`/bible/${book.slug}`} className="hover:text-foreground">{book.name}</Link>
        <ChevronRight size={12} />
        <span className="text-foreground">Chapitre {chapterNumber}</span>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {book.name} {chapterNumber}
        </h1>
        <Link
          href={`/bible/${book.slug}`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-foreground/70 transition hover:border-gold hover:text-gold"
        >
          <ListOrdered size={13} />
          Chapitres
        </Link>
      </div>

      <ChapterNav book={book} prev={prev} next={next} />

      <div className="mt-6 space-y-1 rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
        {chapter.verses.map((verse) => (
          <p key={verse.number} id={`v${verse.number}`} className="leading-relaxed text-foreground/90 scroll-mt-24">
            <sup className="mr-1.5 font-semibold text-gold">{verse.number}</sup>
            {verse.text}
          </p>
        ))}
      </div>

      <ChapterNav book={book} prev={prev} next={next} className="mt-6" />
    </div>
  );
}

function ChapterNav({
  prev,
  next,
  className,
}: {
  book: { slug: string };
  prev: { bookSlug: string; bookName: string; chapterNumber: number } | null;
  next: { bookSlug: string; bookName: string; chapterNumber: number } | null;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className ?? ""}`}>
      {prev ? (
        <Link
          href={`/bible/${prev.bookSlug}/${prev.chapterNumber}`}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
        >
          <ChevronLeft size={15} />
          {prev.bookName} {prev.chapterNumber}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/bible/${next.bookSlug}/${next.chapterNumber}`}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
        >
          {next.bookName} {next.chapterNumber}
          <ChevronRight size={15} />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
