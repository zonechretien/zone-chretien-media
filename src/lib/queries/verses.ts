import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paginate, totalPages } from "./shared";
import { getRandomBibleVerse } from "./bible";

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

/**
 * Verset du jour : correspondance exacte sur la date si un verset a été
 * programmé dans le CMS. Sinon, pioche un vrai verset au hasard dans la
 * Bible importée et le persiste comme verset du jour pour cette date
 * précise (une seule fois, grâce à la contrainte unique sur `date` — un
 * essai concurrent se rabat simplement sur la ligne déjà créée entre-temps).
 * L'admin peut ensuite le retrouver dans /admin/versets et y ajouter une
 * explication, exactement comme un verset programmé à la main.
 */
export async function getVerseOfDay() {
  const now = new Date();
  const today = await prisma.verse.findFirst({
    where: {
      published: true,
      date: { gte: startOfDay(now), lte: endOfDay(now) },
    },
  });
  if (today) return today;

  const picked = await getRandomBibleVerse();
  if (picked) {
    try {
      return await prisma.verse.create({
        data: {
          reference: `${picked.bookName} ${picked.chapterNumber}:${picked.number}`,
          text: picked.text,
          date: startOfDay(now),
          published: true,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return prisma.verse.findFirst({
          where: { published: true, date: { gte: startOfDay(now), lte: endOfDay(now) } },
        });
      }
      throw err;
    }
  }

  // Filet de sécurité si jamais la base biblique est vide.
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
