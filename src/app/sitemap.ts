import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { dateToUrlSlug } from "@/lib/utils";

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "daily" as const, priority: 1 },
  { path: "/chansons", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/playlists", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/artistes", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/videos", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/inspirations", changeFrequency: "daily" as const, priority: 0.7 },
  { path: "/devotions", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/prieres", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/versets", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/temoignages", changeFrequency: "weekly" as const, priority: 0.6 },
  { path: "/blog", changeFrequency: "daily" as const, priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [songs, playlists, artists, videos, inspirations, devotions, prayers, verses, testimonies, articles] =
    await Promise.all([
      prisma.song.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.playlist.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.artist.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.video.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.inspiration.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.devotion.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.prayer.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.verse.findMany({ where: { published: true }, select: { date: true, updatedAt: true } }),
      prisma.testimony.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const toEntries = (
    items: { slug: string; updatedAt: Date }[],
    basePath: string,
    priority = 0.6,
  ): MetadataRoute.Sitemap =>
    items.map((item) => ({
      url: `${SITE_URL}${basePath}/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly",
      priority,
    }));

  const verseEntries: MetadataRoute.Sitemap = verses.map((verse) => ({
    url: `${SITE_URL}/versets/${dateToUrlSlug(verse.date)}`,
    lastModified: verse.updatedAt,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...toEntries(songs, "/chansons", 0.8),
    ...toEntries(playlists, "/playlists", 0.6),
    ...toEntries(artists, "/artistes", 0.6),
    ...toEntries(videos, "/videos", 0.6),
    ...toEntries(inspirations, "/inspirations", 0.6),
    ...toEntries(devotions, "/devotions", 0.7),
    ...toEntries(prayers, "/prieres", 0.6),
    ...verseEntries,
    ...toEntries(testimonies, "/temoignages", 0.5),
    ...toEntries(articles, "/blog", 0.8),
  ];
}
