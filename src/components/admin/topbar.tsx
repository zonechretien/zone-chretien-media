"use client";

import Link from "next/link";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { Role } from "@prisma/client";

export function AdminTopbar({
  name,
  role,
  onMenuClick,
}: {
  name: string;
  role: Role;
  onMenuClick?: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface-elevated px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted">{role === "ADMIN" ? "Administrateur" : "Éditeur"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-gold hover:text-gold"
        >
          <ExternalLink size={13} /> Voir le site
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-red-400 hover:text-red-500"
          >
            <LogOut size={13} /> Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
