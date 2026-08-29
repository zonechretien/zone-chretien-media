import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getBibleBooks } from "@/lib/queries/bible";
import { PageHeader } from "@/components/shared/page-header";
import { BibleSearchBar } from "@/components/bible/bible-search-bar";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "La Bible",
  description: "La Bible Louis Segond 1910, texte intégral, à lire et rechercher gratuitement — Ancien et Nouveau Testament.",
  path: "/bible",
});

export default async function BiblePage() {
  const books = await getBibleBooks();
  const oldTestament = books.filter((b) => b.testament === "AT");
  const newTestament = books.filter((b) => b.testament === "NT");

  return (
    <div>
      <PageHeader title="La Bible" description="Louis Segond 1910 — texte intégral, domaine public.">
        <BibleSearchBar className="max-w-xl" />
      </PageHeader>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <BookList title="Ancien Testament" books={oldTestament} />
        <BookList title="Nouveau Testament" books={newTestament} className="mt-12" />
      </div>
    </div>
  );
}

function BookList({
  title,
  books,
  className,
}: {
  title: string;
  books: { slug: string; name: string }[];
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <BookOpen size={18} className="text-gold" />
        {title}
        <span className="font-normal text-sm text-muted">({books.length} livres)</span>
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {books.map((book) => (
          <Link
            key={book.slug}
            href={`/bible/${book.slug}`}
            className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
          >
            {book.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
