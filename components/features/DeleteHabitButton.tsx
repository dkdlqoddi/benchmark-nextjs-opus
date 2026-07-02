"use client";
// Client Component: needs a confirmation dialog before invoking the delete
// Server Action, so it must run on the client.

import { useTransition } from "react";
import { deleteHabit } from "@/actions/habits";

/** Delete button that confirms before permanently removing a habit and its check-ins. */
export function DeleteHabitButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Permanently delete "${name}" and all its check-ins? This cannot be undone.`,
    );
    if (confirmed) {
      startTransition(() => deleteHabit(id));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md px-2.5 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
