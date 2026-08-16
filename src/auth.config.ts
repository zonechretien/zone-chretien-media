import type { NextAuthConfig } from "next-auth";

/**
 * Config "Edge-safe" : ni Prisma ni bcrypt ici (indisponibles en middleware).
 * Le provider Credentials complet vit dans src/auth.ts, chargé uniquement
 * côté Node (API route / server actions).
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isLoginPage = pathname === "/admin/login";
      const isAdminRoute = pathname.startsWith("/admin");

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/admin", request.nextUrl));
        return true;
      }
      if (isAdminRoute) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        if (token.sub) session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [],
};
