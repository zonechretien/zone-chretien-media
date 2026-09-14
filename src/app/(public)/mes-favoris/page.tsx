import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { MesFavorisView } from "@/components/shared/mes-favoris-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mes favoris",
  description: "Vos chansons, playlists, articles, dévotions et témoignages enregistrés sur cet appareil.",
  path: "/mes-favoris",
  noIndex: true,
});

export default function MesFavorisPage() {
  return (
    <div>
      <PageHeader
        title="Mes favoris"
        description="Vos chansons, playlists, articles, dévotions et témoignages enregistrés sur cet appareil."
      />
      <MesFavorisView />
    </div>
  );
}
