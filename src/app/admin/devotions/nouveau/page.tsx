import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { DevotionForm } from "@/components/admin/forms/devotion-form";

export const metadata: Metadata = { title: "Nouvelle dévotion" };

export default async function NewDevotionPage() {
  await requireSession();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle dévotion</h1>
      <DevotionForm />
    </div>
  );
}
