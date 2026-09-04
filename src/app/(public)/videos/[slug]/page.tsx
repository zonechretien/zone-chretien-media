import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Eye, LayoutGrid } from "lucide-react";
import { getSimilarVideos, getVideoBySlug } from "@/lib/queries/videos";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { YoutubeEmbed } from "@/components/shared/youtube-embed";
import { ShareButtons } from "@/components/shared/share-buttons";
import { ReportContentLink } from "@/components/shared/report-content-link";
import { VideoCard } from "@/components/cards/video-card";
import { SongArtistCard } from "@/components/songs/song-artist-card";
import { SectionLabel } from "@/components/songs/section-label";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { renderMarkdown, markdownToText } from "@/lib/markdown";
import { getYoutubeThumbnail } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) return {};

  const title = `${video.title} — ${video.artist ? video.artist.name : "Zone-Chrétien Media"}`;
  const description =
    (video.description ? markdownToText(video.description) : undefined) ?? (video.artist?.bio ?? undefined);
  const image = video.thumbnailUrl ?? getYoutubeThumbnail(video.youtubeUrl) ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/videos/${video.slug}` },
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      type: "video.other",
      url: `/videos/${video.slug}`,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) notFound();

  trackView("VIDEO", video.id);

  const similarVideos = await getSimilarVideos(video.id, video.categoryId, video.artistId);
  const plainDescription = video.description ? markdownToText(video.description) : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: video.title,
          url: absoluteUrl(`/videos/${video.slug}`),
          thumbnailUrl: video.thumbnailUrl ?? getYoutubeThumbnail(video.youtubeUrl) ?? undefined,
          uploadDate: (video.publishedAt ?? video.createdAt).toISOString(),
          description: plainDescription ?? undefined,
          embedUrl: video.youtubeUrl,
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 font-body text-[12.5px] text-brand-gray-dark">
        <Link href="/" className="text-brand-blue hover:underline dark:text-brand-text">Accueil</Link>
        <span>/</span>
        <Link href="/videos" className="text-brand-blue hover:underline dark:text-brand-text">Vidéos</Link>
        <span>/</span>
        <span className="truncate">{video.title}</span>
      </div>

      {video.category && (
        <span className="mb-3 inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
          {video.category.name}
        </span>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{video.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gold" />
          {formatDate(video.publishedAt ?? video.createdAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={13} className="text-gold" />
          {video.views.toLocaleString("fr-FR")} vues
        </span>
      </div>

      <div className="mt-8">
        <YoutubeEmbed url={video.youtubeUrl} title={video.title} />
      </div>

      {video.description && (
        <div
          className="prose prose-neutral mt-8 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(video.description) }}
        />
      )}

      {video.artist && (
        <div className="mt-8">
          <SectionLabel>L&apos;artiste</SectionLabel>
          <SongArtistCard artist={video.artist} />
        </div>
      )}

      <div className="mt-8 border-t border-border pt-6">
        <p className="mb-3 text-sm font-semibold text-muted">Partager cette vidéo</p>
        <ShareButtons url={`/videos/${video.slug}`} title={video.title} />
      </div>

      <ReportContentLink
        contentType="VIDEO"
        contentId={video.id}
        contentTitle={video.title}
        contentUrl={absoluteUrl(`/videos/${video.slug}`)}
      />

      {similarVideos.length > 0 && (
        <section className="mt-10">
          <SectionLabel icon={LayoutGrid}>Vidéos similaires</SectionLabel>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {similarVideos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
