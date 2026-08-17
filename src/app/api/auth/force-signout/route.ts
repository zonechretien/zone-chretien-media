import { signOut } from "@/auth";

/**
 * Invalide la session courante puis redirige vers /admin/login.
 * Existe hors de /admin (matcher du middleware) car signOut() ne peut
 * modifier les cookies que dans un Server Action / Route Handler — jamais
 * pendant le rendu d'un Server Component (voir requireSession()).
 */
export async function GET() {
  await signOut({ redirectTo: "/admin/login" });
}
