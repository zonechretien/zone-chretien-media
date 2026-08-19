"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Music4, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { SearchBar } from "@/components/shared/search-bar";

const EDIFICATION_LINKS = [
  { href: "/inspirations", label: "Inspirations" },
  { href: "/devotions", label: "Dévotions" },
  { href: "/prieres", label: "Prières" },
  { href: "/versets", label: "Versets" },
  { href: "/temoignages", label: "Témoignages" },
];

const NAV_LINKS = [
  { href: "/chansons", label: "Chansons" },
  { href: "/artistes", label: "Artistes" },
  { href: "/videos", label: "Vidéos" },
  { label: "Édification", children: EDIFICATION_LINKS },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [edificationOpen, setEdificationOpen] = useState(false);
  const [mobileEdificationOpen, setMobileEdificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEdificationActive = EDIFICATION_LINKS.some((link) => pathname.startsWith(link.href));

  useEffect(() => {
    if (!edificationOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEdificationOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEdificationOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [edificationOpen]);

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
          {NAV_LINKS.map((link) =>
            link.children ? (
              <div key={link.label} className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setEdificationOpen((v) => !v)}
                  aria-expanded={edificationOpen}
                  aria-haspopup="true"
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-surface hover:text-foreground",
                    (isEdificationActive || edificationOpen) && "bg-surface text-gold",
                  )}
                >
                  {link.label}
                  <ChevronDown size={14} className={cn("transition", edificationOpen && "rotate-180")} />
                </button>
                {edificationOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-lg">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setEdificationOpen(false)}
                        className={cn(
                          "block px-4 py-2 text-sm text-foreground/80 transition hover:bg-surface hover:text-foreground",
                          pathname.startsWith(child.href) && "text-gold",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
            ),
          )}
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
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <button
                    type="button"
                    onClick={() => setMobileEdificationOpen((v) => !v)}
                    aria-expanded={mobileEdificationOpen}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-surface",
                      isEdificationActive && "text-gold",
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      size={16}
                      className={cn("transition", mobileEdificationOpen && "rotate-180")}
                    />
                  </button>
                  {mobileEdificationOpen && (
                    <div className="ml-3 flex flex-col gap-1 border-l border-border pl-3">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => {
                            setOpen(false);
                            setMobileEdificationOpen(false);
                          }}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm text-foreground/70 transition hover:bg-surface",
                            pathname.startsWith(child.href) && "text-gold",
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              ),
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
