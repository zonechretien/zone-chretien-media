"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { slugify, parseDateInput } from "@/lib/utils";
import { resourceSchema, type ResourceInput } from "@/lib/validations/resources";

function toData(input: ResourceInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    description: input.description || null,
    author: input.author || null,
    type: input.type,
    fileUrl: input.fileUrl,
    coverImageUrl: input.coverImageUrl || null,
    categoryId: input.categoryId || null,
    publishedAt: input.publishedAt ? parseDateInput(input.publishedAt) : null,
    published: input.published ?? true,
  };
}

export async function createResource(input: ResourceInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.resource.create({
      data: {
        ...toData(parsed.data),
        tags: { connect: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par une autre ressource." };
    }
    throw err;
  }

  revalidatePath("/admin/bibliotheque");
  revalidatePath("/bibliotheque");
  revalidatePath(`/bibliotheque/${parsed.data.slug}`);
  redirect("/admin/bibliotheque");
}

export async function updateResource(id: string, input: ResourceInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  const existing = await prisma.resource.findUnique({ where: { id }, select: { slug: true } });

  try {
    await prisma.resource.update({
      where: { id },
      data: {
        ...toData(parsed.data),
        tags: { set: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par une autre ressource." };
    }
    throw err;
  }

  revalidatePath("/admin/bibliotheque");
  revalidatePath("/bibliotheque");
  revalidatePath(`/bibliotheque/${parsed.data.slug}`);
  // Le slug a pu changer : invalide aussi l'ancienne URL pour ne pas laisser une
  // version périmée en cache si elle a déjà été visitée sous son ancien slug.
  if (existing && existing.slug !== parsed.data.slug) {
    revalidatePath(`/bibliotheque/${existing.slug}`);
  }
  redirect("/admin/bibliotheque");
}

export async function deleteResource(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  const existing = await prisma.resource.findUnique({ where: { id }, select: { slug: true } });
  await prisma.resource.delete({ where: { id } });
  revalidatePath("/admin/bibliotheque");
  revalidatePath("/bibliotheque");
  if (existing) revalidatePath(`/bibliotheque/${existing.slug}`);
}

/** Incrémente le compteur de téléchargements — appelé depuis le clic public sur
 * "Télécharger"/"Consulter", sans session requise (action publique). */
export async function incrementResourceDownload(id: string): Promise<void> {
  try {
    await prisma.resource.update({ where: { id }, data: { downloads: { increment: 1 } } });
  } catch {
    // Non bloquant : un compteur raté ne doit jamais empêcher le téléchargement.
  }
}
