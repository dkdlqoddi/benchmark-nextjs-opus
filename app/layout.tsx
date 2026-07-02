import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { TopNav } from "@/components/ui/TopNav";

export const metadata: Metadata = {
  title: "HabitLog",
  description: "Track your daily habits and build lasting streaks.",
};

/**
 * Root layout: global styles, the theme provider, and — only when a session
 * exists — the top nav. Logged-out routes (/login, /signup) render without it.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-white font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider>
          {session?.user ? (
            <TopNav userEmail={session.user.email ?? ""} />
          ) : null}
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
