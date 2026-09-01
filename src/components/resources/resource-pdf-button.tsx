"use client";

import { FileText } from "lucide-react";
import { usePdfModal } from "@/components/shared/pdf-modal-provider";
import { incrementResourceDownload } from "@/lib/actions/resources";

export function ResourcePdfButton({
  id,
  url,
  title,
  previewable,
}: {
  id: string;
  url: string;
  title: string;
  previewable: boolean;
}) {
  const { openPdf } = usePdfModal();

  function handleClick() {
    openPdf(url, title, {
      previewable,
      onDownload: () => {
        incrementResourceDownload(id).catch(() => {});
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light px-6 py-3 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(232,160,32,0.4)]"
    >
      <FileText size={16} />
      Consulter
    </button>
  );
}
