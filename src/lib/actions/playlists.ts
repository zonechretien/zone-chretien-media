"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { slugify, parseDateInput } from "@/lib/utils";
import { playlistSchema, type PlaylistInput } from "@/lib/validations/playlists";

function toData(input: PlaylistInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    description: input.description || null,
    imageUrl: input.imageUrl || null,
    order: input.order ?? 0,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    publishedAt: input.publishedAt ? parseDateInput(input.publishedAt) : null,
    published: input.published ?? false,
  };
}

/** Playlist spéciale (TOP_SEMAINE/TOP_TOUJOURS) : seuls le titre, le slug, la
 * description et l'image restent personnalisables — le contenu est calculé
 * automatiquement, jamais depuis un sélecteur de chansons. */
function toSpecialData(input: PlaylistInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    description: input.description || null,
    imageUrl: input.imageUrl || null,
  };
}

export async function createPlaylist(input: PlaylistInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = playlistSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.playlist.create({
      data: {
        ...toData(parsed.data),
        songs: {
          create: (parsed.data.songIds ?? []).map((songId, position) => ({ songId, position })),
        },
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Ce slug est déjà utilisé par une autre playlist." };
    }
    throw err;
  }

  revalidatePath("/admin/playlists");
  revalidatePath("/playlists");
  revalidatePath("/");
  redirect("/admin/playlists");
}

export async function updatePlaylist(id: string, input: PlaylistInput): Promise<{ error?: string }> {
  await requireSession();
  const existing = await prisma.playlist.findUnique({ where: { id }, select: { type: true } });
  if (!existing) return { error: "Playlist introuvable." };

  const parsed = playlistSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    if (existing.type === "EDITORIALE") {
      const songIds = parsed.data.songIds ?? [];
      await prisma.$transaction([
        prisma.playlist.update({ where: { id }, data: toData(parsed.data) }),
        prisma.playlistSong.deleteMany({ where: { playlistId: id } }),
        prisma.playlistSong.createMany({
          data: songIds.map((songId, position) => ({ playlistId: id, songId, position })),
        }),
      ]);
    } else {
      await prisma.playlist.update({ where: { id }, data: toSpecialData(parsed.data) });
    }
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Ce slug est déjà utilisé par une autre playlist." };
    }
    throw err;
  }

  revalidatePath("/admin/playlists");
  revalidatePath("/playlists");
  revalidatePath(`/playlists/${parsed.data.slug}`);
  revalidatePath("/");
  redirect("/admin/playlists");
}

export async function deletePlaylist(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.playlist.delete({ where: { id } });
  revalidatePath("/admin/playlists");
  revalidatePath("/playlists");
  revalidatePath("/");
}
