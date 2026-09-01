"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

/** Champ de recherche qui met à jour `?q=` sur la page courante en conservant les
 * autres paramètres (filtres actifs) — contrairement à SearchBar/BibleSearchBar,
 * qui redirigent vers une page de recherche dédiée. */
export function InlineSearchInput({
  basePath,
  placeholder,
  className,
}: {
  basePath: string;
  placeholder: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn(
        "flex h-10 items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 transition focus-within:border-gold",
        className,
      )}
    >
      <Search size={15} className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        aria-label="Recherche"
      />
    </form>
  );
}
