import { notFound } from "next/navigation";
import { updateHabit } from "@/actions/habits";
import { HabitForm } from "@/components/features/HabitForm";
import { prisma } from "@/lib/prisma";

/** Edit habit page: loads a habit and renders the shared form wired to update. */
export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const habit = await prisma.habit.findUnique({ where: { id } });
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
        }}
      />
    </section>
  );
}
