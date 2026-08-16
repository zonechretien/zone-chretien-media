"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { artistSchema, type ArtistInput } from "@/lib/validations/artists";

function toData(input: ArtistInput) {
  return {
    name: input.name,
    slug: input.slug,
    bio: input.bio || null,
    photoUrl: input.photoUrl || null,
    facebookUrl: input.facebookUrl || null,
    instagramUrl: input.instagramUrl || null,
    youtubeUrl: input.youtubeUrl || null,
    tiktokUrl: input.tiktokUrl || null,
    twitterUrl: input.twitterUrl || null,
    isSponsored: input.isSponsored ?? false,
  };
}

export async function createArtist(input: ArtistInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = artistSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.artist.create({ data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par un autre artiste." };
    }
    throw err;
  }

  revalidatePath("/admin/artistes");
  revalidatePath("/artistes");
  revalidatePath("/");
  redirect("/admin/artistes");
}

export async function updateArtist(id: string, input: ArtistInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = artistSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.artist.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par un autre artiste." };
    }
    throw err;
  }

  revalidatePath("/admin/artistes");
  revalidatePath("/artistes");
  revalidatePath("/");
  redirect("/admin/artistes");
}

export async function deleteArtist(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  const [songCount, videoCount] = await Promise.all([
    prisma.song.count({ where: { artistId: id } }),
    prisma.video.count({ where: { artistId: id } }),
  ]);
  if (songCount > 0 || videoCount > 0) {
    return {
      error: `Impossible : ${songCount} chanson(s) et ${videoCount} vidéo(s) liée(s) à cet artiste.`,
    };
  }
  await prisma.artist.delete({ where: { id } });
  revalidatePath("/admin/artistes");
  revalidatePath("/artistes");
}
