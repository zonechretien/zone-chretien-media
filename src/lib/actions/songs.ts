"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { slugify } from "@/lib/utils";
import { songSchema, type SongInput } from "@/lib/validations/songs";

function toData(input: SongInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    description: input.description || null,
    lyrics: input.lyrics || null,
    imageUrl: input.imageUrl,
    audioUrl: input.audioUrl || null,
    youtubeUrl: input.youtubeUrl || null,
    artistId: input.artistId,
    categoryId: input.categoryId || null,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
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
