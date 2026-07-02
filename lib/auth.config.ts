import type { NextAuthConfig } from "next-auth";

/**
 * Base Auth.js (NextAuth v5) configuration shared by the app (`lib/auth.ts`)
 * and the proxy (`proxy.ts`). It is intentionally free of Node-only imports
 * (Prisma, bcrypt) so it stays lightweight for the proxy; the Credentials
 * provider — which needs the database and bcrypt — is added in `lib/auth.ts`.
 * Sessions are stateless JWTs, which is required for the Credentials provider.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    /** Persists the user id into the JWT when the user first signs in. */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    /** Copies the user id from the JWT onto the session read via `auth()`. */
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
