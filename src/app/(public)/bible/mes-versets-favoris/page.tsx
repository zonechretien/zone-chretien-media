import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { FavoriteVersesView } from "@/components/bible/favorite-verses-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mes versets favoris",
  description: "Les versets bibliques que vous avez sauvegardés sur cet appareil.",
  path: "/bible/mes-versets-favoris",
  noIndex: true,
});

export default function FavoriteVersesPage() {
  return (
    <div>
      <PageHeader title="Mes versets favoris" description="Les versets que vous avez sauvegardés pour les retrouver facilement." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <FavoriteVersesView />
      </div>
    </div>
  );
}
