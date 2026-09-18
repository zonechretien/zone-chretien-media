"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, BookOpen, Headphones, CalendarRange, Heart, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Search;
  isActive: (pathname: string) => boolean;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/bible/recherche",
    label: "Rechercher",
    icon: Search,
    isActive: (p) => p.startsWith("/bible/recherche"),
  },
  {
    href: "/bible",
    label: "Lire la Bible",
    icon: BookOpen,
    // Repli par défaut : tout ce qui n'est pas une des autres routes du bloc.
    isActive: (p) =>
      p === "/bible" ||
      (p.startsWith("/bible/") &&
        !p.startsWith("/bible/recherche") &&
        !p.startsWith("/bible/plans") &&
        !p.startsWith("/bible/mes-versets-favoris") &&
        !p.startsWith("/bible/mon-historique")),
  },
  {
    href: "",
    label: "Écouter la Bible",
    icon: Headphones,
    isActive: () => false,
    disabled: true,
  },
  {
    href: "/bible/plans",
    label: "Plans de lecture",
    icon: CalendarRange,
    isActive: (p) => p.startsWith("/bible/plans"),
  },
  {
    href: "/bible/mes-versets-favoris",
    label: "Favoris",
    icon: Heart,
    isActive: (p) => p.startsWith("/bible/mes-versets-favoris"),
  },
  {
    href: "/versets",
    label: "Verset du jour",
    icon: Quote,
    isActive: (p) => p.startsWith("/versets"),
  },
];

function NavRow({ item, active, pill }: { item: NavItem; active: boolean; pill?: boolean }) {
  const Icon = item.icon;

  const rowClass = cn(
    "flex items-center gap-2.5 text-sm font-medium text-foreground/70 transition",
    pill ? "shrink-0 rounded-full px-4 py-2" : "rounded-lg px-3 py-2",
    active
      ? "bg-gold/15 text-gold hover:bg-gold/15 hover:text-gold"
      : "hover:bg-gold/10 hover:text-foreground",
  );

  if (item.disabled) {
    return (
      <span
        aria-disabled="true"
        title="Bientôt disponible"
        className={cn(rowClass, "cursor-not-allowed opacity-50 hover:bg-transparent")}
      >
        <Icon size={16} />
        {item.label}
        <span className="ml-auto rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
          Bientôt
        </span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={rowClass}>
      <Icon size={16} />
      {item.label}
    </Link>
  );
}

/** Rail vertical, sticky, visible à partir du breakpoint lg. */
export function BibleSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-60 flex-col gap-1 rounded-2xl border border-border bg-surface-elevated p-3">
      {NAV_ITEMS.map((item) => (
        <NavRow key={item.label} item={item} active={item.isActive(pathname)} />
      ))}
    </nav>
  );
}

/** Bande horizontale de pastilles défilable, visible sous le breakpoint lg. */
export function BibleSidebarMobile() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-border bg-surface-elevated p-2 lg:hidden">
      {NAV_ITEMS.map((item) => (
        <NavRow key={item.label} item={item} active={item.isActive(pathname)} pill />
      ))}
    </nav>
  );
}
