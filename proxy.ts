import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js 16 renamed the `middleware` file convention to `proxy` (same feature,
// now Node.js runtime by default). This gates every matched route: when logged
// out, only /login and /signup are reachable — everything else redirects to
// /login; a logged-in user who visits /login or /signup is sent home. This is
// an optimistic gate; real authorization is enforced again at the data layer
// (see requireUserId / assertHabitOwner) because Server Actions can bypass it.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublicPath = PUBLIC_PATHS.has(nextUrl.pathname);

  if (isPublicPath) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", nextUrl));
    }
    return; // allow unauthenticated access to /login and /signup
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Authenticated on a protected route: continue (returning nothing = allow).
});

export const config = {
  // Run on every route except the auth API, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
