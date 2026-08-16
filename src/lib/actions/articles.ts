"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { sanitizeHtml } from "@/lib/sanitize";
import { articleSchema, type ArticleInput } from "@/lib/validations/articles";

function toData(input: ArticleInput, authorId: string, existingPublishedAt: Date | null) {
  const published = input.published ?? true;
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt || null,
    content: sanitizeHtml(input.content),
    coverImageUrl: input.coverImageUrl || null,
    categoryId: input.categoryId || null,
    authorId,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    featured: input.featured ?? false,
    published,
    publishedAt: published ? (existingPublishedAt ?? new Date()) : null,
  };
}

export async function createArticle(input: ArticleInput): Promise<{ error?: string }> {
  const session = await requireSession();
  const parsed = articleSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.article.create({
      data: {
        ...toData(parsed.data, session.user.id!, null),
        tags: { connect: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par un autre article." };
    }
    throw err;
  }

  revalidatePath("/admin/articles");
  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin/articles");
}

export async function updateArticle(id: string, input: ArticleInput): Promise<{ error?: string }> {
  const session = await requireSession();
  const parsed = articleSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  const existing = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true, authorId: true } });

  try {
    await prisma.article.update({
      where: { id },
      data: {
        ...toData(parsed.data, existing?.authorId ?? session.user.id!, existing?.publishedAt ?? null),
        tags: { set: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé par un autre article." };
    }
    throw err;
  }

  revalidatePath("/admin/articles");
  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin/articles");
}

export async function deleteArticle(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/articles");
  revalidatePath("/blog");
}
