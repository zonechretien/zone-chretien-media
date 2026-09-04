"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { slugify, parseDateInput, getAudiomackEmbedUrl, getSoundcloudEmbedUrl } from "@/lib/utils";
import { songSchema, type SongInput } from "@/lib/validations/songs";

/** Nettoie l'URL saisie selon la source : SoundCloud/Audiomack acceptent l'URL
 * normale de la page dans le CMS, mais seule l'URL d'intégration fonctionne en
 * iframe côté public — on la convertit une bonne fois à l'enregistrement. */
function normalizeAudioUrl(sourceType: SongInput["sourceType"], audioUrl: string | undefined): string | null {
  if (!audioUrl) return null;
  if (sourceType === "SOUNDCLOUD") return getSoundcloudEmbedUrl(audioUrl) ?? audioUrl;
  if (sourceType === "AUDIOMACK") return getAudiomackEmbedUrl(audioUrl) ?? audioUrl;
  return audioUrl;
}

function toData(input: SongInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    description: input.description || null,
    lyrics: input.lyrics || null,
    imageUrl: input.imageUrl,
    sourceType: input.sourceType ?? "FICHIER_DIRECT",
    audioUrl: normalizeAudioUrl(input.sourceType, input.audioUrl),
    youtubeUrl: input.youtubeUrl || null,
    artistId: input.artistId,
    categoryId: input.categoryId || null,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    publishedAt: input.publishedAt ? parseDateInput(input.publishedAt) : null,
    featured: input.featured ?? false,
    published: input.published ?? true,
  };
}

export async function createSong(input: SongInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.song.create({
      data: {
        ...toData(parsed.data),
        tags: { connect: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Ce slug est déjà utilisé par une autre chanson." };
    }
    throw err;
  }

  revalidatePath("/admin/chansons");
  revalidatePath("/chansons");
  revalidatePath("/");
  redirect("/admin/chansons");
}

export async function updateSong(id: string, input: SongInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.song.update({
      where: { id },
      data: {
        ...toData(parsed.data),
        tags: { set: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Ce slug est déjà utilisé par une autre chanson." };
    }
    throw err;
  }

  revalidatePath("/admin/chansons");
  revalidatePath("/chansons");
  revalidatePath("/");
  redirect("/admin/chansons");
}

export async function deleteSong(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.song.delete({ where: { id } });
  revalidatePath("/admin/chansons");
  revalidatePath("/chansons");
  revalidatePath("/");
}
