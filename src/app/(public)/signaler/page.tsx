import { PageHeader } from "@/components/shared/page-header";
import { TakedownReportForm } from "@/components/shared/takedown-report-form";
import { REPORTABLE_CONTENT_TYPES } from "@/lib/validations/takedown-reports";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Signaler un contenu",
  description: "Vous êtes l'artiste ou l'ayant droit d'un contenu publié sur Zone-Chrétien Media et souhaitez signaler un problème ? Faites-le nous savoir.",
  path: "/signaler",
  noIndex: true,
});

type Props = {
  searchParams: Promise<{ type?: string; id?: string; title?: string; url?: string }>;
};

export default async function SignalerPage({ searchParams }: Props) {
  const params = await searchParams;
  const contentType = REPORTABLE_CONTENT_TYPES.find((t) => t === params.type);

  return (
    <div>
      <PageHeader
        title="Signaler un problème"
        description="Vous êtes l'artiste ou l'ayant droit d'un contenu publié ici et souhaitez signaler un problème de droits ou demander un retrait ? Décrivez-nous la situation, nous traitons chaque demande sous 48h."
      />
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8">
        <TakedownReportForm
          contentType={contentType}
          contentId={params.id}
          contentTitle={params.title}
          contentUrl={params.url}
        />
      </div>
    </div>
  );
}
