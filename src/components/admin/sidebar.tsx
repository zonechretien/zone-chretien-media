"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  Users,
  Sparkles,
  HandHeart,
  Quote,
  UserRound,
  Newspaper,
  FolderTree,
  Tags,
  Megaphone,
  Settings,
  LayoutDashboard,
  Library,
  ListMusic,
  Music4,
  Video,
  Wand2,
  Mail,
  ShieldCheck,
  Flag,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { canAccessAdminPath } from "@/lib/admin/permissions";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; superAdminOnly?: boolean };
type NavSection = { title: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [{ href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Contenus",
    items: [
      { href: "/admin/chansons", label: "Chansons", icon: Music4 },
      { href: "/admin/playlists", label: "Playlists", icon: ListMusic },
      { href: "/admin/artistes", label: "Artistes", icon: Users },
      { href: "/admin/videos", label: "Vidéos", icon: Video },
      { href: "/admin/articles", label: "Articles", icon: Newspaper },
      { href: "/admin/inspirations", label: "Inspirations", icon: Sparkles },
      { href: "/admin/devotions", label: "Dévotions", icon: BookMarked },
      { href: "/admin/prieres", label: "Prières", icon: HandHeart },
      { href: "/admin/versets", label: "Versets", icon: Quote },
      { href: "/admin/temoignages", label: "Témoignages", icon: UserRound },
      { href: "/admin/bibliotheque", label: "Bibliothèque", icon: Library },
    ],
  },
  {
    title: "Organisation",
    items: [
      { href: "/admin/categories", label: "Catégories", icon: FolderTree },
      { href: "/admin/tags", label: "Tags", icon: Tags },
    ],
  },
  {
    title: "Assistant IA",
    items: [{ href: "/admin/ia", label: "Générateur IA", icon: Wand2 }],
  },
  {
    title: "Équipe",
    items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", icon: ShieldCheck, superAdminOnly: true }],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
      { href: "/admin/signalements", label: "Signalements", icon: Flag },
      { href: "/admin/banners", label: "Monétisation", icon: Megaphone },
      { href: "/admin/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.superAdminOnly) return role === "SUPER_ADMIN";
      return canAccessAdminPath(role, item.href);
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            {section.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white",
                    active && "bg-gold/15 text-gold hover:bg-gold/15 hover:text-gold",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
