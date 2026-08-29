"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { DEFAULT_BIBLE_VERSION } from "@/lib/queries/bible";

export async function getBibleChapterVersesAction(
  bookSlug: string,
  chapterNumber: number,
): Promise<{ number: number; text: string }[]> {
  await requireSession();

  const book = await prisma.bibleBook.findFirst({
    where: { slug: bookSlug, version: { code: DEFAULT_BIBLE_VERSION } },
  });
  if (!book) return [];

  const chapter = await prisma.bibleChapter.findUnique({
    where: { bookId_number: { bookId: book.id, number: chapterNumber } },
    include: { verses: { orderBy: { number: "asc" }, select: { number: true, text: true } } },
  });

  return chapter?.verses ?? [];
}
