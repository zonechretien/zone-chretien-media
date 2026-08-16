import { prisma } from "@/lib/db";
import { paginate, totalPages } from "./shared";

export async function getTestimonies({
  page = 1,
  query,
}: { page?: number; query?: string } = {}) {
  const where = {
    published: true,
    ...(query ? { title: { contains: query } } : {}),
  };

  const [testimonies, count] = await Promise.all([
    prisma.testimony.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginate(page),
    }),
    prisma.testimony.count({ where }),
  ]);

  return { testimonies, pages: totalPages(count) };
}

export function getLatestTestimonies(limit = 4) {
  return prisma.testimony.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function getTestimonyBySlug(slug: string) {
  return prisma.testimony.findUnique({ where: { slug } });
}
