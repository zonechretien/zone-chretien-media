"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_BIBLE_VERSION } from "@/lib/queries/bible";

type BibleVersionOption = { code: string; name: string };

/**
 * Sélecteur de traduction — ne rend rien tant qu'une seule traduction est
 * disponible en base (aujourd'hui : LSG1910 uniquement). Prêt pour le jour où
 * une deuxième traduction sera importée, sans changement de code nécessaire.
 */
export function BibleVersionSelector({
  versions,
  className,
}: {
  versions: BibleVersionOption[];
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (versions.length <= 1) return null;

  const current = searchParams.get("version") ?? DEFAULT_BIBLE_VERSION;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("version", e.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <label
      className={cn(
        "flex h-10 items-center gap-2 rounded-full border-[1.5px] border-border bg-surface-elevated px-3.5 text-sm text-foreground transition focus-within:border-gold",
        className,
      )}
    >
      <Languages size={16} className="shrink-0 text-muted" />
      <select
        value={current}
        onChange={handleChange}
        aria-label="Traduction de la Bible"
        className="bg-transparent text-sm text-foreground focus:outline-none"
      >
        {versions.map((v) => (
          <option key={v.code} value={v.code}>
            {v.name}
          </option>
        ))}
      </select>
    </label>
  );
}
