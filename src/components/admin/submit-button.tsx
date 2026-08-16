import Link from "next/link";
import { Loader2 } from "lucide-react";

export function SubmitButton({ pending, label = "Enregistrer" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {label}
    </button>
  );
}

export function CancelLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 transition hover:border-gold hover:text-gold"
    >
      Annuler
    </Link>
  );
}
