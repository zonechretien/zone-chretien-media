import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { paginate, totalPages } from "./shared";

export async function getVideos({
  page = 1,
  categorySlug,
  query,
}: { page?: number; categorySlug?: string; query?: string } = {}) {
  const where: Prisma.VideoWhereInput = {
    published: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(query ? { title: { contains: query } } : {}),
  };

  const [videos, count] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { artist: true, category: true },
      ...paginate(page),
    }),
    prisma.video.count({ where }),
  ]);

  return { videos, pages: totalPages(count) };
}

export function getLatestVideos(limit = 6) {
  return prisma.video.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
    take: limit,
  });
}

export function getVideoBySlug(slug: string) {
  return prisma.video.findFirst({
    where: { slug, published: true },
    include: { artist: true, category: true },
  });
}

export function getSimilarVideos(id: string, categoryId: string | null, artistId: string | null, limit = 4) {
  if (!categoryId && !artistId) return Promise.resolve([]);
  return prisma.video.findMany({
    where: {
      published: true,
      id: { not: id },
      OR: [...(categoryId ? [{ categoryId }] : []), ...(artistId ? [{ artistId }] : [])],
    },
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
    take: limit,
  });
}
