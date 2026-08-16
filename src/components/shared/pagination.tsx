import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pages,
  basePath,
  searchParams = {},
}: {
  page: number;
  pages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-2"
    >
      <PageLink href={hrefFor(page - 1)} disabled={prevDisabled} aria-label="Page précédente">
        <ChevronLeft size={16} />
      </PageLink>
      <span className="px-3 text-sm text-muted">
        Page {page} / {pages}
      </span>
      <PageLink href={hrefFor(page + 1)} disabled={nextDisabled} aria-label="Page suivante">
        <ChevronRight size={16} />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (disabled) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted/40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:border-gold hover:text-gold"
      {...props}
    >
      {children}
    </Link>
  );
}
