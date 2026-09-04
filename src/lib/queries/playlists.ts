import { prisma } from "@/lib/db";
import type { Playlist, PlaylistType } from "@prisma/client";
import { paginate, totalPages } from "./shared";
import { getTopSongs, getTopSongsThisWeek } from "./songs";

const SONG_ROW_SELECT = {
  id: true,
  slug: true,
  title: true,
  imageUrl: true,
  audioUrl: true,
  sourceType: true,
  published: true,
  artist: { select: { name: true, slug: true } },
} as const;

type PlaylistSongRow = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  audioUrl: string | null;
  sourceType: string;
  published: boolean;
  artist: { name: string; slug: string };
};

/** Chansons d'une playlist spéciale — jamais stockées (pas d'entrées PlaylistSong),
 * recalculées à chaque requête à partir des vues. Limité à 10 (le "Top 10"). */
async function getDynamicSongsForType(type: PlaylistType, limit = 10): Promise<PlaylistSongRow[]> {
  const songs = type === "TOP_SEMAINE" ? await getTopSongsThisWeek(limit) : type === "TOP_TOUJOURS" ? await getTopSongs(limit) : [];
  return songs.map((song) => ({
    id: song.id,
    slug: song.slug,
    title: song.title,
    imageUrl: song.imageUrl,
    audioUrl: song.audioUrl,
    sourceType: song.sourceType,
    published: song.published,
    artist: { name: song.artist.name, slug: song.artist.slug },
  }));
}

/** Remplace `_count.songs` (issu de la relation PlaylistSong, toujours 0 pour une
 * playlist spéciale) par le nombre réel de chansons calculées dynamiquement. */
async function withDynamicCounts<T extends Playlist & { _count: { songs: number } }>(playlists: T[]): Promise<T[]> {
  const specials = playlists.filter((p) => p.type !== "EDITORIALE");
  if (specials.length === 0) return playlists;

  const counts = await Promise.all(
    specials.map(async (p) => [p.id, (await getDynamicSongsForType(p.type)).length] as const),
  );
  const countMap = new Map(counts);

  return playlists.map((p) => (countMap.has(p.id) ? { ...p, _count: { songs: countMap.get(p.id)! } } : p));
}

export async function getPlaylists({ page = 1 }: { page?: number } = {}) {
  const where = { published: true };

  const [playlists, count] = await Promise.all([
    prisma.playlist.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { songs: true } } },
      ...paginate(page),
    }),
    prisma.playlist.count({ where }),
  ]);

  return { playlists: await withDynamicCounts(playlists), pages: totalPages(count) };
}

/** Playlists mises en avant sur la page d'accueil — le Top 10 de la semaine est
 * toujours placé en tête quand il est publié, les autres complètent la liste. */
export async function getFeaturedPlaylists(limit = 3) {
  const topWeek = await prisma.playlist.findFirst({
    where: { type: "TOP_SEMAINE", published: true },
    include: { _count: { select: { songs: true } } },
  });

  const rest = await prisma.playlist.findMany({
    where: { published: true, ...(topWeek ? { id: { not: topWeek.id } } : {}) },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { songs: true } } },
    take: topWeek ? Math.max(0, limit - 1) : limit,
  });

  const playlists = topWeek ? [topWeek, ...rest] : rest;
  return withDynamicCounts(playlists);
}

export async function getPlaylistBySlug(slug: string) {
  const playlist = await prisma.playlist.findFirst({
    where: { slug, published: true },
    include: {
      songs: {
        orderBy: { position: "asc" },
        include: { song: { select: SONG_ROW_SELECT } },
      },
    },
  });
  if (!playlist) return null;

  const songs: PlaylistSongRow[] =
    playlist.type === "EDITORIALE"
      ? playlist.songs.map((ps) => ps.song).filter((song) => song.published)
      : await getDynamicSongsForType(playlist.type);

  return { ...playlist, songs };
}
