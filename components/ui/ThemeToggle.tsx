"use client";
// Client Component: reads and updates the active theme via next-themes (needs
// the browser and theme context).

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const ORDER = ["system", "light", "dark"] as const;
type ThemeOption = (typeof ORDER)[number];

const LABEL: Record<ThemeOption, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function ThemeIcon({ theme }: { theme: ThemeOption }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
    "aria-hidden": true,
  };
  if (theme === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

/** Cycles the color theme between System, Light, and Dark. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // `mounted` is false during SSR and the first client render, then true after
  // hydration — via useSyncExternalStore, which is hydration-safe and avoids
  // calling setState inside an effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Before mount the theme is unknown; render a stable "system" placeholder so
  // the server and first client render match (no hydration mismatch).
  const current: ThemeOption =
    mounted && (ORDER as readonly string[]).includes(theme ?? "")
      ? (theme as ThemeOption)
      : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${LABEL[current]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[current]}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
    >
      {mounted ? (
        <ThemeIcon theme={current} />
      ) : (
        <span className="h-4 w-4" aria-hidden />
      )}
      <span className="sr-only">{LABEL[current]} theme</span>
    </button>
  );
}
