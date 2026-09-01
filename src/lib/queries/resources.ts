import { prisma } from "@/lib/db";
import type { Prisma, ResourceType } from "@prisma/client";
import { paginate, totalPages } from "./shared";

export async function getResources({
  page = 1,
  type,
  categorySlug,
  tagSlug,
  query,
}: {
  page?: number;
  type?: ResourceType;
  categorySlug?: string;
  tagSlug?: string;
  query?: string;
} = {}) {
  const where: Prisma.ResourceWhereInput = {
    published: true,
    ...(type ? { type } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { author: { contains: query } },
            { description: { contains: query } },
          ],
        }
      : {}),
  };

  const [resources, count] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true, tags: true },
      ...paginate(page),
    }),
    prisma.resource.count({ where }),
  ]);

  return { resources, pages: totalPages(count) };
}

export function getResourceBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    include: { category: true, tags: true },
  });
}
