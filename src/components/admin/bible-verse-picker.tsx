"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { getBibleChapterVersesAction } from "@/lib/actions/bible";
import { selectClass } from "@/components/admin/form-fields";

type PickableBook = { slug: string; name: string; chapterCount: number };
type PickableVerse = { number: number; text: string };

export function BibleVersePicker({
  books,
  onPick,
}: {
  books: PickableBook[];
  onPick: (result: { reference: string; text: string }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [bookSlug, setBookSlug] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [verses, setVerses] = useState<PickableVerse[]>([]);
  const [verseNumber, setVerseNumber] = useState("");

  const selectedBook = books.find((b) => b.slug === bookSlug);

  function handleChapterChange(value: string) {
    setChapterNumber(value);
    setVerses([]);
    setVerseNumber("");
    if (!bookSlug || !value) return;
    startTransition(async () => {
      const result = await getBibleChapterVersesAction(bookSlug, Number(value));
      setVerses(result);
    });
  }

  function handleVerseChange(value: string) {
    setVerseNumber(value);
    if (!selectedBook || !chapterNumber || !value) return;
    const verse = verses.find((v) => v.number === Number(value));
    if (!verse) return;
    onPick({
      reference: `${selectedBook.name} ${chapterNumber}:${verse.number}`,
      text: verse.text,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Choisir un verset dans la Bible
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={bookSlug}
          className={selectClass}
          onChange={(e) => {
            setBookSlug(e.target.value);
            setChapterNumber("");
            setVerses([]);
            setVerseNumber("");
          }}
        >
          <option value="">Livre…</option>
          {books.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name}</option>
          ))}
        </select>

        <select
          value={chapterNumber}
          className={selectClass}
          disabled={!selectedBook}
          onChange={(e) => handleChapterChange(e.target.value)}
        >
          <option value="">Chapitre…</option>
          {selectedBook &&
            Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
        </select>

        <select
          value={verseNumber}
          className={selectClass}
          disabled={!chapterNumber || verses.length === 0}
          onChange={(e) => handleVerseChange(e.target.value)}
        >
          <option value="">{pending ? "Chargement…" : "Verset…"}</option>
          {verses.map((v) => (
            <option key={v.number} value={v.number}>
              {v.number} — {v.text.length > 40 ? `${v.text.slice(0, 40)}…` : v.text}
            </option>
          ))}
        </select>
      </div>
      {pending && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Loader2 size={12} className="animate-spin" /> Chargement du chapitre…
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        Remplit automatiquement les champs référence et texte ci-dessous — modifiables ensuite si besoin.
      </p>
    </div>
  );
}
