import Link from "next/link";
import { signupAction } from "@/actions/auth";
import { AuthForm } from "@/components/features/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a HabitLog account and start building lasting streaks.",
};

/** Signup page: creates an account then logs in. Reachable while logged out. */
export default function SignupPage() {
  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Sign up</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        Create an account to start tracking habits.
      </p>

      <AuthForm
        action={signupAction}
        submitLabel="Create account"
        passwordAutoComplete="new-password"
        passwordHint="At least 8 characters."
      />

      <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Log in
        </Link>
      </p>
    </section>
  );
}
