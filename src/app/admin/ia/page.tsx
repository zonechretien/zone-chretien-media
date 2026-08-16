import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { DevotionGenerator } from "@/components/admin/ai/devotion-generator";
import { PrayerGenerator } from "@/components/admin/ai/prayer-generator";
import { VerseGenerator } from "@/components/admin/ai/verse-generator";
import { InspirationGenerator } from "@/components/admin/ai/inspiration-generator";
import { SongDescriptionGenerator } from "@/components/admin/ai/song-description-generator";
import { SocialPostGenerator } from "@/components/admin/ai/social-post-generator";

export const metadata: Metadata = { title: "Générateur IA" };

export default async function AdminAIPage() {
  await requireSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Générateur IA</h1>
      <p className="mt-1 text-muted">
        Générez un brouillon en un clic, puis relisez-le et ajustez-le avant publication —
        l&apos;IA propose, vous décidez.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <VerseGenerator />
        <DevotionGenerator />
        <PrayerGenerator />
        <InspirationGenerator />
        <SongDescriptionGenerator />
        <SocialPostGenerator platform="facebook" />
        <SocialPostGenerator platform="whatsapp" />
      </div>
    </div>
  );
}
