"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify, parseDateInput } from "@/lib/utils";
import { articleSchema, type ArticleInput } from "@/lib/validations/articles";

function toData(input: ArticleInput, authorId: string) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    excerpt: input.excerpt || null,
    content: sanitizeHtml(input.content),
    coverImageUrl: input.coverImageUrl || null,
    categoryId: input.categoryId || null,
    authorId,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    publishedAt: input.publishedAt ? parseDateInput(input.publishedAt) : null,
    featured: input.featured ?? false,
    published: input.published ?? true,
  };
}

export async function createArticle(input: ArticleInput): Promise<{ error?: string }> {
  const session = await requireSession();
  const parsed = articleSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.article.create({
      data: {
        ...toData(parsed.data, session.user.id!),
        tags: { connect: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
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

  const existing = await prisma.article.findUnique({ where: { id }, select: { authorId: true } });

  try {
    await prisma.article.update({
      where: { id },
      data: {
        ...toData(parsed.data, existing?.authorId ?? session.user.id!),
        tags: { set: (parsed.data.tagIds ?? []).map((id) => ({ id })) },
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
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
