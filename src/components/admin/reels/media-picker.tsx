"use client";

/* eslint-disable @next/next/no-img-element -- miniatures servies par le studio local (127.0.0.1), hors next/image */
import { FolderOpen, Loader2, Music, X } from "lucide-react";
import { useState } from "react";
import type { MediaKind } from "@/lib/reels/form-model";
import { studio, thumbnailUrl, type LibraryItem } from "@/lib/reels/studio-client";
import { cn } from "@/lib/utils";

/** Dossiers de la bibliothèque où chercher chaque type de média. */
const FOLDERS: Record<MediaKind, string[]> = {
  image: ["Fonds", "Logos"],
  video: ["Fonds"],
  audio: ["Musiques", "VoixOff"],
};

/**
 * Sélection d'un média du disque externe (via le studio local). Seul le chemin
 * relatif est enregistré (ex. « Fonds/ciel.jpg »), jamais de chemin absolu.
 */
export function MediaPicker({
  kind,
  value,
  online,
  onChange,
}: {
  kind: MediaKind;
  value: string;
  online: boolean;
  onChange: (chemin: string, item: LibraryItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const { dossiers } = await studio.library();
      setItems(FOLDERS[kind].flatMap((f) => dossiers[f] ?? []).filter((i) => i.type === kind));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bibliothèque indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <code className={cn("min-w-0 flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 text-xs", !value && "text-muted")}>
          {value || "Aucun média choisi"}
        </code>
        <button
          type="button"
          onClick={load}
          disabled={!online}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground/80 transition hover:border-gold hover:text-gold disabled:opacity-50"
        >
          <FolderOpen size={14} /> Choisir sur le disque
        </button>
      </div>
      {!online && <p className="mt-1 text-xs text-muted">Lancez le studio local pour parcourir le disque.</p>}

      {open && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground/70">
              Dossier{FOLDERS[kind].length > 1 ? "s" : ""} {FOLDERS[kind].join(", ")} du disque
            </p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="text-foreground/60 hover:text-gold">
              <X size={16} />
            </button>
          </div>
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 size={14} className="animate-spin" /> Chargement…
            </p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {items && items.length === 0 && (
            <p className="text-sm text-muted">Aucun fichier de ce type. Copiez vos fichiers dans le dossier {FOLDERS[kind][0]} du disque.</p>
          )}
          {items && items.length > 0 && (
            <ul className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {items.map((item) => (
                <li key={item.chemin}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(item.chemin, item);
                      setOpen(false);
                    }}
                    className={cn(
                      "block w-full overflow-hidden rounded-lg border text-left transition hover:border-gold",
                      item.chemin === value ? "border-gold ring-2 ring-gold/40" : "border-border",
                    )}
                    title={item.chemin}
                  >
                    {item.miniature ? (
                      <img src={thumbnailUrl(item.chemin)} alt="" loading="lazy" className="aspect-[9/16] w-full bg-navy object-cover" />
                    ) : (
                      <span className="flex aspect-square w-full items-center justify-center bg-navy text-gold">
                        <Music size={20} />
                      </span>
                    )}
                    <span className="block truncate px-1.5 py-1 text-[11px] text-foreground/80">{item.nom}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
