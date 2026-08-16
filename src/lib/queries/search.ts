import { prisma } from "@/lib/db";

const RESULTS_PER_TYPE = 6;

export async function globalSearch(query: string) {
  if (!query.trim()) {
    return {
      songs: [],
      artists: [],
      articles: [],
      inspirations: [],
      devotions: [],
      prayers: [],
      testimonies: [],
      verses: [],
      isEmpty: true,
    };
  }

  const contains = { contains: query };

  const [songs, artists, articles, inspirations, devotions, prayers, testimonies, verses] =
    await Promise.all([
      prisma.song.findMany({
        where: { published: true, title: contains },
        include: { artist: true, category: true },
        take: RESULTS_PER_TYPE,
      }),
      prisma.artist.findMany({
        where: { name: contains },
        take: RESULTS_PER_TYPE,
      }),
      prisma.article.findMany({
        where: { published: true, title: contains },
        include: { category: true, author: true },
        take: RESULTS_PER_TYPE,
      }),
      prisma.inspiration.findMany({
        where: { published: true, title: contains },
        take: RESULTS_PER_TYPE,
      }),
      prisma.devotion.findMany({
        where: { published: true, title: contains },
        take: RESULTS_PER_TYPE,
      }),
      prisma.prayer.findMany({
        where: { published: true, title: contains },
        take: RESULTS_PER_TYPE,
      }),
      prisma.testimony.findMany({
        where: { published: true, title: contains },
        take: RESULTS_PER_TYPE,
      }),
      prisma.verse.findMany({
        where: {
          published: true,
          OR: [{ reference: contains }, { text: contains }],
        },
        take: RESULTS_PER_TYPE,
      }),
    ]);

  const total =
    songs.length +
    artists.length +
    articles.length +
    inspirations.length +
    devotions.length +
    prayers.length +
    testimonies.length +
    verses.length;

  return {
    songs,
    artists,
    articles,
    inspirations,
    devotions,
    prayers,
    testimonies,
    verses,
    isEmpty: total === 0,
  };
}
