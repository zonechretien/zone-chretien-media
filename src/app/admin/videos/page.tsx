import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteVideo } from "@/lib/actions/videos";

export const metadata: Metadata = { title: "Vidéos" };

export default async function AdminVideosPage() {
  await requireSession();
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
  });

  return (
    <div>
      <AdminPageHeader title="Vidéos" newHref="/admin/videos/nouveau" />
      <AdminTable
        rows={videos}
        columns={[
          { header: "Titre", cell: (v) => <span className="font-medium text-foreground">{v.title}</span> },
          { header: "Artiste", cell: (v) => v.artist?.name ?? "—" },
          { header: "Catégorie", cell: (v) => v.category?.name ?? "—" },
          { header: "Statut", cell: (v) => (v.published ? "Publié" : "Brouillon") },
        ]}
        actions={(v) => (
          <RowActions editHref={`/admin/videos/${v.id}`} onDelete={deleteVideo.bind(null, v.id)} itemLabel={v.title} />
        )}
        emptyMessage="Aucune vidéo pour le moment."
      />
    </div>
  );
}
