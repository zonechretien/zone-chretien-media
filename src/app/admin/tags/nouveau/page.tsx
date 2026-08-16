import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { TagForm } from "@/components/admin/forms/tag-form";

export const metadata: Metadata = { title: "Nouveau tag" };

export default async function NewTagPage() {
  await requireSession();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouveau tag</h1>
      <TagForm />
    </div>
  );
}
