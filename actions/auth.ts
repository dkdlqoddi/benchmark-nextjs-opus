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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    // A successful sign-in throws a NEXT_REDIRECT (re-thrown below); only a
    // genuine auth failure is an AuthError.
    if (error instanceof AuthError) {
      return { error: "Invalid email or password.", values: { email } };
    }
    throw error;
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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    // Account was created; if auto-login somehow fails, send them to log in.
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }

  return {};
}

/** Signs the current user out and returns them to the login page. */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
