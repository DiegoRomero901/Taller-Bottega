import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/server/domain/order-status";

/**
 * Edge-safe part of the auth config (no Prisma, no bcrypt), shared by `proxy.ts`.
 * Providers that touch the database live in `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isPublic =
        request.nextUrl.pathname.startsWith("/o/") || request.nextUrl.pathname === "/login";
      return isPublic || Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
