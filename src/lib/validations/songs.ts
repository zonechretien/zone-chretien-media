import { z } from "zod";

const optionalUrl = z.string().url("URL invalide").optional().or(z.literal(""));

export const SONG_SOURCE_TYPES = ["FICHIER_DIRECT", "SOUNDCLOUD", "AUDIOMACK", "YOUTUBE_MUSIC"] as const;

export const SONG_SOURCE_TYPE_LABELS: Record<(typeof SONG_SOURCE_TYPES)[number], string> = {
  FICHIER_DIRECT: "Fichier direct (hébergé)",
  SOUNDCLOUD: "SoundCloud",
  AUDIOMACK: "Audiomack",
  YOUTUBE_MUSIC: "YouTube Music",
};

/** Libellé + placeholder du champ "audioUrl" dans le CMS, adaptés à la source
 * choisie — son contenu attendu change entièrement selon le type. */
export const SONG_SOURCE_FIELD_CONFIG: Record<
  (typeof SONG_SOURCE_TYPES)[number],
  { label: string; placeholder: string; help: string | null }
> = {
  FICHIER_DIRECT: {
    label: "Audio (URL du fichier)",
    placeholder: "https://…",
    help: null,
  },
  SOUNDCLOUD: {
    label: "URL SoundCloud",
    placeholder: "https://soundcloud.com/artiste/titre",
    help: "Collez l'URL normale de la page SoundCloud de la chanson — elle sera automatiquement convertie au format d'intégration.",
  },
  AUDIOMACK: {
    label: "URL Audiomack",
    placeholder: "https://audiomack.com/song/artiste/titre",
    help: "Collez l'URL normale de la page Audiomack de la chanson (ex : https://audiomack.com/song/artiste/titre) — elle sera automatiquement convertie au format d'intégration.",
  },
  YOUTUBE_MUSIC: {
    label: "URL YouTube (Music)",
    placeholder: "https://music.youtube.com/watch?v=…",
    help: null,
  },
};

export const songSchema = z.object({
  title: z.string().min(2, "Titre requis (2 caractères min.)"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional().or(z.literal("")),
  lyrics: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL d'image requise et valide"),
  sourceType: z.enum(SONG_SOURCE_TYPES).optional(),
  audioUrl: optionalUrl,
  youtubeUrl: optionalUrl,
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
