import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getBibleBooks, getBibleVersions } from "@/lib/queries/bible";
import { getVerseOfDay } from "@/lib/queries/verses";
import { getReadingPlans } from "@/lib/queries/reading-plans";
import { groupBooks } from "@/lib/bible-book-groups";
import { PageHeader } from "@/components/shared/page-header";
import { BibleSearchBar } from "@/components/bible/bible-search-bar";
import { BibleVersionSelector } from "@/components/bible/bible-version-selector";
import { VerseOfDay } from "@/components/home/verse-of-day";
import { ContinueReadingPlanBlock } from "@/components/bible/continue-reading-plan-block";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "La Bible",
  description: "La Bible Louis Segond 1910, texte intégral, à lire et rechercher gratuitement — Ancien et Nouveau Testament.",
  path: "/bible",
});

export default async function BiblePage() {
  const [books, verse, plans, versions] = await Promise.all([
    getBibleBooks(),
    getVerseOfDay(),
    getReadingPlans(),
    getBibleVersions(),
  ]);
  const oldTestament = books.filter((b) => b.testament === "AT");
  const newTestament = books.filter((b) => b.testament === "NT");

  return (
    <div>
      <PageHeader title="La Bible" description="Louis Segond 1910 — texte intégral, domaine public.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BibleSearchBar className="max-w-xl sm:flex-1" />
          <Suspense fallback={null}>
            <BibleVersionSelector versions={versions} />
          </Suspense>
        </div>
      </PageHeader>

      {verse && (
        <div className="pt-10">
          <VerseOfDay verse={verse} />
        </div>
      )}

      <ContinueReadingPlanBlock plans={plans} />

      <div className="px-4 py-10 sm:px-6 lg:px-0">
        <div className="grid gap-10 lg:grid-cols-2">
          <TestamentColumn title="Ancien Testament" books={oldTestament} />
          <TestamentColumn title="Nouveau Testament" books={newTestament} />
        </div>
      </div>
    </div>
  );
}

function TestamentColumn({
  title,
  books,
}: {
  title: string;
  books: { slug: string; name: string; testament: "AT" | "NT" }[];
}) {
  const groups = groupBooks(books);

  return (
    <div>
      <h2 className="mb-5 text-lg font-bold text-foreground">
        {title} <span className="font-normal text-sm text-muted">({books.length} livres)</span>
      </h2>
      <div className="space-y-6">
        {groups.map(({ group, books: groupBooksList }) => (
          <section key={group.key}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold">{group.label}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {groupBooksList.map((book) => (
                <Link
                  key={book.slug}
                  href={`/bible/${book.slug}`}
                  className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
                >
                  {book.name}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
