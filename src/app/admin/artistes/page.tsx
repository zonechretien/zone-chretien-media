import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { ArtistContactActions } from "@/components/admin/artist-contact-actions";
import { deleteArtist } from "@/lib/actions/artists";

export const metadata: Metadata = { title: "Artistes" };

export default async function AdminArtistsPage() {
  await requireSession();
  const artists = await prisma.artist.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { songs: true } } },
  });

  return (
    <div>
      <AdminPageHeader title="Artistes" newHref="/admin/artistes/nouveau" />
      <AdminTable
        rows={artists}
        columns={[
          { header: "Nom", cell: (a) => <span className="font-medium text-foreground">{a.name}</span> },
          { header: "Chansons", cell: (a) => a._count.songs },
          { header: "Sponsorisé", cell: (a) => (a.isSponsored ? "Oui" : "—") },
          {
            header: "Contact",
            cell: (a) => <ArtistContactActions whatsappNumber={a.whatsappNumber} email={a.email} size="sm" />,
          },
        ]}
        actions={(a) => (
          <RowActions editHref={`/admin/artistes/${a.id}`} onDelete={deleteArtist.bind(null, a.id)} itemLabel={a.name} />
        )}
        emptyMessage="Aucun artiste pour le moment."
      />
    </div>
  );
}
