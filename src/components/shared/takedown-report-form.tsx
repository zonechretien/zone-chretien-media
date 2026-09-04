"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitTakedownReport } from "@/lib/actions/takedown-reports";
import type { REPORTABLE_CONTENT_TYPES } from "@/lib/validations/takedown-reports";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-gold";

export function TakedownReportForm({
  contentType,
  contentId,
  contentTitle,
  contentUrl,
}: {
  contentType?: (typeof REPORTABLE_CONTENT_TYPES)[number];
  contentId?: string;
  contentTitle?: string;
  contentUrl?: string;
}) {
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitTakedownReport({
        requesterName,
        requesterEmail,
        message,
        contentType,
        contentId,
        contentTitle,
        contentUrl,
      });
      if (result?.error) setError(result.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-6 py-12 text-center">
        <CheckCircle2 size={40} className="text-gold" />
        <p className="text-lg font-semibold text-foreground">Votre demande a bien été reçue</p>
        <p className="max-w-sm text-sm text-muted">
          Nous la traiterons sous 48h. Merci de votre signalement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
      {contentTitle && (
        <div className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">
          Contenu concerné : <span className="font-medium text-foreground">{contentTitle}</span>
        </div>
      )}

      <div>
        <label htmlFor="requesterName" className="mb-1.5 block text-sm font-medium text-foreground">
          Votre nom
        </label>
        <input
          id="requesterName"
          required
          value={requesterName}
          onChange={(e) => setRequesterName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="requesterEmail" className="mb-1.5 block text-sm font-medium text-foreground">
          Votre email
        </label>
        <input
          id="requesterEmail"
          type="email"
          required
          value={requesterEmail}
          onChange={(e) => setRequesterEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-foreground">
          Décrivez le problème
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Expliquez pourquoi ce contenu devrait être retiré ou modifié (droits d'auteur, erreur d'attribution, etc.)"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer la demande"}
      </button>
    </form>
  );
}
