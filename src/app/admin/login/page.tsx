import type { Metadata } from "next";
import { Music4 } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Connexion CMS", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
            <Music4 size={20} />
          </span>
          <h1 className="mt-3 text-xl font-bold text-foreground">Zone-Chrétien Media</h1>
          <p className="text-sm text-muted">Espace administrateur</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
