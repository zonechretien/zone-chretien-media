// Génération de plans de lecture biblique — extrait de prisma/seed.ts pour
// être partagé avec scripts/bible/seed-full-bible-plans.ts sans duplication.

export type ScheduleBook = { slug: string; name: string; chapterCount: number };
export type SchedulePassage = { bookSlug: string; bookName: string; chapterStart: number; chapterEnd: number };
export type ScheduleDay = { dayNumber: number; passages: SchedulePassage[] };

/**
 * Répartit les chapitres des livres donnés (dans l'ordre) sur `totalDays`
 * jours aussi uniformément que possible (le reste va aux premiers jours), en
 * regroupant les chapitres consécutifs d'un même livre en un seul passage —
 * un nouveau passage démarre dès que le livre change dans la séquence.
 */
export function buildReadingSchedule(books: ScheduleBook[], totalDays: number): ScheduleDay[] {
  const chapters = books.flatMap((book) =>
    Array.from({ length: book.chapterCount }, (_, i) => ({
      bookSlug: book.slug,
      bookName: book.name,
      chapterNumber: i + 1,
    })),
  );
  const base = Math.floor(chapters.length / totalDays);
  const remainder = chapters.length % totalDays;

  const days: ScheduleDay[] = [];
  let cursor = 0;
  for (let day = 1; day <= totalDays; day++) {
    const count = base + (day <= remainder ? 1 : 0);
    const dayChapters = chapters.slice(cursor, cursor + count);
    cursor += count;

    const passages: SchedulePassage[] = [];
    for (const ch of dayChapters) {
      const last = passages[passages.length - 1];
      if (last && last.bookSlug === ch.bookSlug && last.chapterEnd === ch.chapterNumber - 1) {
        last.chapterEnd = ch.chapterNumber;
      } else {
        passages.push({
          bookSlug: ch.bookSlug,
          bookName: ch.bookName,
          chapterStart: ch.chapterNumber,
          chapterEnd: ch.chapterNumber,
        });
      }
    }
    days.push({ dayNumber: day, passages });
  }
  return days;
}
