import { prisma } from "@/lib/db";
import type { ContentType } from "@prisma/client";

export function getCategories(type?: ContentType) {
  return prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });
}

export function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getCategoriesWithCounts(type: ContentType) {
  const categories = await prisma.category.findMany({
    where: { type },
    orderBy: { name: "asc" },
  });

  const counts = await Promise.all(
    categories.map((category) => {
      switch (type) {
        case "SONG":
          return prisma.song.count({
            where: { categoryId: category.id, published: true },
          });
        case "ARTICLE":
          return prisma.article.count({
            where: { categoryId: category.id, published: true },
          });
        case "VIDEO":
          return prisma.video.count({
            where: { categoryId: category.id, published: true },
          });
        case "INSPIRATION":
          return prisma.inspiration.count({
            where: { categoryId: category.id, published: true },
          });
        default:
          return Promise.resolve(0);
      }
    }),
  );

  return categories.map((category, i) => ({
    ...category,
    count: counts[i],
  }));
}
