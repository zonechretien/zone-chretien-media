import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { CategoryForm } from "@/components/admin/forms/category-form";

export const metadata: Metadata = { title: "Nouvelle catégorie" };

export default async function NewCategoryPage() {
  await requireSession();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle catégorie</h1>
      <CategoryForm />
    </div>
  );
}
