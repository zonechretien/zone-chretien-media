"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export function FilterBar({
  basePath,
  filters,
}: {
  basePath: string;
  filters: { key: string; label: string; options: FilterOption[] }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className={cn("flex flex-wrap gap-3")}>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={searchParams.get(filter.key) ?? ""}
          onChange={(e) => handleChange(filter.key, e.target.value)}
          className="h-10 rounded-full border border-border bg-surface-elevated px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
