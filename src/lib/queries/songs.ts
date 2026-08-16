import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { paginate, totalPages } from "./shared";

export async function getSongs({
  page = 1,
  categorySlug,
  artistSlug,
  query,
}: {
  page?: number;
  categorySlug?: string;
  artistSlug?: string;
  query?: string;
} = {}) {
  const where: Prisma.SongWhereInput = {
    published: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(artistSlug ? { artist: { slug: artistSlug } } : {}),
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
