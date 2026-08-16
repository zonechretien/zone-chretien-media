import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { paginate, totalPages } from "./shared";

export async function getArticles({
  page = 1,
  categorySlug,
  query,
}: { page?: number; categorySlug?: string; query?: string } = {}) {
  const where: Prisma.ArticleWhereInput = {
    published: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
          ],
        }
      : {}),
  };

  const [articles, count] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true, author: true, tags: true },
      ...paginate(page),
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, pages: totalPages(count) };
}

export function getLatestArticles(limit = 6) {
  return prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { category: true, author: true },
    take: limit,
  });
}

export function getFeaturedArticle() {
  return prisma.article.findFirst({
    where: { published: true, featured: true },
    orderBy: { createdAt: "desc" },
    include: { category: true, author: true },
  });
}

export function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: { category: true, author: true, tags: true },
  });
}

export function getRelatedArticles(articleId: string, categoryId: string | null, limit = 3) {
  return prisma.article.findMany({
    where: {
      published: true,
      id: { not: articleId },
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { category: true, author: true },
    take: limit,
  });
}
