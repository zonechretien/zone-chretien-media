"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { generateSocialPostAction } from "@/lib/actions/ai";
import { GeneratorShell } from "./generator-shell";
import { CopyButton } from "./copy-button";
import { inputClass } from "@/components/admin/form-fields";
import { FacebookIcon, WhatsappIcon } from "@/components/icons/social-icons";

export function SocialPostGenerator({ platform }: { platform: "facebook" | "whatsapp" }) {
  const [contentTypeLabel, setContentTypeLabel] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isFacebook = platform === "facebook";

  function handleGenerate() {
    if (!contentTypeLabel.trim() || !contentTitle.trim()) {
      setError("Type de contenu et titre sont requis.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await generateSocialPostAction({
        platform,
        contentTypeLabel,
        contentTitle,
        url: url || undefined,
      });
      if ("error" in result) setError(result.error);
      else setText(result.data);
    });
  }

  return (
    <GeneratorShell
      icon={isFacebook ? FacebookIcon : WhatsappIcon}
      title={isFacebook ? "Publication Facebook" : "Publication WhatsApp"}
      description={
        isFacebook
          ? "Un post prêt à partager pour promouvoir un contenu publié."
          : "Un message court et personnel à partager sur WhatsApp."
      }
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Type de contenu * (ex. une nouvelle chanson)"
          value={contentTypeLabel}
          onChange={(e) => setContentTypeLabel(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Titre du contenu *"
          value={contentTitle}
          onChange={(e) => setContentTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Lien (optionnel)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
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
          <p className="whitespace-pre-line text-foreground/80">{text}</p>
          <CopyButton text={text} />
        </div>
      )}
    </GeneratorShell>
  );
}
