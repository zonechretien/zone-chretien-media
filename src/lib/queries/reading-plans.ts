import { prisma } from "@/lib/db";

export function getReadingPlans() {
  return prisma.readingPlan.findMany({
    where: { published: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationDays: true,
      coverImageUrl: true,
    },
  });
}

export function getReadingPlanBySlug(slug: string) {
  return prisma.readingPlan.findFirst({
    where: { slug, published: true },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { passages: { orderBy: { position: "asc" } } },
      },
    },
  });
}
