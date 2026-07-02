import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your HabitLog preferences and account.",
};

/** Settings page — placeholder for upcoming preferences and habit management. */
export default function SettingsPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Preferences and habit management are coming soon.
      </p>
    </section>
  );
}
