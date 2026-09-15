import { Lightbulb, HandHeart } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

export type VerseMeditationData = {
  reflection: string;
  application: string;
  prayer: string;
};

/**
 * Contenu de la méditation structurée — même traitement visuel que les
 * pages Dévotions (src/app/(public)/devotions/[slug]/page.tsx), par
 * cohérence : Réflexion en texte simple, Application dans une carte
 * bordée avec icône, Prière en texte simple.
 */
export function VerseMeditation({ meditation }: { meditation: VerseMeditationData }) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-lg font-semibold text-foreground">Réflexion</h3>
        <div
          className="prose prose-neutral mt-2 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(meditation.reflection) }}
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-gold-soft">
          <Lightbulb size={16} /> Application pratique
        </div>
        <div
          className="prose prose-neutral mt-2 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(meditation.application) }}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-gold-soft">
          <HandHeart size={16} /> Prière
        </div>
        <div
          className="prose prose-neutral mt-2 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(meditation.prayer) }}
        />
      </section>
    </div>
  );
}
