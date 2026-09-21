import { z } from "zod";
import { getYoutubeId } from "@/lib/utils";
import type { Track } from "@/components/shared/audio-player-provider";

const optionalUrl = z.string().url("URL invalide").optional().or(z.literal(""));

// Conservé uniquement pour valider les valeurs legacy de `sourceType` (champ
// retiré du formulaire, plus jamais collecté — voir songToTrack ci-dessous,
// qui construit désormais toujours le Track depuis `youtubeUrl`).
const LEGACY_SOURCE_TYPES = ["FICHIER_DIRECT", "SOUNDCLOUD", "AUDIOMACK", "YOUTUBE_MUSIC"] as const;

export const songSchema = z.object({
  title: z.string().min(2, "Titre requis (2 caractères min.)"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional().or(z.literal("")),
  lyrics: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL d'image requise et valide"),
  sourceType: z.enum(LEGACY_SOURCE_TYPES).optional(),
  audioUrl: optionalUrl,
  youtubeUrl: z
    .string()
    .min(1, "URL YouTube requise")
    .url("URL invalide")
    .refine((u) => getYoutubeId(u) !== null, "Lien YouTube non reconnu (watch/youtu.be attendu)"),
  artistId: z.string().min(1, "Artiste requis"),
  categoryId: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
  metaTitle: z.string().optional().or(z.literal("")),
  metaDescription: z.string().optional().or(z.literal("")),
  publishedAt: z.string().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

export type SongInput = z.infer<typeof songSchema>;

/**
 * Construit le `Track` public d'une chanson à partir de son `youtubeUrl` —
 * seule et unique source de lecture désormais (remplace l'ancien
 * `songTrackAudioFields` basé sur `sourceType`/`audioUrl`, retiré). `audioUrl`
 * du Track porte l'ID vidéo YouTube (pas l'URL complète) : c'est ce que le
 * moteur de lecture YouTube de `audio-player-provider.tsx` attend pour
 * `loadVideoById`.
 */
export function songToTrack(song: {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  youtubeUrl: string | null;
  lyrics?: string | null;
  artist: { name: string; slug: string };
}): Track {
  const videoId = song.youtubeUrl ? getYoutubeId(song.youtubeUrl) : null;
  return {
    id: song.id,
    slug: song.slug,
    title: song.title,
    artistName: song.artist.name,
    artistSlug: song.artist.slug,
    imageUrl: song.imageUrl,
    audioUrl: videoId ?? "",
    source: videoId ? "youtube" : undefined,
    playable: !!videoId,
    kind: "song",
    lyrics: song.lyrics ?? undefined,
  };
}
