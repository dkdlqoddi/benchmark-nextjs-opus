# HabitLog — Security & Quality Audit

_Senior-review pass over the whole codebase (Next.js 16 App Router, TypeScript
strict, Prisma 6/SQLite, Auth.js v5). Date: 2026-07-02._

Findings are grouped by the requested checklist and ranked **Critical / High /
Medium / Low**. Each says whether it was **fixed in this pass** (Critical + High
were in scope to fix) or **documented** for follow-up.

## Summary

| ID | Area | Severity | Status |
|----|------|----------|--------|
| H1 | Accessibility — color contrast | **High** | ✅ Fixed |
| H2 | Data integrity — check-in race | **High** | ✅ Fixed |
| M1 | Security — no auth rate limiting | Medium | Documented |
| M2 | Security — account enumeration | Medium | Documented |
| M3 | Data integrity — other P2002 races | Medium | Documented |
| L1 | Data integrity — weak date validation | Low | ✅ Fixed (adjacent to H2) |
| L2 | Performance — minor over-fetching | Low | Documented |
| L3 | Data integrity — orphaned tags | Low | Documented |
| L4 | Security — committed AUTH_SECRET | Low | Documented (intentional) |
| L5 | Accessibility — picker grouping semantics | Low | Documented |

**No Critical issues were found.** The app has genuinely solid foundations
(see _What's already done well_ at the end); the two High issues are a
real-world accessibility failure and a concurrency bug on the core action.

---

## 1. Security

### M1 — No rate limiting on authentication _(Medium, documented)_

`actions/auth.ts` (`loginAction`, `signupAction`) and the Credentials
`authorize` (`lib/auth.ts`) have no throttling. An attacker can brute-force
passwords or enumerate/spam signups at network speed. bcrypt(cost 10) slows each
attempt but is not a substitute for rate limiting.

**Recommendation:** add per-IP + per-account rate limiting (e.g. a small
sliding-window counter in a shared store) in front of `authorize`/`signupAction`;
consider a lockout/backoff after N failures. Not fixed here because it needs a
shared store/infra decision beyond a code-only change.

### M2 — Account enumeration _(Medium, documented)_

Two vectors let an attacker learn whether an email is registered:

- `signupAction` returns `"An account with that email already exists."`
  (`actions/auth.ts:77`).
- `authorize` returns `null` immediately for an unknown email but runs a bcrypt
  compare for a known one (`lib/auth.ts:32-34`), a measurable timing oracle.

**Recommendation:** for signup, either accept-and-email or return a generic
"check your inbox" message; for login, run a dummy bcrypt compare on the
unknown-email path to equalize timing. Left as-is because it is a common
usability/▲security trade-off and the impact is disclosure-only — flag for a
product decision.

### L4 — `AUTH_SECRET` committed to the repo _(Low, documented — intentional)_

`.env` (containing `AUTH_SECRET`) is tracked; `.gitignore` explicitly opts it in
(`!.env`) and both files document it as a **local-development-only** value for
reproducibility. Anyone with this secret can forge a session JWT for any user,
so it must be rotated and kept out of version control for any real deployment.
**Not changed** — this is a deliberate, documented convention for this benchmark
repo; overriding it would fight the stated intent. Called out so it is never
carried into production.

### Not vulnerable (verified)

- **Auth bypass / IDOR:** every page and Server Action calls `requireUserId()`,
  and every habit/check-in mutation calls `assertHabitOwner()`; all reads are
  `where: { userId }`-scoped. `proxy.ts` is an optimistic gate and the data
  layer re-checks (correct — Server Actions can bypass the proxy). Proven by
  `tests/e2e/data-isolation.spec.ts`.
- **Injection:** all queries go through Prisma (parameterized); no raw SQL. User
  input (`?q=`, `?tag=`) is used only in parameterized `contains`/`some`.
- **XSS:** React auto-escapes; no `dangerouslySetInnerHTML`.
- **Mass assignment:** create/update pass explicit fields; `userId` comes from
  the session, never the form.
- **Input validation:** habit + auth forms are validated with zod in the action
  layer (name/description length, preset color, target-days range, tag count/
  length), matching the model constraints SQLite can't enforce.

---

## 2. Data Integrity

### H2 — Non-atomic check-in toggle can crash under concurrency _(High, ✅ fixed)_

`toggleCheckIn` (`actions/check-ins.ts`) did `deleteMany(...)` then, if nothing
was deleted, `create(...)`. This read-modify-write is not atomic. On a
**double-click or double-submit of the check-in button** — the app's most
frequent action, and one that is _not_ disabled/debounced (`HabitCard`) — two
requests can both delete-nothing and both create, so the second `create` trips
the `@@unique([habitId, date])` constraint and throws an **unhandled `P2002`
→ 500**.

The unique constraint means no _duplicate row_ is ever written (good — no data
corruption), but the user still sees a server error on a normal interaction.

**Fix:** wrap the `create` in a `try/catch` that treats a `P2002` collision as
success (the desired end state — "checked in" — already holds) and rethrows
anything else. Other errors and framework control-flow are unaffected (no
`redirect` inside the guarded block).

_Optional hardening not done:_ also disabling the button while pending would
reduce double-submits, but that would convert the server-rendered `HabitCard`
into a client component; the server-side idempotency fix is sufficient.

### L1 — Check-in accepted impossible dates _(Low, ✅ fixed, adjacent to H2)_

The date guard was a shape-only regex (`/^\d{4}-\d{2}-\d{2}$/`), so a
hand-crafted request could store nonsense like `2026-13-40` or `2026-02-29`
(non-leap). Replaced with a new `isValidDateKey()` (`lib/date.ts`) that requires
the parsed parts to round-trip through a real `Date`. Only reachable by crafting
a POST (the UI never sends bad keys), hence Low — fixed because it sits in the
same guard I was already touching.

### M3 — Other unique-constraint writes can throw under concurrency _(Medium, documented)_

Same class as H2, lower frequency:

- `signupAction` (`actions/auth.ts`) checks `findUnique` then `user.create`; two
  concurrent signups with the same email → second throws `P2002` on
  `User.email` instead of the friendly "already exists" message.
- `resolveTagIds` (`actions/habits.ts`) `upsert`s tags concurrently
  (`Promise.all`); racing inserts of a new tag name can `P2002` on
  `@@unique([userId, name])`.

**Recommendation:** apply the same catch-P2002 pattern (for signup, map it to the
existing "already exists" state). Left documented to keep this pass scoped to the
High fix; impact is a rare transient error, not data loss.

### Not an issue (verified)

- **Duplicate check-ins:** prevented at the schema level by
  `@@unique([habitId, date])`.
- **Cascade deletes:** `User→Habit`, `Habit→CheckIn`, `User→Tag` all use
  `onDelete: Cascade`, and the implicit `Habit↔Tag` join is cleaned up by Prisma.
  `deleteHabit`'s explicit `deleteMany` + `$transaction` is redundant with the
  cascade but harmless (defensive).
- **Transactions:** the one multi-write that needs atomicity (`deleteHabit`) uses
  `$transaction`.

### L3 — Orphaned tags accumulate _(Low, documented)_

Editing/archiving/deleting habits can leave `Tag` rows attached to no habit. They
are hidden from the home filter (`habits: { some: { archivedAt: null } }`), so
this is cosmetic DB growth, not a correctness bug. Could be swept up when a
habit's tags change. Not fixed.

---

## 3. Performance

### L2 — Minor over-fetching _(Low, documented)_

`/stats` and `/habits/archived` (`app/stats/page.tsx`, `app/habits/archived/
page.tsx`) `findMany` without a `select`, pulling every `Habit` column though the
views use only a few. Rows are few (per-user habits), so the impact is
negligible; adding `select` would tighten it. Not fixed.

### Not an issue (verified)

- **No N+1:** the home page and `/stats` batch check-ins with a single
  `where: { habitId: { in: [...] } }` query, not one query per habit.
- **Client components are all justified:** `HabitForm`, `AuthForm`,
  `DeleteHabitButton` (confirm dialog), `ThemeToggle`/`ThemeProvider`
  (next-themes) each need the browser. `WeeklyCompletionChart` is a **Server
  Component** rendering static SVG via visx — no client JS shipped for it.
- **`force-dynamic`** is correctly set on user-data pages so cached HTML is never
  served across users.

---

## 4. Accessibility

### H1 — White text over habit colors fails contrast _(High, ✅ fixed)_

The checked-in button (`HabitCard`) and checked calendar day (`CalendarMonth`)
rendered **`text-white` on the habit's own color**. Measured WCAG contrast of
white on the 8 presets:

| Preset | White-on-color | AA (4.5:1)? |
|--------|----------------|-------------|
| `#eab308` yellow | ~1.6:1 | ✗ (severe) |
| `#22c55e` green | ~2.0:1 | ✗ (severe) |
| `#14b8a6` teal | ~2.3:1 | ✗ |
| `#f97316` orange | ~2.3:1 | ✗ |
| `#ec4899` pink | ~3.0:1 | ✗ |
| `#3b82f6` blue | ~3.3:1 | ✗ |
| `#ef4444` red | ~3.4:1 | ✗ |
| `#8b5cf6` violet | ~3.9:1 | ✗ |

**Every preset fails AA for the button label**, and yellow/green are close to
illegible. This is a core interactive control, so it's High.

**Fix:** new `readableOnColorClass(hex)` (`lib/colors.ts`) computes the color's
WCAG relative luminance and returns the higher-contrast Tailwind token
(`text-black` / `text-white`). For all 8 presets it selects near-black, lifting
contrast to **≥ 4.96:1** (AA). This respects Project Rule 5 — the text color is a
Tailwind token; only the background stays inline, which is the allowed
"habit's own dynamic color" exception. Guarded by
`tests/unit/colors.test.ts`, which asserts AA for every preset with an
independent contrast oracle.

### L5 — Picker grouping semantics _(Low, documented)_

In `HabitForm`, the Color and Target-days button groups are labelled with a
`<span>` rather than `<fieldset><legend>`. Each button already has an
`aria-label` + `aria-pressed`, so the control is fully keyboard-operable and
screen-reader-usable; wrapping each group in a fieldset/legend would improve
group semantics. Not fixed (cosmetic-a11y nit).

### Not an issue (verified)

- **Labels:** all text inputs use `<label htmlFor>`; the search box and
  icon-only theme toggle use `aria-label` + `sr-only` text.
- **Keyboard:** every interactive element is a real `<button>`/`<a>`; future
  calendar days are non-interactive `<div aria-disabled>`.
- **State:** toggles expose `aria-pressed`; the tag filter uses `aria-current`;
  the chart is `role="img"` with an `aria-label` and per-bar `<title>`.

---

## What's already done well

- Defense-in-depth authorization: proxy gate **plus** `requireUserId` +
  `assertHabitOwner` in every action and page, all reads `userId`-scoped.
- Correct schema constraints: `@@unique([habitId, date])`,
  `@@unique([userId, name])`, cascade deletes on every relation.
- Clean Server/Client boundary; SSR chart; centralized timezone/date logic;
  pure, well-tested streak math; zod validation mirroring the data model.
- A meaningful existing test suite (unit + Playwright E2E incl. cross-user data
  isolation).

## Fixes applied in this pass

- `lib/colors.ts` — `readableOnColorClass()` (+ private `relativeLuminance`).
- `components/features/HabitCard.tsx`, `components/features/CalendarMonth.tsx` —
  use it for on-color text (H1).
- `actions/check-ins.ts` — idempotent, P2002-safe check-in create (H2);
  `isValidDateKey` guard (L1).
- `lib/date.ts` — `isValidDateKey()`.
- `tests/unit/date.test.ts`, `tests/unit/colors.test.ts` — regression tests.
