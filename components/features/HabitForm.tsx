"use client";
// Client Component: manages the color-preset and target-day picker state and
// renders inline validation errors returned by the Server Action via useActionState.

import Link from "next/link";
import { useActionState, useState } from "react";
import { HABIT_COLORS } from "@/lib/colors";
import { WEEKDAY_LABELS } from "@/lib/date";
import { EVERY_DAY, isTargetWeekday, toggleWeekday } from "@/lib/target-days";
import type { HabitFormState } from "@/lib/habit-schema";

type HabitFormProps = {
  action: (prev: HabitFormState, formData: FormData) => Promise<HabitFormState>;
  initialValues?: {
    name: string;
    description: string;
    color: string;
    targetDays: number;
  };
  submitLabel: string;
};

/** Shared create/edit habit form with color, target-day pickers, and inline errors. */
export function HabitForm({
  action,
  initialValues,
  submitLabel,
}: HabitFormProps) {
  const [state, formAction, pending] = useActionState<HabitFormState, FormData>(
    action,
    {},
  );

  const initial = initialValues ?? {
    name: "",
    description: "",
    color: HABIT_COLORS[0],
    targetDays: EVERY_DAY,
  };
  const initialColor = (HABIT_COLORS as readonly string[]).includes(
    initial.color,
  )
    ? initial.color
    : HABIT_COLORS[0];
  const [color, setColor] = useState(initialColor);
  const [targetDays, setTargetDays] = useState(initial.targetDays);

  const inputClass =
    "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900";
  const errorClass = "text-sm text-red-600 dark:text-red-400";

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={50}
          defaultValue={state.values?.name ?? initial.name}
          aria-invalid={state.errors?.name ? true : undefined}
          aria-describedby={state.errors?.name ? "name-error" : undefined}
          className={inputClass}
        />
        {state.errors?.name ? (
          <p id="name-error" className={errorClass}>
            {state.errors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description{" "}
          <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={200}
          defaultValue={state.values?.description ?? initial.description}
          aria-invalid={state.errors?.description ? true : undefined}
          aria-describedby={
            state.errors?.description ? "description-error" : undefined
          }
          className={inputClass}
        />
        {state.errors?.description ? (
          <p id="description-error" className={errorClass}>
            {state.errors.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Color</span>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((preset) => {
            const selected = preset === color;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={`Select color ${preset}`}
                aria-pressed={selected}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-neutral-950 ${
                  selected
                    ? "ring-neutral-900 dark:ring-white"
                    : "ring-transparent"
                }`}
                style={{ backgroundColor: preset }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Target days</span>
        <input type="hidden" name="targetDays" value={targetDays} />
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const selected = isTargetWeekday(targetDays, weekday);
            return (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setTargetDays((mask) => toggleWeekday(mask, weekday))
                }
                aria-label={`${selected ? "Remove" : "Add"} ${label}`}
                aria-pressed={selected}
                className={`h-9 w-11 rounded-md border text-sm font-medium transition ${
                  selected
                    ? "border-transparent bg-blue-600 text-white hover:bg-blue-700"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-500">
          Streaks count only target days. You can still check in on other days.
        </p>
        {state.errors?.targetDays ? (
          <p className={errorClass}>{state.errors.targetDays}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
