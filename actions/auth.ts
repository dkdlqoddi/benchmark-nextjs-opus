"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import {
  loginSchema,
  signupSchema,
  type AuthFormState,
} from "@/lib/auth-schema";

/**
 * Attempts a credentials sign-in that redirects to `/` on success. Returns
 * `false` only when the credentials are rejected (an `AuthError`); a successful
 * sign-in throws a `NEXT_REDIRECT`, which is re-thrown so the redirect
 * propagates to the framework.
 */
async function attemptCredentialsSignIn(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return true;
  } catch (error) {
    if (error instanceof AuthError) return false;
    throw error;
  }
}

/** Logs a user in from the login form; redirects home on success. */
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "Enter a valid email and password.", values: { email } };
  }

  const ok = await attemptCredentialsSignIn(
    parsed.data.email,
    parsed.data.password,
  );
  if (!ok) {
    return { error: "Invalid email or password.", values: { email } };
  }

  return {};
}

/** Creates a new account from the signup form, then logs the user in. */
export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const parsed = signupSchema.safeParse({ email, password });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: message, values: { email } };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      error: "An account with that email already exists.",
      values: { email },
    };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.user.create({
    data: { email: parsed.data.email, passwordHash },
  });

  const ok = await attemptCredentialsSignIn(
    parsed.data.email,
    parsed.data.password,
  );
  if (!ok) {
    // Account was created; if auto-login somehow fails, send them to log in.
    redirect("/login");
  }

  return {};
}

/** Signs the current user out and returns them to the login page. */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
