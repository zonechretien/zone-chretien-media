import { prisma } from "@/lib/db";
import { paginate, totalPages } from "./shared";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** Verset du jour : correspondance exacte sur la date, sinon le plus récent disponible. */
export async function getVerseOfDay() {
  const now = new Date();
  const today = await prisma.verse.findFirst({
    where: {
      published: true,
      date: { gte: startOfDay(now), lte: endOfDay(now) },
    },
  });
  if (today) return today;

  return prisma.verse.findFirst({
    where: { published: true, date: { lte: endOfDay(now) } },
    orderBy: { date: "desc" },
  });
}

export async function getVerses({
  page = 1,
  query,
}: { page?: number; query?: string } = {}) {
  const where = {
    published: true,
    ...(query
      ? { OR: [{ reference: { contains: query } }, { text: { contains: query } }] }
      : {}),
  };

  const [verses, count] = await Promise.all([
    prisma.verse.findMany({
      where,
      orderBy: { date: "desc" },
      ...paginate(page),
    }),
    prisma.verse.count({ where }),
  ]);

  return { verses, pages: totalPages(count) };
}

export function getVerseByDateSlug(dateSlug: string) {
  const date = new Date(`${dateSlug}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return Promise.resolve(null);

  return prisma.verse.findFirst({
    where: {
      published: true,
      date: { gte: startOfDay(date), lte: endOfDay(date) },
    },
  });
}
