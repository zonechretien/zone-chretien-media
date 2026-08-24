import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  href,
  hrefLabel = "Voir tout",
  className,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-navy dark:text-gold-soft">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-navy transition hover:gap-2 hover:text-gold-soft dark:text-gold-soft sm:flex"
        >
          {hrefLabel}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
