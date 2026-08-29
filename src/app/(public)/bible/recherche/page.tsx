import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { searchBible } from "@/lib/queries/bible";
import { PageHeader } from "@/components/shared/page-header";
import { BibleSearchBar } from "@/components/bible/bible-search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Recherche biblique",
  description: "Recherchez un mot ou une phrase dans toute la Bible Louis Segond 1910.",
  path: "/bible/recherche",
  noIndex: true,
});

export default async function BibleSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q ? await searchBible(q) : [];

  return (
    <div>
      <PageHeader
        title="Recherche biblique"
        description={q ? `Résultats pour « ${q} »` : "Entrez un mot ou une phrase à rechercher dans toute la Bible."}
      >
        <BibleSearchBar defaultValue={q} className="max-w-xl" />
      </PageHeader>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {!q ? (
          <EmptyState icon={SearchX} title="Entrez un terme de recherche" />
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucun verset trouvé"
            description="Essayez un autre mot-clé, ou vérifiez l'orthographe."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {results.map((r) => (
              <li key={`${r.bookSlug}-${r.chapterNumber}-${r.verseNumber}`}>
                <Link
                  href={`/bible/${r.bookSlug}/${r.chapterNumber}#v${r.verseNumber}`}
                  className="block rounded-xl border border-border bg-surface-elevated p-4 transition hover:border-gold"
                >
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-navy dark:text-gold-soft">
                    {r.bookName} {r.chapterNumber}:{r.verseNumber}
                  </p>
                  <p
                    className="text-sm leading-relaxed text-foreground/90 [&_mark]:rounded [&_mark]:bg-gold/25 [&_mark]:px-0.5 [&_mark]:text-foreground [&_mark]:not-italic"
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
