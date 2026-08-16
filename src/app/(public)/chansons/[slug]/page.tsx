import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Calendar, Tag as TagIcon } from "lucide-react";
import { getSimilarSongs, getSongBySlug } from "@/lib/queries/songs";
import { trackView } from "@/lib/queries/shared";
import { formatDate, formatViews } from "@/lib/utils";
import { AudioPlayer } from "@/components/shared/audio-player";
import { YoutubeEmbed } from "@/components/shared/youtube-embed";
import { ShareButtons } from "@/components/shared/share-buttons";
import { SectionHeading } from "@/components/shared/section-heading";
import { SongCard } from "@/components/cards/song-card";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) return {};

  const title = song.metaTitle ?? `${song.title} — ${song.artist.name}`;
  const description = song.metaDescription ?? song.description ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/chansons/${song.slug}` },
    openGraph: {
      title,
      description,
      images: [song.imageUrl],
      type: "music.song",
      url: `/chansons/${song.slug}`,
    },
    twitter: { card: "summary_large_image", title, description, images: [song.imageUrl] },
  };
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) notFound();

  trackView("SONG", song.id);

  const similarSongs = await getSimilarSongs(song.id, song.categoryId, song.artistId);

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicRecording",
          name: song.title,
          url: absoluteUrl(`/chansons/${song.slug}`),
          image: song.imageUrl,
          datePublished: song.createdAt.toISOString(),
          description: song.description ?? undefined,
          genre: song.category?.name,
          byArtist: {
            "@type": "MusicGroup",
            name: song.artist.name,
            url: absoluteUrl(`/artistes/${song.artist.slug}`),
          },
        }}
      />
      <div className="grid gap-8 sm:grid-cols-[280px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-navy">
          <Image src={song.imageUrl} alt={song.title} fill className="object-cover" sizes="280px" priority />
        </div>

        <div className="flex flex-col justify-center gap-3">
          {song.category && (
            <span className="w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
              {song.category.name}
            </span>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {song.title}
          </h1>
          <Link href={`/artistes/${song.artist.slug}`} className="w-fit text-lg text-gold hover:underline">
            {song.artist.name}
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {formatDate(song.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={14} /> {formatViews(song.views)} vues
            </span>
          </div>
          {song.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <TagIcon size={12} />
              {song.tags.map((tag) => (
                <span key={tag.id} className="rounded-full bg-surface px-2.5 py-1">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <ShareButtons url={`/chansons/${song.slug}`} title={`${song.title} — ${song.artist.name}`} />
        </div>
      </div>

      {song.description && (
        <p className="mt-8 max-w-3xl leading-relaxed text-foreground/90">{song.description}</p>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {song.audioUrl && <AudioPlayer src={song.audioUrl} title={song.title} />}
        {song.youtubeUrl && <YoutubeEmbed url={song.youtubeUrl} title={song.title} />}
      </div>

      {similarSongs.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="À découvrir" title="Chansons similaires" className="mb-6" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similarSongs.map((s) => (
              <SongCard key={s.id} song={s} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
