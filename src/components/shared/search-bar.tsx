"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({
  defaultValue = "",
  className,
  size = "md",
}: {
  defaultValue?: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/recherche?q=${encodeURIComponent(trimmed)}` : "/recherche");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 shadow-sm",
        size === "lg" ? "h-14 text-base" : "h-11 text-sm",
        className,
      )}
    >
      <Search size={size === "lg" ? 20 : 16} className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher chansons, artistes, versets, articles…"
        className="w-full bg-transparent text-foreground placeholder:text-muted focus:outline-none"
        aria-label="Recherche globale"
      />
    </form>
  );
}
