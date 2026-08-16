import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Quote } from "lucide-react";
import { getVerseByDateSlug } from "@/lib/queries/verses";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { ShareButtons } from "@/components/shared/share-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const verse = await getVerseByDateSlug(date);
  if (!verse) return {};

  const title = `${verse.reference} — Verset du ${formatDate(verse.date)}`;

  return {
    title,
    description: verse.text,
    alternates: { canonical: `/versets/${date}` },
    openGraph: { title, description: verse.text, type: "article", url: `/versets/${date}` },
    twitter: { card: "summary_large_image", title, description: verse.text },
  };
}

export default async function VersePage({ params }: Props) {
  const { date } = await params;
  const verse = await getVerseByDateSlug(date);
  if (!verse) notFound();

  trackView("VERSE", verse.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Quotation",
          text: verse.text,
          spokenByCharacter: verse.reference,
          isPartOf: { "@type": "Book", name: "Bible" },
          datePublished: verse.date.toISOString(),
          url: absoluteUrl(`/versets/${date}`),
        }}
      />
      <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-navy to-navy-light px-6 py-12 text-center text-white shadow-xl sm:px-12">
        <Quote size={40} className="mx-auto text-gold/60" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Verset du {formatDate(verse.date)}
        </p>
        <p className="mx-auto mt-6 max-w-xl text-2xl font-medium leading-snug sm:text-3xl">
          « {verse.text} »
        </p>
        <p className="mt-6 text-xl font-semibold text-gold">{verse.reference}</p>
      </div>

      {verse.explanation && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Explication</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/90">
            {verse.explanation}
          </p>
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <ShareButtons
          url={`/versets/${date}`}
          title={`${verse.reference} — ${verse.text}`}
        />
      </div>
    </article>
  );
}
