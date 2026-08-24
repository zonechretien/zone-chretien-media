import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeSectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-7 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="h-7 w-1 rounded-sm bg-brand-gold" />
        <h2 className="font-display text-[22px] font-black text-brand-navy dark:text-brand-text">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1.5 font-body text-[13px] font-semibold text-brand-blue transition hover:text-brand-gold dark:text-brand-text"
        >
          Voir tout <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
