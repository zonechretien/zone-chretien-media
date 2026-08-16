import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ArticleForm } from "@/components/admin/forms/article-form";

export const metadata: Metadata = { title: "Modifier l'article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [article, categories, tags] = await Promise.all([
    prisma.article.findUnique({ where: { id }, include: { tags: true } }),
    prisma.category.findMany({ where: { type: "ARTICLE" }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!article) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {article.title} »</h1>
      <ArticleForm article={article} categories={categories} tags={tags} />
    </div>
  );
}
