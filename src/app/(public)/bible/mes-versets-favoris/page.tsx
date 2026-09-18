import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FavoriteVersesView } from "@/components/bible/favorite-verses-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mes favoris bibliques",
  description: "Les versets et chapitres bibliques que vous avez sauvegardés sur cet appareil.",
  path: "/bible/mes-versets-favoris",
  noIndex: true,
});

export default function FavoriteVersesPage() {
  return (
    <div>
      <PageHeader title="Mes favoris" description="Les versets et chapitres que vous avez sauvegardés pour les retrouver facilement.">
        <Link
          href="/bible/mon-historique"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-gold"
        >
          <History size={14} />
          Voir mon historique de lecture →
        </Link>
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <FavoriteVersesView />
      </div>
    </div>
  );
}
