import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { getBibleBooks } from "@/lib/queries/bible";
import { ReadingPlanForm } from "@/components/admin/forms/reading-plan-form";

export const metadata: Metadata = { title: "Nouveau plan de lecture" };

export default async function NewReadingPlanPage() {
  await requireSession();
  const books = await getBibleBooks();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouveau plan de lecture</h1>
      <ReadingPlanForm books={books} />
    </div>
  );
}
