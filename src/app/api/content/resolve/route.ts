import { NextResponse } from "next/server";
import { z } from "zod";
import { getSongBySlug } from "@/lib/queries/songs";
import { getPlaylistBySlug } from "@/lib/queries/playlists";
import { getArticleBySlug } from "@/lib/queries/articles";
import { getDevotionBySlug } from "@/lib/queries/devotions";
import { getTestimonyBySlug } from "@/lib/queries/testimonies";
import { getBibleBookBySlug } from "@/lib/queries/bible";

const resolveSchema = z.object({
  refs: z
    .array(
      z.object({
        type: z.enum(["song", "playlist", "article", "devotion", "testimony", "bible"]),
        id: z.string().min(1),
      }),
    )
    .max(50),
});

/**
 * Résout une liste de références { type, id (slug) } — issues du localStorage
 * favoris/historique côté client — en données complètes, prêtes à être
 * rendues par les cartes existantes (SongCard, PlaylistCard, ...). L'ordre des
 * `refs` est préservé ; les éléments introuvables ou dépubliés entre-temps
 * sont simplement omis (contenu supprimé côté CMS).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { refs } = parsed.data;

  const resolved = await Promise.all(
    refs.map(async ({ type, id }) => {
      switch (type) {
        case "song": {
          const song = await getSongBySlug(id);
          return song && song.published ? { type, id, data: song } : null;
        }
        case "playlist": {
          const playlist = await getPlaylistBySlug(id);
          if (!playlist) return null;
          return { type, id, data: { ...playlist, _count: { songs: playlist.songs.length } } };
        }
        case "article": {
          const article = await getArticleBySlug(id);
          return article && article.published ? { type, id, data: article } : null;
        }
        case "devotion": {
          const devotion = await getDevotionBySlug(id);
          return devotion && devotion.published ? { type, id, data: devotion } : null;
        }
        case "testimony": {
          const testimony = await getTestimonyBySlug(id);
          return testimony && testimony.published ? { type, id, data: testimony } : null;
        }
        case "bible": {
          const [bookSlug, chapterRaw] = id.split(":");
          const chapterNumber = Number(chapterRaw);
          if (!bookSlug || !Number.isInteger(chapterNumber)) return null;
          const book = await getBibleBookBySlug(bookSlug);
          if (!book) return null;
          return { type, id, data: { bookSlug: book.slug, bookName: book.name, chapterNumber } };
        }
        default:
          return null;
      }
    }),
  );

  return NextResponse.json({ items: resolved.filter((item) => item !== null) });
}
