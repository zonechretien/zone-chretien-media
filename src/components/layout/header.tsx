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
  { href: "/", label: "Accueil", exact: true },
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
  const isLinkActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

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
    <header className="sticky top-0 z-50 bg-brand-white shadow-brand-sm">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-navy to-brand-blue text-brand-gold">
            <Music4 size={20} />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block font-accent text-2xl tracking-[2px] text-brand-text">
              Zone-Chrétien
            </span>
            <span className="block text-[10px] uppercase tracking-[1px] text-brand-gray">
              Media Gospel &amp; Chrétienne
            </span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <div key={link.label} className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setEdificationOpen((v) => !v)}
                  aria-expanded={edificationOpen}
                  aria-haspopup="true"
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3.5 py-2 font-body text-[13.5px] font-medium text-brand-gray-dark transition hover:bg-brand-off-white hover:text-brand-navy",
                    (isEdificationActive || edificationOpen) && "bg-brand-off-white text-brand-navy",
                  )}
                >
                  {link.label}
                  <ChevronDown size={13} className={cn("transition", edificationOpen && "rotate-180")} />
                </button>
                {edificationOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl bg-brand-white py-1 shadow-brand-md">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setEdificationOpen(false)}
                        className={cn(
                          "block px-4 py-2 font-body text-[13.5px] text-brand-gray-dark transition hover:bg-brand-off-white hover:text-brand-navy",
                          pathname.startsWith(child.href) && "text-brand-blue",
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
                  "relative rounded-md px-3.5 py-2 font-body text-[13.5px] font-medium text-brand-gray-dark transition hover:bg-brand-off-white hover:text-brand-navy",
                  isLinkActive(link.href, link.exact) && "bg-brand-off-white text-brand-navy",
                )}
              >
                {link.label}
                {isLinkActive(link.href, link.exact) && (
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-brand-gold" />
                )}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 md:flex">
          <SearchBar className="w-48 lg:w-64" />
          <ThemeToggle />
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-brand-gray-light text-brand-gray-dark"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-brand-gray-light bg-brand-white px-4 pb-6 pt-4 md:hidden">
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
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-body text-sm font-medium text-brand-gray-dark transition hover:bg-brand-off-white",
                      isEdificationActive && "text-brand-navy",
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      size={16}
                      className={cn("transition", mobileEdificationOpen && "rotate-180")}
                    />
                  </button>
                  {mobileEdificationOpen && (
                    <div className="ml-3 flex flex-col gap-1 border-l border-brand-gray-light pl-3">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => {
                            setOpen(false);
                            setMobileEdificationOpen(false);
                          }}
                          className={cn(
                            "rounded-lg px-3 py-2 font-body text-sm text-brand-gray-dark transition hover:bg-brand-off-white",
                            pathname.startsWith(child.href) && "text-brand-blue",
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
                    "rounded-lg px-3 py-2.5 font-body text-sm font-medium text-brand-gray-dark transition hover:bg-brand-off-white",
                    isLinkActive(link.href, link.exact) && "bg-brand-off-white text-brand-navy",
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
