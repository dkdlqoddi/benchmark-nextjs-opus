import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/ui/TopNav";

export const metadata: Metadata = {
  title: "HabitLog",
  description: "Track your daily habits and build lasting streaks.",
};

/** Root layout: applies global styles and wraps every page with the top nav. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-white font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <TopNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
