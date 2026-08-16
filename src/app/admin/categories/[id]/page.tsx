import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { CategoryForm } from "@/components/admin/forms/category-form";

export const metadata: Metadata = { title: "Modifier la catégorie" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {category.name} »</h1>
      <CategoryForm category={category} />
    </div>
  );
}
