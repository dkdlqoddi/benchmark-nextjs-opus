import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { AuthForm } from "@/components/features/AuthForm";

/** Login page: email + password sign-in. Reachable while logged out (see proxy.ts). */
export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Log in</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        Welcome back to HabitLog.
      </p>

      <AuthForm
        action={loginAction}
        submitLabel="Log in"
        passwordAutoComplete="current-password"
      />

      <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        No account?{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Sign up
        </Link>
      </p>
    </section>
  );
}
