"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function TagPicker({
  tags,
  selected,
  onChange,
}: {
  tags: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [value, setValue] = useState(selected);

  function toggle(id: string) {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    setValue(next);
    onChange(next);
  }

  if (tags.length === 0) {
    return <p className="text-sm text-muted">Aucun tag disponible pour le moment.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition",
              active && "border-gold bg-gold/15 text-gold",
            )}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
