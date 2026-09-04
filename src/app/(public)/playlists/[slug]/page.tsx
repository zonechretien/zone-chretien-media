import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getPlaylistBySlug } from "@/lib/queries/playlists";
import { PlaylistHero } from "@/components/playlists/playlist-hero";
import { PlaylistTrackList } from "@/components/playlists/playlist-track-list";
import { ShareButtons } from "@/components/shared/share-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";
import type { Track } from "@/components/shared/audio-player-provider";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const playlist = await getPlaylistBySlug(slug);
  if (!playlist) return {};

  const title = playlist.metaTitle ?? `${playlist.title} — Playlist`;
  const description = playlist.metaDescription ?? playlist.description ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/playlists/${playlist.slug}` },
    openGraph: {
      title,
      description,
      images: playlist.imageUrl ? [playlist.imageUrl] : undefined,
      type: "music.playlist",
      url: `/playlists/${playlist.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: playlist.imageUrl ? [playlist.imageUrl] : undefined,
    },
  };
}

export default async function PlaylistPage({ params }: Props) {
  const { slug } = await params;
  const playlist = await getPlaylistBySlug(slug);
  if (!playlist) notFound();

  const tracks: Track[] = playlist.songs.map((song) => ({
    id: song.id,
    slug: song.slug,
    title: song.title,
    artistName: song.artist.name,
    artistSlug: song.artist.slug,
    imageUrl: song.imageUrl,
    audioUrl: song.audioUrl ?? "",
    playable: song.sourceType === "FICHIER_DIRECT",
  }));

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicPlaylist",
          name: playlist.title,
          url: absoluteUrl(`/playlists/${playlist.slug}`),
          image: playlist.imageUrl ?? undefined,
          description: playlist.description ?? undefined,
          numTracks: tracks.length,
          datePublished: (playlist.publishedAt ?? playlist.createdAt).toISOString(),
          track: tracks.map((t) => ({
            "@type": "MusicRecording",
            name: t.title,
            url: absoluteUrl(`/chansons/${t.slug}`),
            byArtist: { "@type": "MusicGroup", name: t.artistName },
          })),
        }}
      />

      <div className="border-b border-brand-gray-light bg-brand-white py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 font-body text-[12.5px] text-brand-gray-dark sm:px-6 lg:px-8">
          <Link href="/" className="text-brand-blue hover:underline dark:text-brand-text">Accueil</Link>
          <ChevronRight size={10} />
          <Link href="/playlists" className="text-brand-blue hover:underline dark:text-brand-text">Playlists</Link>
          <ChevronRight size={10} />
          <span className="truncate">{playlist.title}</span>
        </div>
      </div>

      <PlaylistHero
        data={{
          title: playlist.title,
          description: playlist.description,
          imageUrl: playlist.imageUrl,
          tracks,
          type: playlist.type,
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-9 sm:px-6 lg:px-8">
        {tracks.length > 0 ? (
          <PlaylistTrackList tracks={tracks} />
        ) : (
          <p className="py-10 text-center text-sm text-muted">Cette playlist ne contient pas encore de chanson.</p>
        )}

        <div className="mt-8 rounded-2xl bg-brand-white p-6 shadow-brand-sm sm:p-7">
          <p className="mb-4 font-body text-[13px] font-semibold uppercase tracking-wide text-brand-gray-dark">
            Partager cette playlist
          </p>
          <ShareButtons url={`/playlists/${playlist.slug}`} title={playlist.title} />
        </div>
      </div>
    </article>
  );
}
