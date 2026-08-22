"use client";

import { useState } from "react";
import { Check, Copy, Music4 } from "lucide-react";

const LABEL_PATTERN = /^(couplet|refrain|chorus|pont|bridge|outro|intro)\b/i;

function parseVerses(lyrics: string) {
  return lyrics
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      const lines = block.split("\n");
      const firstLine = lines[0].trim();
      if (LABEL_PATTERN.test(firstLine) && lines.length > 1) {
        return { label: firstLine, text: lines.slice(1).join("\n").trim() };
      }
      return { label: `Partie ${i + 1}`, text: block };
    });
}

export function SongLyrics({ lyrics }: { lyrics: string }) {
  const [copied, setCopied] = useState(false);
  const verses = parseVerses(lyrics);

  function handleCopy() {
    navigator.clipboard.writeText(lyrics).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      id="lyrics"
      className="mb-7 scroll-mt-24 rounded-2xl bg-brand-navy p-6 shadow-brand-md sm:p-8"
      style={{
        backgroundImage: "radial-gradient(ellipse at 80% 20%, rgba(30,95,168,0.3) 0%, transparent 60%)",
      }}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-display text-lg font-bold text-white sm:text-xl">
          <Music4 size={18} className="text-brand-gold" />
          Paroles
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-body text-xs text-white/70 transition hover:bg-white/[0.18] hover:text-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <div className="grid gap-7 sm:grid-cols-2">
        {verses.map((verse, i) => {
          const isChorus = /^(refrain|chorus)/i.test(verse.label);
          return (
            <div
              key={i}
              className={
                isChorus
                  ? "rounded-xl border border-brand-gold/20 bg-brand-gold/[0.08] p-5 sm:col-span-2"
                  : undefined
              }
            >
              <div className="mb-2.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-brand-gold/80">
                {verse.label}
              </div>
              <div
                className={
                  isChorus
                    ? "whitespace-pre-line font-body text-[15px] font-medium leading-[1.9] text-white/95"
                    : "whitespace-pre-line font-body text-[15px] leading-[1.9] text-white/85"
                }
              >
                {verse.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
