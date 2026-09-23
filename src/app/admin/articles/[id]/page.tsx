import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ArticleForm } from "@/components/admin/forms/article-form";
import { TransformToReel } from "@/components/admin/reels/transform-to-reel";

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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Modifier « {article.title} »</h1>
        <TransformToReel sourceType="ARTICLE" sourceId={id} />
      </div>
      <ArticleForm article={article} categories={categories} tags={tags} />
    </div>
  );
}
