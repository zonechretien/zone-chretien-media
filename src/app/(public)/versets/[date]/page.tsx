import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVerseByDateSlug } from "@/lib/queries/verses";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { ShareButtons } from "@/components/shared/share-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { VerseMeditationToggle } from "@/components/shared/verse-meditation-toggle";

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

  const meditation =
    verse.meditationReflection && verse.meditationApplication && verse.meditationPrayer
      ? {
          reflection: verse.meditationReflection,
          application: verse.meditationApplication,
          prayer: verse.meditationPrayer,
        }
      : null;

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

      <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-navy px-6 py-14 text-center text-white shadow-2xl shadow-black/30 sm:px-14 sm:py-16">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 select-none font-display text-[150px] leading-none text-gold/10 sm:text-[200px]"
        >
          “
        </span>

        <p className="relative text-[11px] font-medium uppercase tracking-[0.25em] text-gold/70">
          Verset du jour <span className="mx-1.5 text-gold/40">·</span> {formatDate(verse.date)}
        </p>

        <p className="relative mx-auto mt-8 max-w-2xl font-display text-2xl italic leading-snug text-white sm:text-3xl">
          {verse.text}
        </p>

        <div className="relative mx-auto mt-7 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-gold/40" aria-hidden />
          <p className="text-base font-semibold tracking-wide text-gold sm:text-lg">{verse.reference}</p>
          <span className="h-px w-8 bg-gold/40" aria-hidden />
        </div>

        <div className="relative mt-8 flex justify-center">
          <ShareButtons
            url={`/versets/${date}`}
            title={`${verse.reference} — ${verse.text}`}
            dark
            compact
          />
        </div>
      </div>

      {meditation && <VerseMeditationToggle meditation={meditation} />}
    </article>
  );
}
