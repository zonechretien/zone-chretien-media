import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Hors ligne", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy px-6 text-center text-white">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-gold">
        <WifiOff size={28} />
      </span>
      <h1 className="text-2xl font-bold">Vous êtes hors ligne</h1>
      <p className="max-w-sm text-white/70">
        Impossible de charger cette page sans connexion. Les pages déjà visitées restent
        disponibles ; reconnectez-vous pour continuer à explorer Zone-Chrétien Media.
      </p>
    </div>
  );
}
