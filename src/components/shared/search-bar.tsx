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
        "flex items-center gap-2 rounded-full border-[1.5px] border-brand-gray-light bg-brand-off-white px-4 transition focus-within:border-brand-blue focus-within:bg-brand-white",
        size === "lg" ? "h-14 text-base" : "h-9 text-[13px]",
        className,
      )}
    >
      <Search size={size === "lg" ? 20 : 13} className="shrink-0 text-brand-gray-dark" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher chansons, artistes, versets, articles…"
        className="w-full bg-transparent font-body text-brand-text placeholder:text-brand-gray-dark focus:outline-none"
        aria-label="Recherche globale"
      />
    </form>
  );
}
