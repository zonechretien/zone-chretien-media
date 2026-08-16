import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { paginate, totalPages } from "./shared";

export async function getInspirations({
  page = 1,
  categorySlug,
  query,
}: { page?: number; categorySlug?: string; query?: string } = {}) {
  const where: Prisma.InspirationWhereInput = {
    published: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(query ? { title: { contains: query } } : {}),
  };

  const [inspirations, count] = await Promise.all([
    prisma.inspiration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true },
      ...paginate(page),
    }),
    prisma.inspiration.count({ where }),
  ]);

  return { inspirations, pages: totalPages(count) };
}

export function getLatestInspirations(limit = 6) {
  return prisma.inspiration.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: limit,
  });
}

export function getInspirationBySlug(slug: string) {
  return prisma.inspiration.findUnique({
    where: { slug },
    include: { category: true },
  });
}
