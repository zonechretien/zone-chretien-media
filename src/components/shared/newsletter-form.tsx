"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeNewsletter } from "@/lib/actions/newsletter";
import { cn } from "@/lib/utils";

export function NewsletterForm({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await subscribeNewsletter({ firstName, email });
      if (result?.error) setError(result.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-body text-sm text-white", className)}>
        <Check size={16} className="text-brand-gold" />
        Merci ! Vous êtes inscrit(e) à la newsletter.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-2.5", className)}>
      {!compact && (
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Votre prénom"
          className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 outline-none transition focus:border-brand-gold"
        />
      )}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre adresse email"
        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 outline-none transition focus:border-brand-gold"
      />
      {error && <p className="font-body text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-gold to-brand-gold-light px-4 py-2.5 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "S'abonner gratuitement"}
        {!pending && <ArrowRight size={14} />}
      </button>
    </form>
  );
}
