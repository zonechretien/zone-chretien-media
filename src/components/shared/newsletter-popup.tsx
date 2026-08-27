"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Mail, X } from "lucide-react";
import { NewsletterForm } from "@/components/shared/newsletter-form";

const SESSION_KEY = "zc_newsletter_popup_seen";
const SHOW_DELAY_MS = 1500;
const AUTO_CLOSE_AFTER_SUCCESS_MS = 2500;

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  function handleSuccess() {
    setTimeout(close, AUTO_CLOSE_AFTER_SUCCESS_MS);
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Restez connecté(e)"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-brand-navy px-6 py-10 shadow-2xl sm:px-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 80% at 90% 20%, rgba(232,160,32,0.15) 0%, transparent 60%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="relative text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
            <Mail size={22} />
          </span>
          <h2 className="mb-2 font-display text-2xl font-black text-white">Restez connecté(e)</h2>
          <p className="mb-6 font-body text-sm leading-relaxed text-white/70">
            Recevez les dernières chansons, articles et actualités directement dans votre boîte mail.
          </p>
          <NewsletterForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
