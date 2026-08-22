import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/shared/newsletter-form";

export function NewsletterSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-3xl bg-brand-navy px-6 py-12 sm:px-12"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 80% at 90% 20%, rgba(232,160,32,0.15) 0%, transparent 60%)",
        }}
      >
        <div className="relative mx-auto max-w-md text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
            <Mail size={22} />
          </span>
          <h2 className="mb-2 font-display text-2xl font-black text-white">Restez connecté(e)</h2>
          <p className="mb-6 font-body text-sm leading-relaxed text-white/70">
            Recevez les dernières chansons, articles et actualités directement dans votre boîte mail.
          </p>
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
