import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getBibleBookBySlug } from "@/lib/queries/bible";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ livre: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { livre } = await params;
  const book = await getBibleBookBySlug(livre);
  if (!book) return {};

  return pageMetadata({
    title: `${book.name} — La Bible`,
    description: `Lire le livre de ${book.name} (${book.chapters.length} chapitres), Louis Segond 1910.`,
    path: `/bible/${book.slug}`,
  });
}

export default async function BibleBookPage({ params }: Props) {
  const { livre } = await params;
  const book = await getBibleBookBySlug(livre);
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <ChevronRight size={12} />
        <Link href="/bible" className="hover:text-foreground">Bible</Link>
        <ChevronRight size={12} />
        <span className="text-foreground">{book.name}</span>
      </div>

      <span className="mb-2 inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
        {book.testament === "AT" ? "Ancien Testament" : "Nouveau Testament"}
      </span>
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{book.name}</h1>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {book.chapters.map((chapter) => (
          <Link
            key={chapter.number}
            href={`/bible/${book.slug}/${chapter.number}`}
            className="flex h-11 items-center justify-center rounded-lg border border-border bg-surface-elevated text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold"
          >
            {chapter.number}
          </Link>
        ))}
      </div>
    </div>
  );
}
