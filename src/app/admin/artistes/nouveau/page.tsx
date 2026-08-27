import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ArtistForm } from "@/components/admin/forms/artist-form";

export const metadata: Metadata = { title: "Nouvel artiste" };

export default async function NewArtistPage() {
  await requireSession();
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvel artiste</h1>
      <ArtistForm tags={tags} />
    </div>
  );
}
