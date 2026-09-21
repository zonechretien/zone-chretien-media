import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Calendar, FileText, Globe, UserRound } from "lucide-react";
import { getResourceBySlug } from "@/lib/queries/resources";
import { trackView } from "@/lib/queries/shared";
import { formatDate, getYoutubeId } from "@/lib/utils";
import { RESOURCE_TYPE_LABELS } from "@/lib/validations/resources";
import { ShareButtons } from "@/components/shared/share-buttons";
import { YoutubeEmbed } from "@/components/shared/youtube-embed";
import { JsonLd } from "@/components/shared/json-ld";
import { ResourceAudioButton } from "@/components/resources/resource-audio-button";
import { ResourcePdfButton } from "@/components/resources/resource-pdf-button";
import { ResourceDownloadLink } from "@/components/resources/resource-download-link";
import { absoluteUrl } from "@/lib/seo";
import { renderMarkdown, markdownToText } from "@/lib/markdown";
import { isPdfEmbeddable } from "@/lib/pdf-embed-check";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) return {};

  const description = resource.description ? markdownToText(resource.description).slice(0, 160) : undefined;

  return {
    title: resource.title,
    description,
    alternates: { canonical: `/bibliotheque/${resource.slug}` },
    openGraph: {
      title: resource.title,
      description,
      images: resource.coverImageUrl ? [resource.coverImageUrl] : undefined,
      type: "article",
      url: `/bibliotheque/${resource.slug}`,
    },
    twitter: { card: "summary_large_image", title: resource.title, description },
  };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) notFound();

  trackView("RESOURCE", resource.id);

  const youtubeId = getYoutubeId(resource.fileUrl);
  const isBook = resource.type === "BOOK";
  const isVideo = resource.type === "VIDEO_SERMON" || (["CONFERENCE", "COURSE"].includes(resource.type) && !!youtubeId);
  const isAudio = resource.type === "AUDIO_SERMON";
  // Étude biblique uniquement : aperçu en modale plutôt qu'un lien externe direct
  // (Conférence/Cours en PDF gardent le comportement existant, volontairement inchangé).
  // Livre a son propre lecteur d'extrait dédié (/lire), voir plus bas.
  const isPreviewablePdf = resource.type === "BIBLE_STUDY";
  const pdfPreviewable = isPreviewablePdf ? await isPdfEmbeddable(resource.fileUrl) : false;

  const jsonLd = (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: resource.title,
        headline: resource.title,
        description: resource.description ? markdownToText(resource.description).slice(0, 160) : undefined,
        image: resource.coverImageUrl ?? undefined,
        author: resource.author ? { "@type": "Person", name: resource.author } : undefined,
        datePublished: (resource.publishedAt ?? resource.createdAt).toISOString(),
        url: absoluteUrl(`/bibliotheque/${resource.slug}`),
      }}
    />
  );

  if (isBook) {
    const infos = [
      resource.pageCount ? { icon: BookOpen, label: `${resource.pageCount} pages` } : null,
      resource.language ? { icon: Globe, label: resource.language } : null,
      resource.publicationYear ? { icon: Calendar, label: String(resource.publicationYear) } : null,
      resource.fileSizeLabel ? { icon: FileText, label: resource.fileSizeLabel } : null,
    ].filter((i): i is { icon: typeof BookOpen; label: string } => i !== null);

    return (
      <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {jsonLd}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="mx-auto w-full max-w-[220px] shrink-0 lg:mx-0 lg:w-64">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-navy shadow-lg">
              {resource.coverImageUrl ? (
                <Image
                  src={resource.coverImageUrl}
                  alt={resource.title}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(min-width: 1024px) 256px, 220px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gold">
                  <BookOpen size={40} />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span className="w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
              {RESOURCE_TYPE_LABELS.BOOK}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {resource.title}
            </h1>
            {resource.author && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <UserRound size={14} /> {resource.author}
              </p>
            )}

            {infos.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {infos.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-muted"
                  >
                    <Icon size={15} className="shrink-0 text-gold" />
                    {label}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Link
                href={`/bibliotheque/${resource.slug}/lire`}
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light px-6 py-3 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(232,160,32,0.4)]"
              >
                <BookOpen size={16} />
                Lire un extrait
              </Link>
            </div>
          </div>
        </div>

        {resource.description && (
          <div
            className="prose prose-neutral mt-10 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.description) }}
          />
        )}

        {resource.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 border-t border-border pt-6">
          <ShareButtons url={`/bibliotheque/${resource.slug}`} title={resource.title} />
        </div>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {jsonLd}

      <span className="w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
        {RESOURCE_TYPE_LABELS[resource.type]}
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {resource.title}
      </h1>
      <div className="mt-3 flex items-center gap-4 text-sm text-muted">
        {resource.author && (
          <span className="flex items-center gap-1">
            <UserRound size={14} /> {resource.author}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={14} /> {formatDate(resource.publishedAt ?? resource.createdAt)}
        </span>
      </div>

      {resource.coverImageUrl && !isVideo && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-navy">
          <Image
            src={resource.coverImageUrl}
            alt={resource.title}
            fill
            unoptimized
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
            priority
          />
        </div>
      )}

      <div className="mt-8">
        {isVideo ? (
          <YoutubeEmbed url={resource.fileUrl} title={resource.title} />
        ) : isAudio ? (
          <ResourceAudioButton
            track={{
              id: resource.id,
              slug: resource.slug,
              title: resource.title,
              artistName: resource.author ?? "Zone-Chrétien",
              artistSlug: "",
              imageUrl: resource.coverImageUrl ?? "/icons/icon-512",
              audioUrl: resource.fileUrl,
              href: `/bibliotheque/${resource.slug}`,
            }}
          />
        ) : isPreviewablePdf ? (
          <ResourcePdfButton
            id={resource.id}
            url={resource.fileUrl}
            title={resource.title}
            previewable={pdfPreviewable}
          />
        ) : (
          <ResourceDownloadLink id={resource.id} url={resource.fileUrl} label="Consulter" />
        )}
      </div>

      {resource.description && (
        <div
          className="prose prose-neutral mt-8 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.description) }}
        />
      )}

      {resource.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={`/bibliotheque/${resource.slug}`} title={resource.title} />
      </div>
    </article>
  );
}
