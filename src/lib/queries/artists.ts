import { prisma } from "@/lib/db";
import { PAGE_SIZE, paginate, totalPages } from "./shared";

export async function getArtists({
  page = 1,
  query,
}: { page?: number; query?: string } = {}) {
  const where = query
    ? { name: { contains: query } }
    : undefined;

  const [artists, count] = await Promise.all([
    prisma.artist.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { songs: true } } },
      ...paginate(page),
    }),
    prisma.artist.count({ where }),
  ]);

  return { artists, pages: totalPages(count) };
}

export function getPopularArtists(limit = 8) {
  return prisma.artist.findMany({
    orderBy: { songs: { _count: "desc" } },
    include: { _count: { select: { songs: true } } },
    take: limit,
  });
}

export function getArtistBySlug(slug: string) {
  return prisma.artist.findUnique({
    where: { slug },
    include: {
      songs: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: { artist: true, category: true },
      },
    },
  });
}

export const ARTISTS_PAGE_SIZE = PAGE_SIZE;
