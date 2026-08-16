import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { ArtistForm } from "@/components/admin/forms/artist-form";

export const metadata: Metadata = { title: "Nouvel artiste" };

export default async function NewArtistPage() {
  await requireSession();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvel artiste</h1>
      <ArtistForm />
    </div>
  );
}
