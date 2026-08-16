import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { TestimonyForm } from "@/components/admin/forms/testimony-form";

export const metadata: Metadata = { title: "Nouveau témoignage" };

export default async function NewTestimonyPage() {
  await requireSession();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouveau témoignage</h1>
      <TestimonyForm />
    </div>
  );
}
