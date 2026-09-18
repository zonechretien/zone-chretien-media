/**
 * Crée 3 plans de lecture couvrant la Bible intégrale (66 livres, ordre
 * canonique) sur 30, 90 et 365 jours, en plus des plans thématiques existants
 * (voir prisma/seed.ts). Idempotent (upsert par slug) — peut être relancé
 * sans dupliquer.
 *
 * Usage :
 *   npx tsx --env-file=.env scripts/bible/seed-full-bible-plans.ts
 */
import { prisma } from "../../src/lib/db";
import { slugify } from "../../src/lib/utils";
import { DEFAULT_BIBLE_VERSION } from "../../src/lib/queries/bible";
import { buildReadingSchedule } from "../../src/lib/reading-schedule";

const FULL_BIBLE_PLANS: { title: string; description: string; durationDays: number }[] = [
  {
    title: "La Bible en 30 jours",
    description: "Parcourez l'intégralité de la Bible, de la Genèse à l'Apocalypse, en un mois — un rythme soutenu pour les lecteurs assidus.",
    durationDays: 30,
  },
  {
    title: "La Bible en 90 jours",
    description: "Lisez toute la Bible en trois mois, à un rythme équilibré et accessible au quotidien.",
    durationDays: 90,
  },
  {
    title: "La Bible en 365 jours",
    description: "Un chapitre — ou quelques versets — chaque jour de l'année pour parcourir toute la Parole de Dieu à un rythme paisible.",
    durationDays: 365,
  },
];

function img(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function main() {
  const allBooks = await prisma.bibleBook.findMany({
    where: { version: { code: DEFAULT_BIBLE_VERSION } },
    orderBy: { order: "asc" },
    select: { slug: true, name: true, chapterCount: true },
  });

  if (allBooks.length !== 66) {
    console.error(
      `Attendu 66 livres pour la version ${DEFAULT_BIBLE_VERSION}, trouvé ${allBooks.length}. Import Bible incomplet ?`,
    );
    process.exit(1);
  }

  for (let i = 0; i < FULL_BIBLE_PLANS.length; i++) {
    const plan = FULL_BIBLE_PLANS[i];
    const slug = slugify(plan.title);
    const schedule = buildReadingSchedule(allBooks, plan.durationDays);

    await prisma.readingPlan.upsert({
      where: { slug },
      update: {},
      create: {
        title: plan.title,
        slug,
        description: plan.description,
        durationDays: plan.durationDays,
        coverImageUrl: img(`full-bible-plan-${plan.durationDays}`, 800, 600),
        published: true,
        publishedAt: new Date(),
        days: {
          create: schedule.map((day) => ({
            dayNumber: day.dayNumber,
            passages: {
              create: day.passages.map((p, position) => ({
                bookSlug: p.bookSlug,
                bookName: p.bookName,
                chapterStart: p.chapterStart,
                chapterEnd: p.chapterEnd,
                position,
              })),
            },
          })),
        },
      },
    });

    console.log(`  ${plan.title} : ${schedule.length} jours, ${schedule.reduce((n, d) => n + d.passages.length, 0)} passages`);
  }

  console.log(`\nTerminé : ${FULL_BIBLE_PLANS.length} plans de lecture intégrale créés/vérifiés.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
