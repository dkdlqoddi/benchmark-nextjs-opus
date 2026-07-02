import { createHabit } from "@/actions/habits";
import { HabitForm } from "@/components/features/HabitForm";

/** New habit page: renders the shared habit form wired to the create action. */
export default function NewHabitPage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">New Habit</h1>
      <HabitForm action={createHabit} submitLabel="Create habit" />
    </section>
  );
}
