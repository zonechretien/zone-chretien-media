import { after } from "next/server";
import { prisma } from "@/lib/db";
import type { ContentType } from "@prisma/client";

export const PAGE_SIZE = 12;

export function paginate(page: number, pageSize: number = PAGE_SIZE) {
  const safePage = Math.max(1, page);
  return { skip: (safePage - 1) * pageSize, take: pageSize };
}

export function totalPages(count: number, pageSize: number = PAGE_SIZE) {
  return Math.max(1, Math.ceil(count / pageSize));
}

/**
 * Incrémente le compteur de vues et journalise la vue (stats mensuelles du
 * tableau de bord). Exécuté après l'envoi de la réponse (`after`) pour ne
 * jamais ralentir l'affichage de la page.
 */
export function trackView(contentType: ContentType, contentId: string) {
  after(async () => {
    try {
      await prisma.viewLog.create({ data: { contentType, contentId } });
      const views = { increment: 1 } as const;
      const where = { id: contentId };
      switch (contentType) {
        case "SONG":
          await prisma.song.update({ where, data: { views } });
          break;
        case "VIDEO":
          await prisma.video.update({ where, data: { views } });
          break;
        case "INSPIRATION":
          await prisma.inspiration.update({ where, data: { views } });
          break;
        case "DEVOTION":
          await prisma.devotion.update({ where, data: { views } });
          break;
        case "PRAYER":
          await prisma.prayer.update({ where, data: { views } });
          break;
        case "VERSE":
          await prisma.verse.update({ where, data: { views } });
          break;
        case "TESTIMONY":
          await prisma.testimony.update({ where, data: { views } });
          break;
        case "ARTICLE":
          await prisma.article.update({ where, data: { views } });
          break;
        case "ARTIST":
          break;
      }
    } catch {
      // Le suivi des vues n'est jamais critique pour l'utilisateur.
    }
  });
}
