import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteCategory } from "@/lib/actions/categories";
import { CATEGORY_TYPE_LABELS } from "@/lib/validations/categories";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  await requireSession();
  const categories = await prisma.category.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });

  return (
    <div>
      <AdminPageHeader title="Catégories" newHref="/admin/categories/nouveau" />
      <AdminTable
        rows={categories}
        columns={[
          { header: "Nom", cell: (c) => <span className="font-medium text-foreground">{c.name}</span> },
          { header: "S'applique à", cell: (c) => CATEGORY_TYPE_LABELS[c.type] },
          { header: "Slug", cell: (c) => <code className="text-xs text-muted">{c.slug}</code> },
        ]}
        actions={(c) => (
          <RowActions editHref={`/admin/categories/${c.id}`} onDelete={deleteCategory.bind(null, c.id)} itemLabel={c.name} />
        )}
        emptyMessage="Aucune catégorie pour le moment."
      />
    </div>
  );
}
