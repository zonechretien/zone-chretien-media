import type { Metadata } from "next";
import {
  BookMarked,
  Eye,
  HandHeart,
  Library,
  Music4,
  Newspaper,
  Quote,
  Sparkles,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { requireSession } from "@/lib/admin/session";
import { getDashboardCounts, getMonthlyViewStats } from "@/lib/queries/admin-stats";
import { StatTile } from "@/components/admin/stat-tile";
import { MonthlyViewsChart } from "@/components/admin/monthly-views-chart";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await requireSession();
  const { erreur } = await searchParams;
  const [counts, monthlyViews] = await Promise.all([
    getDashboardCounts(),
    getMonthlyViewStats(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        Bonjour {session.user.name ?? session.user.email} 👋
      </h1>
      <p className="mt-1 text-muted">Vue d&apos;ensemble du contenu de Zone-Chrétien Media.</p>

      {erreur === "acces-refuse" && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          Cette section est réservée aux administrateurs.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Chansons" value={counts.songs} icon={Music4} href="/admin/chansons" />
        <StatTile label="Artistes" value={counts.artists} icon={Users} href="/admin/artistes" />
        <StatTile label="Vidéos" value={counts.videos} icon={Video} href="/admin/videos" />
        <StatTile label="Articles" value={counts.articles} icon={Newspaper} href="/admin/articles" />
        <StatTile label="Inspirations" value={counts.inspirations} icon={Sparkles} href="/admin/inspirations" />
        <StatTile label="Dévotions" value={counts.devotions} icon={BookMarked} href="/admin/devotions" />
        <StatTile label="Prières" value={counts.prayers} icon={HandHeart} href="/admin/prieres" />
        <StatTile label="Versets" value={counts.verses} icon={Quote} href="/admin/versets" />
        <StatTile label="Témoignages" value={counts.testimonies} icon={UserRound} href="/admin/temoignages" />
        <StatTile label="Bibliothèque" value={counts.resources} icon={Library} href="/admin/bibliotheque" />
        <StatTile label="Vues totales" value={counts.totalViews} icon={Eye} />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Vues des 6 derniers mois</h2>
        <MonthlyViewsChart data={monthlyViews} />
      </div>
    </div>
  );
}
