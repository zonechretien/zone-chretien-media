"use client";

import { Download } from "lucide-react";
import { incrementResourceDownload } from "@/lib/actions/resources";

export function ResourceDownloadLink({
  id,
  url,
  label = "Télécharger",
}: {
  id: string;
  url: string;
  label?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        incrementResourceDownload(id).catch(() => {});
      }}
      className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light px-6 py-3 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(232,160,32,0.4)]"
    >
      <Download size={16} />
      {label}
    </a>
  );
}
