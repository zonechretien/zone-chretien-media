import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { getBibleBooks } from "@/lib/queries/bible";
import { VerseForm } from "@/components/admin/forms/verse-form";

export const metadata: Metadata = { title: "Nouveau verset" };

export default async function NewVersePage() {
  await requireSession();
  const books = await getBibleBooks();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouveau verset du jour</h1>
      <VerseForm books={books} />
    </div>
  );
}
