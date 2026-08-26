"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { inputClass } from "./form-fields";

export type PickableSong = { id: string; title: string; artistName: string; imageUrl: string };

export function SongPicker({
  songs,
  selected,
  onChange,
}: {
  songs: PickableSong[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return songs
      .filter((s) => !selected.includes(s.id))
      .filter((s) => s.title.toLowerCase().includes(q) || s.artistName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [songs, selected, query]);

  function add(id: string) {
    onChange([...selected, id]);
    setQuery("");
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une chanson par titre ou artiste…"
          className={`${inputClass} pl-9`}
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-lg">
            {results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => add(s.id)}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition hover:bg-surface"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-navy">
                  <Image src={s.imageUrl} alt="" fill className="object-cover" sizes="32px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{s.title}</p>
                  <p className="truncate text-xs text-muted">{s.artistName}</p>
                </div>
                <Plus size={15} className="shrink-0 text-gold" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        {selected.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3.5 py-6 text-center text-sm text-muted">
            Aucune chanson ajoutée. Recherchez un titre ci-dessus pour commencer.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {selected.map((id, index) => {
              const song = songsById.get(id);
              if (!song) return null;
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <span className="w-5 shrink-0 text-center text-xs font-medium text-muted">{index + 1}</span>
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-navy">
                    <Image src={song.imageUrl} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
                    <p className="truncate text-xs text-muted">{song.artistName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Monter"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground/70 transition hover:border-gold hover:text-gold disabled:opacity-30"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === selected.length - 1}
                      aria-label="Descendre"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground/70 transition hover:border-gold hover:text-gold disabled:opacity-30"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      aria-label="Retirer"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground/70 transition hover:border-red-400 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
