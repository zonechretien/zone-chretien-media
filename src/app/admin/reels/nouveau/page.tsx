import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { NewReelForm } from "@/components/admin/reels/new-reel-form";

export const metadata: Metadata = { title: "Nouveau Reel" };

export default async function NewReelPage() {
  await requireSession();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouveau Reel</h1>
      <NewReelForm />
    </div>
  );
}
