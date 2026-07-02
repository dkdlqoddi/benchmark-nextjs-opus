import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { updateHabit } from "@/actions/habits";
import { HabitForm } from "@/components/features/HabitForm";
import { auth, requireUserId } from "@/lib/auth";
import { getOwnedHabit } from "@/lib/habits";

/**
 * Title from the habit being edited (owner-scoped); shares getOwnedHabit's cached
 * query with the page, so it adds no extra DB round-trip.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { title: "Edit habit" };
  const habit = await getOwnedHabit(id, userId);
  return { title: habit ? `Edit ${habit.name}` : "Edit habit" };
}

/** Edit habit page: loads the user's own habit and wires the shared form to update. */
export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  // Scope by userId so another user's habit id is unreachable (renders 404).
  const habit = await getOwnedHabit(id, userId);
  if (!habit) {
    notFound();
  }

  const action = updateHabit.bind(null, habit.id);

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Habit</h1>
      <HabitForm
        action={action}
        submitLabel="Update habit"
        initialValues={{
          name: habit.name,
          description: habit.description ?? "",
          color: habit.color,
          targetDays: habit.targetDays,
          tags: habit.tags.map((tag) => tag.name).join(", "),
        }}
      />
    </section>
  );
}
