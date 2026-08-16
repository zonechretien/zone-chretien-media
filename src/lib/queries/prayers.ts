import { prisma } from "@/lib/db";
import type { Prisma, PrayerCategory } from "@prisma/client";
import { paginate, totalPages } from "./shared";

export async function getPrayers({
  page = 1,
  category,
  query,
}: { page?: number; category?: PrayerCategory; query?: string } = {}) {
  const where: Prisma.PrayerWhereInput = {
    published: true,
    ...(category ? { category } : {}),
    ...(query ? { title: { contains: query } } : {}),
  };

  const [prayers, count] = await Promise.all([
    prisma.prayer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginate(page),
    }),
    prisma.prayer.count({ where }),
  ]);

  return { prayers, pages: totalPages(count) };
}

export function getPrayerBySlug(slug: string) {
  return prisma.prayer.findUnique({ where: { slug } });
}
