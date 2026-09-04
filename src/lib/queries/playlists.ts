import { prisma } from "@/lib/db";
import { paginate, totalPages } from "./shared";

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

  return { playlists, pages: totalPages(count) };
}

export function getFeaturedPlaylists(limit = 3) {
  return prisma.playlist.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { songs: true } } },
    take: limit,
  });
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

  return {
    ...playlist,
    songs: playlist.songs.map((ps) => ps.song).filter((song) => song.published),
  };
}
