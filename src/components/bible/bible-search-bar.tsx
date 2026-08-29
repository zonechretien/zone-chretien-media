"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export function BibleSearchBar({ defaultValue = "", className }: { defaultValue?: string; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/bible/recherche?q=${encodeURIComponent(trimmed)}` : "/bible/recherche");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn(
        "flex h-12 items-center gap-2 rounded-full border-[1.5px] border-border bg-surface-elevated px-4 transition focus-within:border-gold",
        className,
      )}
    >
      <Search size={18} className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher un mot ou une phrase dans toute la Bible…"
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        aria-label="Recherche biblique"
      />
    </form>
  );
}
