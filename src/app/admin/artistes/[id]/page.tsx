import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ArtistForm } from "@/components/admin/forms/artist-form";

export const metadata: Metadata = { title: "Modifier l'artiste" };

export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [artist, tags] = await Promise.all([
    prisma.artist.findUnique({ where: { id }, include: { tags: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!artist) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {artist.name} »</h1>
      <ArtistForm artist={artist} tags={tags} />
    </div>
  );
}
