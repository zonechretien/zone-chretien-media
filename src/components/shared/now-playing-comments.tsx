"use client";

import { MessageCircle } from "lucide-react";

/** Placeholder désactivé — pas de système de commentaires pour l'instant (même
 * traitement que l'item "Écouter la Bible" de la sidebar Bible). */
export function NowPlayingComments() {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center opacity-60">
      <MessageCircle size={28} className="text-brand-gray" />
      <div>
        <p className="font-body text-sm font-medium text-brand-gray-dark">Commentaires</p>
        <span className="mt-1.5 inline-block rounded-full bg-brand-gold/15 px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-brand-gold">
          Bientôt disponible
        </span>
      </div>
    </div>
  );
}
