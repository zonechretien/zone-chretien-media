import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteTag } from "@/lib/actions/tags";

export const metadata: Metadata = { title: "Tags" };

export default async function AdminTagsPage() {
  await requireAdminRole();
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <AdminPageHeader title="Tags" newHref="/admin/tags/nouveau" />
      <AdminTable
        rows={tags}
        columns={[
          { header: "Nom", cell: (t) => <span className="font-medium text-foreground">{t.name}</span> },
          { header: "Slug", cell: (t) => <code className="text-xs text-muted">{t.slug}</code> },
        ]}
        actions={(t) => (
          <RowActions editHref={`/admin/tags/${t.id}`} onDelete={deleteTag.bind(null, t.id)} itemLabel={t.name} />
        )}
        emptyMessage="Aucun tag pour le moment."
      />
    </div>
  );
}
