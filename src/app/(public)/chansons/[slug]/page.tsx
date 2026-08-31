import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PenLine, Tag as TagIcon, LayoutGrid } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/social-icons";
import { getSimilarSongs, getSongBySlug, getTopSongs } from "@/lib/queries/songs";
import { getLatestArticles } from "@/lib/queries/articles";
import { getPopularArtists } from "@/lib/queries/artists";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { YoutubeEmbed } from "@/components/shared/youtube-embed";
import { ShareButtons } from "@/components/shared/share-buttons";
import { SongCard } from "@/components/cards/song-card";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { renderMarkdown, markdownToText } from "@/lib/markdown";
import { SongHero } from "@/components/songs/song-hero";
import { SongLyrics } from "@/components/songs/song-lyrics";
import { SongArtistCard } from "@/components/songs/song-artist-card";
import { SectionLabel } from "@/components/songs/section-label";
import { SongSidebar } from "@/components/songs/song-sidebar";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) return {};

  const title = song.metaTitle ?? `${song.title} — ${song.artist.name}`;
  const description =
    song.metaDescription ??
    (song.description ? markdownToText(song.description) : undefined) ??
    (song.artist.bio ?? undefined);

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

  const [similarSongs, recentArticles, topSongs, popularArtists] = await Promise.all([
    getSimilarSongs(song.id, song.categoryId, song.artistId),
    getLatestArticles(4),
    getTopSongs(5),
    getPopularArtists(4),
  ]);

  const plainDescription = song.description ? markdownToText(song.description) : null;
  const readingMinutes = plainDescription ? Math.max(1, Math.round(plainDescription.split(/\s+/).length / 200)) : null;
  const excerpt = plainDescription ? (plainDescription.length > 220 ? `${plainDescription.slice(0, 220).trim()}…` : plainDescription) : null;

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicRecording",
          name: song.title,
          url: absoluteUrl(`/chansons/${song.slug}`),
          image: song.imageUrl,
          datePublished: (song.publishedAt ?? song.createdAt).toISOString(),
          description: plainDescription ?? undefined,
          genre: song.category?.name,
          byArtist: {
            "@type": "MusicGroup",
            name: song.artist.name,
            url: absoluteUrl(`/artistes/${song.artist.slug}`),
          },
        }}
      />

      <SongHero
        data={{
          track: {
            id: song.id,
            slug: song.slug,
            title: song.title,
            artistName: song.artist.name,
            artistSlug: song.artist.slug,
            imageUrl: song.imageUrl,
            audioUrl: song.audioUrl ?? "",
          },
          categoryName: song.category?.name ?? null,
          featured: song.featured,
          dateLabel: formatDate(song.publishedAt ?? song.createdAt),
          views: song.views,
          readingMinutes,
          excerpt,
          hasLyrics: !!song.lyrics,
          hasVideo: !!song.youtubeUrl,
        }}
      />

      <div className="border-b border-brand-gray-light bg-brand-white py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 font-body text-[12.5px] text-brand-gray-dark sm:px-6 lg:px-8">
          <Link href="/" className="text-brand-blue hover:underline dark:text-brand-text">Accueil</Link>
          <ChevronRight size={10} />
          <Link href="/chansons" className="text-brand-blue hover:underline dark:text-brand-text">Chansons</Link>
          {song.category && (
            <>
              <ChevronRight size={10} />
              <span>{song.category.name}</span>
            </>
          )}
          <ChevronRight size={10} />
          <span className="truncate">{song.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-9 lg:px-8">
      <div className="min-w-0">
        {song.youtubeUrl && (
          <div id="video" className="mb-7 scroll-mt-24 overflow-hidden rounded-2xl bg-brand-white shadow-brand-sm">
            <div className="flex items-center gap-2.5 border-b border-brand-gray-light px-5 py-4">
              <YoutubeIcon size={20} className="text-brand-red" />
              <h3 className="font-body text-[15px] font-semibold text-brand-text">Regarder le clip officiel</h3>
            </div>
            <YoutubeEmbed url={song.youtubeUrl} title={song.title} />
          </div>
        )}

        {song.description && (
          <div className="mb-7 rounded-2xl bg-brand-white p-6 shadow-brand-sm sm:p-8">
            <SectionLabel icon={PenLine}>À propos du morceau</SectionLabel>
            <div
              className="prose prose-neutral max-w-none font-body text-[15.5px] leading-[1.8] text-brand-text/90"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(song.description) }}
            />
          </div>
        )}

        {song.lyrics && <SongLyrics lyrics={song.lyrics} />}

        <div className="mb-7">
          <SectionLabel>L&apos;artiste</SectionLabel>
          <SongArtistCard artist={song.artist} />
        </div>

        <div className="mb-7 rounded-2xl bg-brand-white p-6 shadow-brand-sm sm:p-7">
          <p className="mb-4 font-body text-[13px] font-semibold uppercase tracking-wide text-brand-gray-dark">
            Partager cette chanson
          </p>
          <ShareButtons url={`/chansons/${song.slug}`} title={`${song.title} — ${song.artist.name}`} />
        </div>

        {song.tags.length > 0 && (
          <div className="mb-9">
            <SectionLabel icon={TagIcon}>Tags</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {song.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border-[1.5px] border-brand-gray-light bg-brand-off-white px-3.5 py-1.5 font-body text-[12.5px] text-brand-gray-dark"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {similarSongs.length > 0 && (
          <section>
            <SectionLabel icon={LayoutGrid}>Chansons similaires</SectionLabel>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {similarSongs.map((s) => (
                <SongCard key={s.id} song={s} queue={similarSongs} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mt-9 lg:sticky lg:top-24 lg:mt-0 lg:self-start">
        <SongSidebar recentArticles={recentArticles} topSongs={topSongs} popularArtists={popularArtists} />
      </div>
      </div>
    </article>
  );
}
