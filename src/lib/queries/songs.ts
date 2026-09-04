import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { paginate, totalPages } from "./shared";

export async function getSongs({
  page = 1,
  categorySlug,
  artistSlug,
  tagSlug,
  query,
}: {
  page?: number;
  categorySlug?: string;
  artistSlug?: string;
  tagSlug?: string;
  query?: string;
} = {}) {
  const where: Prisma.SongWhereInput = {
    published: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(artistSlug ? { artist: { slug: artistSlug } } : {}),
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { artist: { name: { contains: query } } },
          ],
        }
      : {}),
  };

  const [songs, count] = await Promise.all([
    prisma.song.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { artist: true, category: true },
      ...paginate(page),
    }),
    prisma.song.count({ where }),
  ]);

  return { songs, pages: totalPages(count), total: count };
}

export function getLatestSongs(limit = 8) {
  return prisma.song.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
    take: limit,
  });
}

export function getTopSongs(limit = 5) {
  return prisma.song.findMany({
    where: { published: true },
    orderBy: { views: "desc" },
    include: { artist: true, category: true },
    take: limit,
  });
}

/** Classement basé sur le journal ViewLog (une ligne par vue, datée) plutôt que sur
 * le compteur cumulé Song.views — permet de restreindre aux 7 derniers jours. */
export async function getTopSongsThisWeek(limit = 10) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const grouped = await prisma.viewLog.groupBy({
    by: ["contentId"],
    where: { contentType: "SONG", viewedAt: { gte: since } },
    _count: { contentId: true },
    orderBy: { _count: { contentId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const songs = await prisma.song.findMany({
    where: { id: { in: grouped.map((g) => g.contentId) }, published: true },
    include: { artist: true, category: true },
  });
  const songById = new Map(songs.map((s) => [s.id, s]));

  return grouped
    .map((g) => {
      const song = songById.get(g.contentId);
      return song ? { ...song, weeklyViews: g._count.contentId } : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
}

export function getFeaturedSong() {
  return prisma.song.findFirst({
    where: { published: true, featured: true },
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
  });
}

export function getSongBySlug(slug: string) {
  return prisma.song.findUnique({
    where: { slug },
    include: { artist: true, category: true, tags: true },
  });
}

export async function getSimilarSongs(songId: string, categoryId: string | null, artistId: string, limit = 4) {
  return prisma.song.findMany({
    where: {
      published: true,
      id: { not: songId },
      OR: [
        ...(categoryId ? [{ categoryId }] : []),
        { artistId },
      ],
    },
    include: { artist: true, category: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
