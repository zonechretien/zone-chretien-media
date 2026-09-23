import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { getBibleBooks } from "@/lib/queries/bible";
import { VerseForm } from "@/components/admin/forms/verse-form";
import { TransformToReel } from "@/components/admin/reels/transform-to-reel";

export const metadata: Metadata = { title: "Modifier le verset" };

export default async function EditVersePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [verse, books] = await Promise.all([
    prisma.verse.findUnique({ where: { id } }),
    getBibleBooks(),
  ]);
  if (!verse) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Modifier « {verse.reference} »</h1>
        <TransformToReel sourceType="VERSE" sourceId={id} />
      </div>
      <VerseForm verse={verse} books={books} />
    </div>
  );
}
