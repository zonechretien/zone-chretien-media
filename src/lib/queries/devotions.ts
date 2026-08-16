import { prisma } from "@/lib/db";
import { paginate, totalPages } from "./shared";

export async function getDevotions({
  page = 1,
  query,
}: { page?: number; query?: string } = {}) {
  const where = {
    published: true,
    ...(query ? { title: { contains: query } } : {}),
  };

  const [devotions, count] = await Promise.all([
    prisma.devotion.findMany({
      where,
      orderBy: { date: "desc" },
      ...paginate(page),
    }),
    prisma.devotion.count({ where }),
  ]);

  return { devotions, pages: totalPages(count) };
}

export function getLatestDevotions(limit = 6) {
  return prisma.devotion.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export function getDevotionBySlug(slug: string) {
  return prisma.devotion.findUnique({ where: { slug } });
}

export function getTodayDevotion() {
  return prisma.devotion.findFirst({
    where: { published: true },
    orderBy: { date: "desc" },
  });
}
