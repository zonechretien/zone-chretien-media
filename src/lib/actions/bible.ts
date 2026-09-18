"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { DEFAULT_BIBLE_VERSION, getBibleChaptersRange, type BibleChapterVerses } from "@/lib/queries/bible";

export async function getBibleChapterVersesAction(
  bookSlug: string,
  chapterNumber: number,
  versionCode: string = DEFAULT_BIBLE_VERSION,
): Promise<{ number: number; text: string }[]> {
  await requireSession();

  const book = await prisma.bibleBook.findFirst({
    where: { slug: bookSlug, version: { code: versionCode } },
  });
  if (!book) return [];

  const chapter = await prisma.bibleChapter.findUnique({
    where: { bookId_number: { bookId: book.id, number: chapterNumber } },
    include: { verses: { orderBy: { number: "asc" }, select: { number: true, text: true } } },
  });

  return chapter?.verses ?? [];
}

export type ReadingPlanDayText = {
  bookSlug: string;
  bookName: string;
  chapterStart: number;
  chapterEnd: number;
  chapters: BibleChapterVerses[];
}[];

/**
 * Texte complet des passages d'un jour de plan de lecture — chargé à la
 * demande quand le visiteur déplie ce jour (pas tous les jours d'un plan
 * chargés d'un coup). Action publique (pas de session requise, contrairement
 * à getBibleChapterVersesAction ci-dessus qui alimente le picker admin).
 */
export async function getReadingPlanDayTextAction(
  dayId: string,
  versionCode: string = DEFAULT_BIBLE_VERSION,
): Promise<ReadingPlanDayText> {
  const day = await prisma.readingPlanDay.findUnique({
    where: { id: dayId },
    include: { passages: { orderBy: { position: "asc" } } },
  });
  if (!day) return [];

  return Promise.all(
    day.passages.map(async (passage) => ({
      bookSlug: passage.bookSlug,
      bookName: passage.bookName,
      chapterStart: passage.chapterStart,
      chapterEnd: passage.chapterEnd,
      chapters: await getBibleChaptersRange(passage.bookSlug, passage.chapterStart, passage.chapterEnd, versionCode),
    })),
  );
}
