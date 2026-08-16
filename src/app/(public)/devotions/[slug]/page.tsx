import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookMarked, Calendar, HandHeart, Lightbulb } from "lucide-react";
import { getDevotionBySlug } from "@/lib/queries/devotions";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { ShareButtons } from "@/components/shared/share-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const devotion = await getDevotionBySlug(slug);
  if (!devotion) return {};

  const description = devotion.reflection.slice(0, 160);

  return {
    title: devotion.title,
    description,
    alternates: { canonical: `/devotions/${devotion.slug}` },
    openGraph: {
      title: devotion.title,
      description,
      images: devotion.imageUrl ? [devotion.imageUrl] : undefined,
      type: "article",
      url: `/devotions/${devotion.slug}`,
    },
    twitter: { card: "summary_large_image", title: devotion.title, description },
  };
}

export default async function DevotionPage({ params }: Props) {
  const { slug } = await params;
  const devotion = await getDevotionBySlug(slug);
  if (!devotion) notFound();

  trackView("DEVOTION", devotion.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "@id": absoluteUrl(`/devotions/${devotion.slug}`),
          name: devotion.title,
          headline: devotion.title,
          description: devotion.reflection.slice(0, 160),
          image: devotion.imageUrl ?? undefined,
          datePublished: devotion.date.toISOString(),
          url: absoluteUrl(`/devotions/${devotion.slug}`),
          publisher: { "@type": "Organization", name: "Zone-Chrétien Media" },
        }}
      />
      <span className="flex w-fit items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
        <Calendar size={12} /> {formatDate(devotion.date)}
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {devotion.title}
      </h1>

      {devotion.imageUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-navy">
          <Image
            src={devotion.imageUrl}
            alt={devotion.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
            priority
          />
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-gold/30 bg-navy p-6 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold">
          <BookMarked size={14} /> Verset principal
        </div>
        <p className="mt-2 text-lg font-medium leading-snug">« {devotion.mainVerseText} »</p>
        <p className="mt-2 font-semibold text-gold">{devotion.mainVerseRef}</p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Réflexion</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/90">
          {devotion.reflection}
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Lightbulb size={16} /> Application pratique
        </div>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/90">
          {devotion.application}
        </p>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-gold">
          <HandHeart size={16} /> Prière
        </div>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/90">
          {devotion.prayer}
        </p>
      </section>

      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={`/devotions/${devotion.slug}`} title={devotion.title} />
      </div>
    </article>
  );
}
