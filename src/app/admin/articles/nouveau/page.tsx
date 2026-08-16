import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ArticleForm } from "@/components/admin/forms/article-form";

export const metadata: Metadata = { title: "Nouvel article" };

export default async function NewArticlePage() {
  await requireSession();
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ where: { type: "ARTICLE" }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvel article</h1>
      <ArticleForm categories={categories} tags={tags} />
    </div>
  );
}
