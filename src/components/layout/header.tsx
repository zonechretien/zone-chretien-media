"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Music4, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { SearchBar } from "@/components/shared/search-bar";

const NAV_LINKS = [
  { href: "/chansons", label: "Chansons" },
  { href: "/artistes", label: "Artistes" },
  { href: "/videos", label: "Vidéos" },
  { href: "/inspirations", label: "Inspirations" },
  { href: "/devotions", label: "Dévotions" },
  { href: "/prieres", label: "Prières" },
  { href: "/versets", label: "Versets" },
  { href: "/temoignages", label: "Témoignages" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-gold">
            <Music4 size={18} />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            Zone-Chrétien <span className="text-gold">Media</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-surface hover:text-foreground",
                pathname.startsWith(link.href) && "bg-surface text-gold",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <SearchBar className="w-56 lg:w-72" />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-4 md:hidden">
          <SearchBar className="mb-4 w-full" />
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-surface",
                  pathname.startsWith(link.href) && "bg-surface text-gold",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
