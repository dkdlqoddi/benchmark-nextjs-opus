import { notFound } from "next/navigation";
import { updateHabit } from "@/actions/habits";
import { HabitForm } from "@/components/features/HabitForm";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

/** Edit habit page: loads the user's own habit and wires the shared form to update. */
export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  // Scope by userId so another user's habit id is unreachable (renders 404).
  const habit = await prisma.habit.findFirst({
    where: { id, userId },
    include: { tags: { select: { name: true }, orderBy: { name: "asc" } } },
  });
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
