"use client";
// Client Component: uses useActionState to render the server-returned auth error
// and a pending state while credentials are verified.

import { useActionState } from "react";
import type { AuthFormState } from "@/lib/auth-schema";

type AuthFormProps = {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  passwordHint?: string;
};

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900";

/** Shared email + password form for the login and signup pages. */
export function AuthForm({
  action,
  submitLabel,
  passwordAutoComplete,
  passwordHint,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={passwordAutoComplete}
          className={inputClass}
        />
        {passwordHint ? (
          <p className="text-xs text-neutral-500">{passwordHint}</p>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
