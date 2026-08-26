"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
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
  const parsed = playlistSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  const songIds = parsed.data.songIds ?? [];

  try {
    await prisma.$transaction([
      prisma.playlist.update({ where: { id }, data: toData(parsed.data) }),
      prisma.playlistSong.deleteMany({ where: { playlistId: id } }),
      prisma.playlistSong.createMany({
        data: songIds.map((songId, position) => ({ playlistId: id, songId, position })),
      }),
    ]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
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
