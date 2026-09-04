import Link from "next/link";
import { Flag } from "lucide-react";
import type { REPORTABLE_CONTENT_TYPES } from "@/lib/validations/takedown-reports";

export function ReportContentLink({
  contentType,
  contentId,
  contentTitle,
  contentUrl,
}: {
  contentType: (typeof REPORTABLE_CONTENT_TYPES)[number];
  contentId: string;
  contentTitle: string;
  contentUrl: string;
}) {
  const params = new URLSearchParams({ type: contentType, id: contentId, title: contentTitle, url: contentUrl });

  return (
    <div className="mt-6 flex justify-center sm:justify-start">
      <Link
        href={`/signaler?${params.toString()}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <Flag size={12} />
        Vous êtes l&apos;artiste et souhaitez signaler un problème avec ce contenu ?
      </Link>
    </div>
  );
}
