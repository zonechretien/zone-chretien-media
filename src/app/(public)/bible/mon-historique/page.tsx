import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BibleHistoryView } from "@/components/bible/bible-history-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mon historique de lecture",
  description: "Les derniers chapitres bibliques que vous avez consultés sur cet appareil.",
  path: "/bible/mon-historique",
  noIndex: true,
});

export default function BibleHistoryPage() {
  return (
    <div>
      <PageHeader
        title="Mon historique de lecture"
        description="Les derniers chapitres consultés, du plus récent au plus ancien."
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <BibleHistoryView />
      </div>
    </div>
  );
}
