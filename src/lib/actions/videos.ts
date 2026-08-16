"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { videoSchema, type VideoInput } from "@/lib/validations/videos";

function toData(input: VideoInput) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description || null,
    youtubeUrl: input.youtubeUrl,
    thumbnailUrl: input.thumbnailUrl || null,
    categoryId: input.categoryId || null,
    artistId: input.artistId || null,
    featured: input.featured ?? false,
    published: input.published ?? true,
  };
}

export async function createVideo(input: VideoInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.video.create({ data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par une autre vidéo." };
    }
    throw err;
  }

  revalidatePath("/admin/videos");
  revalidatePath("/videos");
  redirect("/admin/videos");
}

export async function updateVideo(id: string, input: VideoInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.video.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par une autre vidéo." };
    }
    throw err;
  }

  revalidatePath("/admin/videos");
  revalidatePath("/videos");
  redirect("/admin/videos");
}

export async function deleteVideo(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.video.delete({ where: { id } });
  revalidatePath("/admin/videos");
  revalidatePath("/videos");
}
