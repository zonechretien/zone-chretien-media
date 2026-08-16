import { SearchBar } from "@/components/shared/search-bar";

export function Hero({ siteName, tagline }: { siteName: string; tagline: string }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--gold) 0%, transparent 45%), radial-gradient(circle at 80% 60%, var(--gold) 0%, transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          {siteName}
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {tagline}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Chansons, artistes, dévotions, prières et enseignements — un espace
          chrétien pour nourrir votre foi chaque jour.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBar size="lg" className="bg-white/95 text-navy shadow-xl" />
        </div>
      </div>
    </section>
  );
}
