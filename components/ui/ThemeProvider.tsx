"use client";
// Client Component: next-themes relies on browser APIs (localStorage, matchMedia)
// and React context, so the provider must run on the client.

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/** Provides class-based light/dark/system theme context to the whole app. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
