import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { loginSchema } from "@/lib/auth-schema";

/**
 * Auth.js (NextAuth v5) instance. Exposes `handlers` (the `/api/auth/*` route
 * handlers), plus the server-side `auth`, `signIn`, and `signOut` helpers. It
 * uses a single Credentials provider that verifies an email + bcrypt-hashed
 * password against the `User` table; sessions are stateless JWTs.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Returns the user record on valid credentials, or null to reject login.
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});

/**
 * Returns the authenticated user's id, or redirects to `/login` when there is
 * no session. Call this at the top of every page and Server Action that reads
 * or writes user data so authorization is enforced at the data layer — the
 * proxy alone is not sufficient (it does not run for every Server Action path).
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

/**
 * Ensures the habit exists and belongs to `userId`, throwing otherwise. Every
 * habit/check-in mutation calls this so one user can never read or mutate
 * another user's data — even by invoking a Server Action directly with a
 * guessed habit id.
 */
export async function assertHabitOwner(
  habitId: string,
  userId: string,
): Promise<void> {
  const owned = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  if (!owned) {
    throw new Error("Habit not found.");
  }
}

/**
 * Resolves the current user and asserts they own `habitId`, returning the user
 * id. Combines requireUserId + assertHabitOwner for mutations that act on a
 * single habit with no other work between the two checks (archive/restore/
 * delete). Actions that must validate input first (e.g. updateHabit) still call
 * the two helpers separately to preserve check ordering.
 */
export async function requireHabitOwner(habitId: string): Promise<string> {
  const userId = await requireUserId();
  await assertHabitOwner(habitId, userId);
  return userId;
}
