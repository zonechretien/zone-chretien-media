"use client";

import { useState } from "react";
import { Music4, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { AdminSidebar } from "./sidebar";
import { AdminTopbar } from "./topbar";

export function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: Role;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 bg-navy lg:block">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gold">
            <Music4 size={16} />
          </span>
          <span className="text-sm font-semibold text-white">Zone-Chrétien CMS</span>
        </div>
        <AdminSidebar role={role} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-navy shadow-xl">
            <div className="flex h-16 items-center justify-between px-5">
              <span className="text-sm font-semibold text-white">Zone-Chrétien CMS</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70"
                aria-label="Fermer le menu"
              >
                <X size={18} />
              </button>
            </div>
            <AdminSidebar role={role} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar name={name} role={role} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
