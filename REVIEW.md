# HabitLog — Critical Review: the 3 weakest / most regrettable parts

_A deliberately critical pass. The project is well-built overall (per-user
scoping, Server Components by default, clean lib layer, real tests). This document
picks the three parts I'd most want to undo, with evidence and a concrete plan for
each. No code was changed._

Ordered by a blend of severity and "how much you'd regret shipping it":

1. A single hardcoded timezone (`Asia/Seoul`) defines "today" for every user.
2. `AUTH_SECRET` (the session-signing key) is committed to a public repo.
3. The security-critical Server Action layer has no direct tests.

---

## 1. "Today" is hardcoded to Asia/Seoul for every user

**Where:** `lib/date.ts` — `export const TIME_ZONE = "Asia/Seoul";` (line 8). Every
notion of the current day flows from `getTodayKey()`, which is consumed by
`actions/check-ins.ts` (`toggleToday` dates a check-in to the Seoul day),
`app/page.tsx`, `app/habits/[id]/page.tsx`, `app/stats/page.tsx`, and — transitively
— all streak math in `lib/streak.ts`.

**Why it's weak / regrettable.** For a habit tracker, "did I do it _today_?" is the
entire product. Fixing the day boundary to one arbitrary timezone means the day
rolls over at 15:00 UTC **for everyone on earth**. A user in New York who checks in
at 8:00 PM has it recorded as _tomorrow_; their streak silently breaks even though
they did the habit every day. The zone isn't even the server's or UTC — it's
hardcoded to Korea, which reads like a developer's local default that was never
generalized.

What makes this the _most regrettable_ item rather than just a bug: the team already
hit it and chose to enshrine it. `bench-reports/p14.md` records a real user report
("an 11:55 PM check-in was recorded under the next day's date"), and the response
was to add regression tests that **pin the wrong behavior as correct** — from
`tests/unit/date.test.ts`:

> "a viewer west of Seoul can see it land on the next Seoul day — **by design (single
> fixed zone), not a bug**."

A wrong design decision was converted into a specification and locked down with
tests, which makes it both more entrenched and more expensive to reverse later.

**Improvement plan.**

1. **Make the day boundary user-relative.** Add `User.timeZone` (an IANA string,
   e.g. `America/New_York`) to the Prisma schema, defaulting to `UTC`. Capture the
   browser's zone at signup (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and
   expose a Settings control to change it (the Settings page is a placeholder today,
   so this also gives it a first real job).
2. **Parameterize `lib/date`.** Change `getTodayKey`, `toDateKey`, `currentMonth`,
   etc. to take a `timeZone` argument instead of reading the module constant. Keep
   the pure, testable shape.
3. **Thread the user's zone through the call sites.** `requireUserId()` already loads
   the session; return (or separately fetch) the user's `timeZone` and pass it into
   the check-in actions and the Home/Detail/Stats pages.
4. **Fix the tests.** Rewrite the p14 regression cases to assert _user-local_
   behavior (parameterized by zone) rather than pinning Seoul — the test should
   encode "a check-in is dated to the user's local day," which is the correct spec.
5. **Handle history.** Existing `CheckIn.date` strings were written in Seoul time.
   Document that reinterpreting them under a new zone shifts some historical dates;
   either accept a one-time discontinuity or run a backfill keyed on each user's new
   zone. Ship behind the schema migration so it's a clean cutover.

Interim (if a schema change is too big right now): read the viewer's timezone on the
client and pass it into `toggleCheckIn`, so at minimum _new_ check-ins land on the
user's local day.

---

## 2. `AUTH_SECRET` is committed to a public repository

**Where:** `.env` is git-tracked — `.gitignore` ignores `.env*` (line 38) then
re-includes it with `!.env` (line 52) — and it contains `AUTH_SECRET`, the key
Auth.js (NextAuth v5) uses to sign/encrypt the JWT session cookies. `origin` is
`https://github.com/dkdlqoddi/benchmark-nextjs-opus.git`.

**Why it's weak / regrettable.** `AUTH_SECRET` is the root of the entire auth model.
Anyone who has it can **mint a valid session token for any `userId`** and log in as
any user — which defeats the per-user data isolation that is the app's headline
feature (and the thing `tests/e2e/data-isolation.spec.ts` exists to protect). The
secret is now in the git history of a public repo **permanently**; deleting the file
later does not un-leak it. The project is exactly one `next start` in a real
environment (with this `.env` present) away from a total authentication bypass.

It's "regrettable" specifically because it's a _deliberate, documented convention_ —
the repo commits `.env` "for reproducibility" — that trades the whole security model
for a small amount of setup convenience, and normalizes committing secrets. There is
a standard way to get the same reproducibility without the landmine.

**Improvement plan.**

1. **Rotate immediately.** The committed secret must be treated as burned. Generate a
   fresh one (`openssl rand -base64 33`) and supply it only via real environment
   variables per deployment. Rotation (not deletion) is the actual remediation, since
   history can't be unpublished casually.
2. **Stop tracking secrets.** `git rm --cached .env`, remove the `!.env` rule, and let
   `.env*` stay ignored. Existing local files keep working; only version control
   changes.
3. **Preserve reproducibility the right way.** Commit a `.env.example` with
   _placeholder_ values and non-secret config (`DATABASE_URL="file:./dev.db"`), and
   document in the README how to generate `AUTH_SECRET`. Contributors copy it to
   `.env`; nobody shares a real key.
4. **Fail fast.** Add a boot-time check that refuses to start if `AUTH_SECRET` is
   missing or matches the old/committed value, so a stale secret can't silently ship.
5. **(If treated as a real product)** Purge the secret from history with
   `git filter-repo`/BFG and force-push, and invalidate outstanding sessions.

---

## 3. The Server Action / authorization layer has no direct tests

**Where:** `actions/habits.ts`, `actions/check-ins.ts`, `actions/auth.ts`, and the
guards in `lib/auth.ts` (`requireUserId`, `assertHabitOwner`, `requireHabitOwner`).
The test suite is 5 unit files — `date`, `streak`, `target-days`(via schemas),
`schemas`, `colors`, `habit-form` — **all pure library functions** — plus exactly
**two** Playwright tests. Verified: **no test file imports anything from `actions/`.**

**Why it's weak / regrettable.** The app's single most important property is that one
user can never read or mutate another's data, and that property lives almost entirely
in the Server Actions (ownership checks) and page-level `where: { userId }` scoping.
That is precisely the code with **zero direct coverage**. The tests instead exhaustively
cover the _pure, low-risk_ streak/date math (dozens of cases) — code that can't leak
data — while the risky authorization and mutation logic is exercised only incidentally
by two end-to-end flows.

The one data-isolation E2E test is valuable but narrow: it checks "a second user
navigating to another's habit URL gets a 404." It does **not** cover the mutation
matrix — can a non-owner `updateHabit`/`archiveHabit`/`deleteHabit`/`toggleCheckIn`
someone else's record by calling the action directly? — nor the fixes made in p18
(the H2 concurrent-toggle `P2002` swallow, the L1 invalid-date rejection, the
validate-before-ownership ordering), nor cascade-delete of check-ins, nor per-user
tag scoping. A refactor like p16 ("extract shared helpers from server actions") could
silently drop an `assertHabitOwner` call and the whole suite would stay green — the
exact regression the tests should catch. This is a regrettable _investment mismatch_:
effort went where testing was easy, not where it mattered most.

**Improvement plan.**

1. **Add an integration test project for `actions/`.** The E2E harness already
   provisions a throwaway `prisma/test.db` via `migrate deploy`
   (`tests/e2e/global-setup.ts`); reuse that pattern in a second Vitest project
   (its own config with DB setup/teardown and seeding two users, A and B). Mock the
   session boundary (`auth()`/`requireUserId`) to impersonate A or B.
2. **Test the authorization matrix.** For every mutation, assert: (a) the owner
   succeeds; (b) a non-owner is rejected and **nothing changes**; (c) an
   unauthenticated caller is redirected. Assert cross-user reads return empty.
3. **Lock in the p18 fixes as regressions.** Concurrent `toggleCheckIn` converges to
   "checked in" without throwing (H2); impossible dates are rejected (L1); invalid
   form input returns field errors without leaking a non-owned habit; `deleteHabit`
   removes the habit's check-ins (cascade); tag upsert stays per-user and dedupes.
4. **Rebalance, don't inflate.** The goal isn't a coverage number — it's a test per
   security-relevant branch in `actions/` + `lib/auth.ts`. The DB harness already
   exists, so the marginal cost is low and the payoff (guarding the core invariant
   against future refactors) is high.
5. **CI gate.** Run unit + the new integration project + E2E on every change so a
   dropped ownership check fails the build.

---

## Also considered (did not make the top 3)

- **Global `export const dynamic = "force-dynamic"` on every data page** alongside
  `revalidatePath` calls — the two are partly contradictory (force-dynamic disables
  the cache that `revalidatePath` invalidates). Defensible for always-fresh personal
  data, so more "incoherent" than "regrettable."
- **SQLite under multi-user auth** — single-writer contention is a real ceiling, but
  Prisma makes the swap to Postgres a config change, so it's low-regret.
- **Data-model invariants enforced only in the action layer** (SQLite can't; see
  `actions/habits.ts` + zod) — any non-action write path could store invalid data;
  worth a `CHECK`/app-guard review but narrower than the three above.
- **The Settings page is a shipped "coming soon" placeholder** in the top nav — a
  polish issue, and it becomes the natural home for the timezone fix in #1.
