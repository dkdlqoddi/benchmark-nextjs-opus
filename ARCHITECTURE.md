# HabitLog — Architecture

HabitLog is a habit tracker web app: create habits, check in once per day, and
review streaks and completion trends. This document describes how the codebase
is organized and how data flows through it. For the coding standards and
per-task workflow rules, see [`CLAUDE.md`](./CLAUDE.md); for setup and scripts,
see [`README.md`](./README.md).

## Contents

- [Tech stack](#tech-stack)
- [Architectural overview](#architectural-overview)
- [Project layout](#project-layout)
- [Data model](#data-model)
- [The rendering & data-flow model](#the-rendering--data-flow-model)
- [Routes](#routes)
- [Server Actions (the mutation layer)](#server-actions-the-mutation-layer)
- [The `lib/` layer](#the-lib-layer)
- [Components](#components)
- [Validation & constraints](#validation--constraints)
- [Styling & theming](#styling--theming)
- [Tooling, scripts & data lifecycle](#tooling-scripts--data-lifecycle)
- [Key architectural decisions](#key-architectural-decisions)

---

## Tech stack

| Concern         | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Framework       | **Next.js 16.2.10** (App Router)                             |
| UI runtime      | **React 19.2.4** (Server + Client Components)                |
| Language        | **TypeScript 5** (`strict` mode)                             |
| Styling         | **Tailwind CSS v4** (CSS-first config, no `tailwind.config`) |
| Theming         | **next-themes 0.4.6** (class-based light/dark/system)        |
| Data            | **Prisma ORM 6.19.3** + **SQLite** (`prisma/dev.db`)         |
| Validation      | **Zod 4** (server-side form validation)                      |
| Charts          | **visx 4** (`@visx/scale`, `@visx/shape`, `@visx/group`)     |
| Lint / format   | **ESLint 9** (flat config) + **Prettier 3**                  |
| Package manager | **npm**                                                      |

> **Note on the Next.js version.** This project targets Next.js 16, whose App
> Router differs from earlier versions in ways this codebase relies on:
> `params` and `searchParams` are **async** (`Promise`-typed and `await`-ed),
> the caching model is the "previous model" (route-segment `dynamic` config +
> `revalidatePath`) rather than Cache Components / `use cache`, and mutations
> use React 19 Server Actions with `useActionState`. See
> [`AGENTS.md`](./AGENTS.md) and `node_modules/next/dist/docs/` before changing
> framework-level code.

---

## Architectural overview

HabitLog is a **server-centric, single-tier web app**. There is no separate API
service, no client-side data store, and no authentication layer — it is a local,
single-user application backed by a file-based SQLite database.

The whole app is built from two primitives:

- **Server Components read.** Route pages are `async` Server Components that
  query the database directly through the shared Prisma client and render HTML
  on the server.
- **Server Actions write.** Every mutation is a function in `actions/` marked
  `"use server"`. Forms submit to these actions; after writing, each action
  calls `revalidatePath(...)` so the affected pages re-render with fresh data.

```
                      ┌──────────────────────────────────────────┐
                      │                 Browser                    │
                      │   HTML + minimal client JS (forms, theme)  │
                      └───────────────┬───────────────▲───────────┘
                        form submit   │               │  fresh HTML / RSC
                        (Server Action)│              │  (after revalidate)
                      ┌───────────────▼───────────────┴───────────┐
                      │              Next.js server                 │
                      │                                             │
                      │  Server Components ──read──► Prisma client  │
                      │  (app/**/page.tsx)          (lib/prisma.ts) │
                      │                                    │        │
                      │  Server Actions  ──write──────────►│        │
                      │  (actions/*.ts)   then revalidatePath        │
                      └────────────────────────────────────┼───────┘
                                                            │
                                                     ┌──────▼──────┐
                                                     │   SQLite    │
                                                     │ prisma/dev.db│
                                                     └─────────────┘
```

Client-side JavaScript exists only where interactivity genuinely requires it:
the habit form (inline validation + color picker), the delete confirmation
dialog, and the theme provider/toggle. Everything else is server-rendered and
works without JS — the check-in and archive buttons are plain `<form>`s wired
to Server Actions.

---

## Project layout

The directory structure is fixed by project convention (Rule 4 in
[`CLAUDE.md`](./CLAUDE.md)):

```
app/                          # App Router routes + root layout (the "read" side)
├── layout.tsx                # Root layout: ThemeProvider + TopNav + <main>
├── page.tsx                  # Home — grid of active habits, check-in-today
├── globals.css               # Tailwind import + dark-mode custom variant
├── habits/
│   ├── new/page.tsx          # Create form (static)
│   ├── archived/page.tsx     # Archived list: restore / permanent delete
│   └── [id]/
│       ├── page.tsx          # Habit detail: monthly check-in calendar
│       └── edit/page.tsx     # Edit form
├── stats/page.tsx            # Weekly completion chart + per-habit streak table
└── settings/page.tsx         # Placeholder

components/
├── ui/                       # Generic, domain-agnostic UI
│   ├── TopNav.tsx            #   (Server) nav bar
│   ├── ThemeProvider.tsx     #   (Client) next-themes provider
│   └── ThemeToggle.tsx       #   (Client) system/light/dark cycle
└── features/                 # Domain components
    ├── HabitCard.tsx         #   (Server) card + check-in/archive forms
    ├── HabitForm.tsx         #   (Client) shared create/edit form
    ├── CalendarMonth.tsx     #   (Server) month grid of toggle buttons
    ├── DeleteHabitButton.tsx #   (Client) confirm-then-delete
    └── WeeklyCompletionChart.tsx # (Server) visx SVG bar chart

actions/                      # Server Actions — the ONLY place data is mutated
├── habits.ts                 # create / update / archive / restore / delete
└── check-ins.ts              # toggleCheckIn / toggleToday

lib/                          # Framework-agnostic utilities + Prisma client
├── prisma.ts                 # Shared PrismaClient singleton
├── date.ts                   # Asia/Seoul date logic, YYYY-MM-DD keys, calendars
├── streak.ts                 # Pure streak & completion-rate math
├── colors.ts                 # The 8 habit-color presets (single source of truth)
└── habit-schema.ts           # Zod schema + form-state types

prisma/
├── schema.prisma             # Habit + CheckIn models
├── migrations/               # SQL migration history
└── seed.ts                   # Idempotent sample-data seeder (run via tsx)

scripts/verify-streak.ts      # Lightweight assertion harness for lib/streak
bench-reports/                # Per-task work reports (pNN.md)
```

Path alias: `@/*` maps to the repo root (`tsconfig.json`), so imports read as
`@/lib/date`, `@/actions/habits`, `@/components/features/HabitCard`.

**Naming (Rule 3):** component files are PascalCase (`HabitCard.tsx`); everything
else is kebab-case (`check-ins.ts`, `habit-schema.ts`). Route files
(`page.tsx`, `layout.tsx`) are lowercase because Next.js mandates those exact
names.

---

## Data model

Two tables, defined in [`prisma/schema.prisma`](./prisma/schema.prisma). IDs are
`cuid()` strings.

```
┌──────────────────────────┐          ┌──────────────────────────────┐
│ Habit                     │          │ CheckIn                       │
├──────────────────────────┤          ├──────────────────────────────┤
│ id          String  PK    │ 1      ∞ │ id        String  PK          │
│ name        String        │──────────│ habitId   String  FK ─────────┼──► Habit.id
│ description String?        │          │ date      String  "YYYY-MM-DD"│    (onDelete: Cascade)
│ color       String  hex   │          │ createdAt DateTime            │
│ createdAt   DateTime      │          ├──────────────────────────────┤
│ archivedAt  DateTime?     │          │ @@unique([habitId, date])     │
│ checkIns    CheckIn[]     │          └──────────────────────────────┘
└──────────────────────────┘
```

- **Habit** — a tracked habit. `archivedAt` is a soft-delete/hide flag: `null`
  means active (shown on Home), non-null means archived (shown only on the
  Archived page). Habits are never hard-deleted except by the explicit
  permanent-delete action on the Archived page.
- **CheckIn** — one row per habit per day it was completed. `date` is stored as a
  `YYYY-MM-DD` **string**, not a `DateTime`. The `@@unique([habitId, date])`
  constraint enforces "at most one check-in per habit per day" at the database
  level, which makes the toggle operation safe.

**Why dates are strings.** All date logic is anchored to a single timezone
(Asia/Seoul) rather than the server's clock or UTC. Storing the already-resolved
`YYYY-MM-DD` key sidesteps timezone drift on read, and because these keys sort
lexicographically, date-range queries reduce to string comparisons (`date >=
start && date <= end`) and "this month" becomes a `startsWith("YYYY-MM")` filter.

**Length limits are not in the database.** SQLite does not enforce string
lengths, so `name` (1–50 chars) and `description` (≤200 chars), plus the hex
color format, are validated in the Server Actions layer via Zod (see
[Validation & constraints](#validation--constraints)).

---

## The rendering & data-flow model

### Read path (Server Components → Prisma)

Every data-backed page is an `async` Server Component that awaits Prisma queries
and renders the result. Example shape (Home):

```tsx
export const dynamic = "force-dynamic";           // always re-query per request

export default async function HomePage() {
  const habits = await prisma.habit.findMany({ where: { archivedAt: null }, ... });
  const todaysCheckIns = await prisma.checkIn.findMany({ where: { date: todayKey, ... } });
  return /* render HabitCards */;
}
```

**Why `export const dynamic = "force-dynamic"`.** Pages that read the database
but take _no_ request-time input — Home, Stats, Archived — would otherwise be
candidates for static prerendering and could serve stale data. `force-dynamic`
opts them into per-request rendering so they always reflect current DB state.
The dynamic-segment pages (`habits/[id]` and `.../edit`) are already dynamic
because they `await params`/`searchParams` (a request-time API), so they re-run
per request regardless; `habits/[id]` additionally declares `force-dynamic`
explicitly. The `habits/new` page reads nothing and stays static.

### Write path (form → Server Action → revalidate)

Mutations never touch the database from a component. A form's `action` points at
a Server Action, which validates, writes via Prisma, then revalidates the paths
whose rendered output just went stale:

```
┌── Client ──────────────┐     ┌── Server Action (actions/*.ts) ─────────────────┐
│ <form action={toggle-  │     │ "use server"                                     │
│   Today.bind(null,id)}>│ ──► │  1. validate input (guard clauses / Zod)         │
│   <button>Check in</…> │     │  2. prisma.<write>(...)                           │
│ </form>                │     │  3. revalidatePath("/")  (+ redirect on create)  │
└────────────────────────┘     └──────────────────────────────────────────────────┘
                                                 │
                              re-render affected routes with fresh DB data
```

Two form-wiring styles coexist:

1. **Server-driven forms (no client JS).** `HabitCard`, `CalendarMonth`, and the
   Archived page render plain `<form action={someAction.bind(null, id, ...)}>`.
   Arguments are pre-bound with `.bind(null, ...)`; these work with JavaScript
   disabled.
2. **Client-enhanced forms.** `HabitForm` uses React 19's `useActionState` to
   render inline field errors returned by the action; `DeleteHabitButton` uses
   `useTransition` after a `window.confirm(...)` dialog.

`createHabit`/`updateHabit` finish with `redirect("/")`; the toggle/archive/
restore/delete actions finish with `revalidatePath(...)` and stay on the page.

---

## Routes

| Route               | File                            | Type    | Purpose                                                           |
| ------------------- | ------------------------------- | ------- | ----------------------------------------------------------------- |
| `/`                 | `app/page.tsx`                  | dynamic | Grid of active habits; each card has a "check in today" toggle.   |
| `/habits/new`       | `app/habits/new/page.tsx`       | static  | Create form (`HabitForm` → `createHabit`).                        |
| `/habits/[id]`      | `app/habits/[id]/page.tsx`      | dynamic | Habit detail: monthly check-in calendar with prev/next month nav. |
| `/habits/[id]/edit` | `app/habits/[id]/edit/page.tsx` | dynamic | Edit form (`HabitForm` → `updateHabit` bound to the id).          |
| `/habits/archived`  | `app/habits/archived/page.tsx`  | dynamic | Archived habits with **Restore** and **Delete permanently**.      |
| `/stats`            | `app/stats/page.tsx`            | dynamic | Weekly completion-rate chart + per-habit streak/total table.      |
| `/settings`         | `app/settings/page.tsx`         | static  | Placeholder ("coming soon").                                      |

The root layout (`app/layout.tsx`) wraps all routes in `ThemeProvider`, renders
the `TopNav`, and centers content in a `max-w-5xl` `<main>`. There are **no API
routes and no middleware** — by convention, all mutations go through Server
Actions (Rule 2).

---

## Server Actions (the mutation layer)

All mutations live in two files, each marked `"use server"`.

**`actions/habits.ts`**

| Action         | Signature                               | Effect                                                             |
| -------------- | --------------------------------------- | ------------------------------------------------------------------ |
| `createHabit`  | `(prev, formData) → HabitFormState`     | Validate (Zod) → create → `revalidatePath("/")` → `redirect("/")`. |
| `updateHabit`  | `(id, prev, formData) → HabitFormState` | id pre-bound; validate → update → revalidate → redirect.           |
| `archiveHabit` | `(id)`                                  | Set `archivedAt = now()`; revalidate `/` and `/habits/archived`.   |
| `restoreHabit` | `(id)`                                  | Clear `archivedAt`; revalidate `/` and `/habits/archived`.         |
| `deleteHabit`  | `(id)`                                  | `$transaction`: delete check-ins, then the habit; revalidate.      |

`createHabit`/`updateHabit` share two helpers: `readForm` (trim FormData fields)
and `toFieldErrors` (map a `ZodError` to a per-field error record). On validation
failure they return `{ errors, values }` instead of writing, and `HabitForm`
renders the errors inline.

**`actions/check-ins.ts`**

| Action          | Signature            | Effect                                                                               |
| --------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `toggleCheckIn` | `(habitId, dateKey)` | Guard date format + reject future dates → delete-if-exists else create → revalidate. |
| `toggleToday`   | `(habitId)`          | Convenience wrapper calling `toggleCheckIn` with today's Asia/Seoul key.             |

The toggle is implemented as **delete-then-create-if-absent**: `deleteMany` runs
first, and if it removed nothing, a check-in is created. Combined with the
`@@unique([habitId, date])` constraint, this makes a check-in an idempotent
on/off switch.

> **Deletion note.** `CheckIn.habitId` already declares `onDelete: Cascade`, so
> `deleteHabit` could rely on the cascade. It instead deletes check-ins and the
> habit together in an explicit `$transaction`, making the two-step cleanup
> atomic and independent of the schema's cascade setting.

---

## The `lib/` layer

Framework-agnostic building blocks. Pages and actions depend on `lib/`; `lib/`
depends on nothing in `app/` or `components/`.

- **`lib/prisma.ts`** — exports a single `PrismaClient` instance. In development
  it is cached on `globalThis` to survive hot-reloads without exhausting
  connections; production gets a fresh client. This is the standard Prisma +
  Next.js singleton.

- **`lib/date.ts`** — **the single home for all date/timezone logic.** Everything
  is anchored to `Asia/Seoul` (the `TIME_ZONE` constant) via
  `Intl.DateTimeFormat`, so "today" is consistent regardless of where the server
  runs. Dates are `YYYY-MM-DD` strings that sort chronologically as plain
  strings. Key functions: `getTodayKey`, `toDateKey`, `dateKey`, `shiftKey`
  (add/subtract days), `currentMonth`, `monthKey`/`parseMonthKey`, `addMonths`,
  `monthLabel`, `daysInMonth`, `weekdayOf`, and `buildMonthGrid` (produces the
  padded 7-column calendar grid consumed by `CalendarMonth`).

- **`lib/streak.ts`** — **pure functions only.** "Today" is always passed in as a
  parameter (never read from the clock), so results are deterministic and unit-
  testable. Exports:
  - `currentStreak(dates, today)` — consecutive run ending at today, or at
    yesterday if today isn't checked in yet (0 otherwise).
  - `longestStreak(dates)` — longest consecutive run overall.
  - `computeStats(dates, today)` — `{ current, longest, total }`.
  - `weeklyCompletionRates(dates, today, habitCount, weeks=8)` — completion
    percentage per 7-day window for the whole app.

  This purity is what makes `scripts/verify-streak.ts` possible (it pins
  `TODAY = "2026-07-02"` and asserts expected streak values).

- **`lib/colors.ts`** — `HABIT_COLORS`, the 8 preset hex swatches, and the derived
  `HabitColor` type. **Single source of truth** for both the picker UI
  (`HabitForm`) and server-side validation (`habit-schema`).

- **`lib/habit-schema.ts`** — the Zod `habitSchema` (name 1–50, description ≤200,
  color ∈ `HABIT_COLORS`) plus the `HabitFormValues` and `HabitFormState`
  (`{ errors?, values? }`) types shared between the actions and `HabitForm`.

---

## Components

Per Rule 1, **components are Server Components by default**; `'use client'` is
used only when interactivity requires it, and each client file states why on the
line below the directive.

| Component               | Dir        | Kind   | Client reason (if any)                                   |
| ----------------------- | ---------- | ------ | -------------------------------------------------------- |
| `TopNav`                | `ui`       | Server | —                                                        |
| `ThemeProvider`         | `ui`       | Client | next-themes needs `localStorage`/`matchMedia` + context. |
| `ThemeToggle`           | `ui`       | Client | Reads/sets theme via `useTheme` + `onClick`.             |
| `HabitCard`             | `features` | Server | — (its buttons are Server-Action `<form>`s).             |
| `CalendarMonth`         | `features` | Server | — (each day is a Server-Action `<form>`).                |
| `WeeklyCompletionChart` | `features` | Server | — (visx renders plain SVG on the server).                |
| `HabitForm`             | `features` | Client | `useActionState` for inline errors + color-picker state. |
| `DeleteHabitButton`     | `features` | Client | `window.confirm` dialog before the delete action.        |

Notable component details:

- **`WeeklyCompletionChart` is a Server Component.** visx is used purely as SVG
  scale/shape helpers (`scaleBand`, `scaleLinear`, `<Bar>`), so the chart renders
  on the server with no client JS and no hydration flash. It is themed with
  Tailwind utility classes and `fill="currentColor"` (no hardcoded hex), uses a
  `viewBox` for responsiveness, and native `<title>` elements for tooltips.

- **`ThemeToggle` uses `useSyncExternalStore`** to detect mount in a
  hydration-safe way: before mount it renders a stable "system" placeholder so
  the server and first client render match, avoiding a hydration mismatch.

- **`HabitForm`** keeps the selected color in `useState` (mirrored into a hidden
  input for submission) and seeds `defaultValue`s from either the returned error
  state or the passed-in `initialValues` (edit mode).

---

## Validation & constraints

Validation is layered, and each rule lives at exactly one layer:

| Rule                            | Enforced where                         | Mechanism                                    |
| ------------------------------- | -------------------------------------- | -------------------------------------------- |
| name 1–50, description ≤200     | Server Action (`actions/habits.ts`)    | Zod `habitSchema` → `HabitFormState.errors`. |
| color ∈ 8 presets               | Server Action + `HabitForm` UI         | Zod `refine` against `HABIT_COLORS`.         |
| check-in date is `YYYY-MM-DD`   | Server Action (`actions/check-ins.ts`) | Regex guard clause (`throw` on mismatch).    |
| no future check-ins             | Server Action (`actions/check-ins.ts`) | `dateKey > getTodayKey()` guard.             |
| one check-in per habit per day  | **Database**                           | `@@unique([habitId, date])`.                 |
| referential integrity on delete | **Database** (+ explicit transaction)  | `onDelete: Cascade` FK + `$transaction`.     |

The client `HabitForm` adds `required`/`maxLength` attributes for immediate UX
feedback, but these are conveniences — the Server Action re-validates every field
and is the authority. String-length limits are deliberately _not_ in the schema
because SQLite ignores them.

---

## Styling & theming

- **Tailwind CSS v4, CSS-first.** There is **no `tailwind.config.js`**. Tailwind
  is pulled in through `app/globals.css` (`@import "tailwindcss";`) and compiled
  by PostCSS via the `@tailwindcss/postcss` plugin (`postcss.config.mjs`).

- **No hardcoded colors (Rule 5).** All UI colors are Tailwind palette tokens
  (`neutral-*`, `blue-*`, `red-*`, …). The one exception is a habit's own
  `color`, which is dynamic data (a hex string from the DB) and is applied via
  inline `style={{ backgroundColor: habit.color }}` — it cannot be a build-time
  Tailwind class. The 8 presets in `lib/colors.ts` are the only hex literals in
  the app.

- **Dark mode** is class-based and driven by next-themes. `globals.css` defines a
  custom variant so `dark:` utilities activate under the `.dark` class:

  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```

  `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`)
  toggles that class on `<html>`; `ThemeToggle` cycles System → Light → Dark. The
  root `<html>` carries `suppressHydrationWarning` because next-themes sets the
  class before React hydrates.

---

## Tooling, scripts & data lifecycle

**npm scripts** (`package.json`):

| Script                    | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `dev` / `build` / `start` | Next.js dev server / production build / serve build.        |
| `lint`                    | ESLint (flat config: next core-web-vitals + TS + Prettier). |
| `format` / `format:check` | Prettier write / check.                                     |
| `verify:streak`           | Run the `lib/streak` assertion harness (`tsx`).             |
| `db:migrate`              | `prisma migrate dev` — create/apply a migration.            |
| `db:seed`                 | `prisma db seed` → `tsx prisma/seed.ts`.                    |
| `db:reset`                | Drop, re-migrate, re-seed.                                  |
| `db:studio`               | Open Prisma Studio.                                         |
| `postinstall`             | `prisma generate` (regenerate the client after install).    |

**Database lifecycle.** Schema lives in `prisma/schema.prisma`; migrations are
plain SQL under `prisma/migrations/` (the initial one creates both tables and the
unique index). `prisma/seed.ts` is idempotent (it clears both tables first) and
inserts 3 sample habits with random check-ins across the last 14 days, using
`lib/date` so seeded dates line up with the app's Asia/Seoul keys. The
`DATABASE_URL` in `.env` (`file:./dev.db`) contains no secrets and is committed
for reproducibility.

**Testing.** There is no test framework. `scripts/verify-streak.ts` is a small
hand-rolled assertion script: it pins `TODAY`, runs `computeStats` over a table
of cases, prints PASS/FAIL per case, and exits non-zero on any failure. It is
possible precisely because `lib/streak` is pure.

**Quality gates** (run per task, per `CLAUDE.md`): `npm run build`,
`npx tsc --noEmit`, and `npm run lint` must each report 0 errors.

---

## Key architectural decisions

A summary of the choices that shape the codebase, and the reasoning behind each:

1. **Server-first, minimal client JS.** Reads happen in Server Components; writes
   happen in Server Actions; interactive `'use client'` islands are the
   exception. This keeps bundles small, avoids client-side data fetching/state,
   and lets core flows (check-in, archive) work without JavaScript.

2. **Server Actions instead of an API layer.** All mutation logic is co-located in
   `actions/`, invoked directly from forms with `.bind(null, ...)` for arguments.
   No REST/RPC endpoints to define, secure, or keep in sync.

3. **Freshness via `force-dynamic` + `revalidatePath`.** Rather than adopt Cache
   Components, the app uses the route-segment caching model: data-backed pages
   render per request, and actions revalidate exactly the paths they affect.

4. **Dates as timezone-anchored strings.** Centralizing all date logic in
   `lib/date` around Asia/Seoul and storing `YYYY-MM-DD` keys makes check-in days
   unambiguous and turns range/month queries into cheap string operations.

5. **Pure domain math in `lib/streak`.** Passing "today" in (never reading the
   clock) keeps streak/completion computations deterministic and testable — which
   is what `verify:streak` exercises.

6. **Single sources of truth.** Habit colors (`lib/colors`) feed both the picker
   and validation; the Zod schema and form-state types (`lib/habit-schema`) are
   shared by the action and the form — so UI and server can't drift.

7. **Validation layered by capability.** DB enforces what it can (uniqueness,
   referential integrity); the action layer enforces what SQLite can't (lengths,
   formats, future-date rules); the client adds non-authoritative UX hints.

8. **Convention-locked structure.** The `app` / `components/{ui,features}` /
   `lib` / `actions` split, PascalCase-vs-kebab-case naming, and mandatory JSDoc
   on exported functions are enforced as project rules (see
   [`CLAUDE.md`](./CLAUDE.md)), keeping the layout predictable as the app grows.
