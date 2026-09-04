import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ArtistForm } from "@/components/admin/forms/artist-form";
import { ArtistContactActions } from "@/components/admin/artist-contact-actions";

export const metadata: Metadata = { title: "Modifier l'artiste" };

export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [artist, tags] = await Promise.all([
    prisma.artist.findUnique({ where: { id }, include: { tags: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!artist) notFound();

  const hasNoContact = !artist.whatsappNumber && !artist.email;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Modifier « {artist.name} »</h1>
        <ArtistContactActions whatsappNumber={artist.whatsappNumber} email={artist.email} size="md" />
      </div>
      {hasNoContact && (
        <p className="mb-6 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle size={16} className="shrink-0" />
          Aucun moyen de contact enregistré pour cet artiste.
        </p>
      )}
      <ArtistForm artist={artist} tags={tags} />
    </div>
  );
}
