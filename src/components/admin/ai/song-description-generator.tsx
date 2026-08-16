"use client";

import { useState, useTransition } from "react";
import { Loader2, Music4, Sparkles } from "lucide-react";
import { generateSongDescriptionAction } from "@/lib/actions/ai";
import { GeneratorShell } from "./generator-shell";
import { CopyButton } from "./copy-button";
import { inputClass } from "@/components/admin/form-fields";

export function SongDescriptionGenerator() {
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [theme, setTheme] = useState("");
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    if (!title.trim() || !artistName.trim()) {
      setError("Titre et artiste sont requis.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await generateSongDescriptionAction({
        title,
        artistName,
        theme: theme || undefined,
      });
      if ("error" in result) setError(result.error);
      else setText(result.data);
    });
  }

  return (
    <GeneratorShell
      icon={Music4}
      title="Description de chanson"
      description="Une accroche courte à coller dans la fiche d'une chanson."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Titre de la chanson *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Artiste *"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Thème (optionnel)"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="mt-2 flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        Générer
      </button>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {text && (
        <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-foreground/80">{text}</p>
          <CopyButton text={text} />
        </div>
      )}
    </GeneratorShell>
  );
}
