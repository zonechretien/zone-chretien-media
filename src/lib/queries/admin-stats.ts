import { prisma } from "@/lib/db";

export async function getDashboardCounts() {
  const [songs, articles, devotions, testimonies, artists, videos, inspirations, prayers, verses] =
    await Promise.all([
      prisma.song.count(),
      prisma.article.count(),
      prisma.devotion.count(),
      prisma.testimony.count(),
      prisma.artist.count(),
      prisma.video.count(),
      prisma.inspiration.count(),
      prisma.prayer.count(),
      prisma.verse.count(),
    ]);

  const viewsAgg = await prisma.$transaction([
    prisma.song.aggregate({ _sum: { views: true } }),
    prisma.article.aggregate({ _sum: { views: true } }),
    prisma.video.aggregate({ _sum: { views: true } }),
    prisma.inspiration.aggregate({ _sum: { views: true } }),
    prisma.devotion.aggregate({ _sum: { views: true } }),
    prisma.prayer.aggregate({ _sum: { views: true } }),
    prisma.verse.aggregate({ _sum: { views: true } }),
    prisma.testimony.aggregate({ _sum: { views: true } }),
  ]);
  const totalViews = viewsAgg.reduce((sum, agg) => sum + (agg._sum.views ?? 0), 0);

  return { songs, articles, devotions, testimonies, artists, videos, inspirations, prayers, verses, totalViews };
}

/** Vues des 6 derniers mois (à partir du journal ViewLog), pour le graphique du tableau de bord. */
export async function getMonthlyViewStats(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const logs = await prisma.viewLog.findMany({
    where: { viewedAt: { gte: start } },
    select: { viewedAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  for (const log of logs) {
    const d = log.viewedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([month, count]) => ({ month, count }));
}
