import { prisma } from "@/lib/db";
import { PAGE_SIZE, paginate, totalPages } from "./shared";

export async function getArtists({
  page = 1,
  query,
  tagSlug,
}: { page?: number; query?: string; tagSlug?: string } = {}) {
  const where =
    query || tagSlug
      ? {
          ...(query ? { name: { contains: query } } : {}),
          ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
        }
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

/** Photos d'artistes pour le slideshow d'arrière-plan du hero de la page d'accueil —
 * seulement ceux avec une photo, sponsorisés en priorité puis les plus récents. */
export function getHeroArtistPhotos(limit = 10) {
  return prisma.artist.findMany({
    where: { photoUrl: { not: null } },
    orderBy: [{ isSponsored: "desc" }, { createdAt: "desc" }],
    select: { id: true, name: true, photoUrl: true },
    take: limit,
  });
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
