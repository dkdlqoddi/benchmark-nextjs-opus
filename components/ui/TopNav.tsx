import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/stats", label: "Stats" },
  { href: "/settings", label: "Settings" },
] as const;

/** Responsive top navigation bar with the HabitLog logo, menu, and theme toggle. */
export function TopNav() {
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <nav className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Habit<span className="text-blue-600 dark:text-blue-400">Log</span>
        </Link>
        <div className="flex items-center gap-2">
          <ul className="flex items-center gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-1.5 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
