# Tractive E2E — Session Handoff (10 Aug 2026)

**Supersedes `SESSION-HANDOFF-2026-08-09.md`.** Branch `dev`. **Everything is now
committed** — 15 commits, working tree clean apart from three deleted repo-root `.md`
files held back pending **D6**.

> For **what works / what is not correct / what is next**, see [`STATUS.md`](STATUS.md).
> This file is the operational detail: constraints, environment traps, and the harness.

---

## 0. Resume prompt — paste this into the new chat

> Read `docs/SESSION-HANDOFF-2026-08-10.md` first and tell me you understand what's going
> on before changing anything.
>
> Context: an E2E testing + bug-fixing effort on this Next.js marketplace, driven through
> the real UI with Playwright against the live backend. That file has the constraints (§2),
> the environment traps (§3), and "where to pick up" (§6). It links to:
>   - `docs/STATUS.md` (at-a-glance: what works / what's broken / what's next to test)
>   - `docs/E2E-BUG-REPORT-2026-08-07.md` (every bug + fix + how to re-test it, §1–18)
>   - `docs/BACKEND-ISSUES-2026-08-07.md` (backend-facing items 1–15)
>
> **The top item is mobile/responsive**, and not on a hunch: four of the ~30 bugs found so
> far live only in `*Mobile*` files, and every session to date ran at 1600×1400 desktop.
> Then notifications, which have never been opened despite the SSE stream being live on
> every page load.
>
> Important:
> - Respect §2 — especially: only touch orders and products created by this effort, and
>   the FORBIDDEN Garri order `69c1698467317734c348af91`. Use an id-allowlist route guard
>   for anything that mutates; `x5-user-lifecycle.js` is the cleanest example.
> - **Delete `.next` before you start** and never run two dev servers — see §3.
> - **`find src/app -name page.tsx` before adding any route.** There are four route groups
>   and a collision 500s every route in the app, `/login` included (§3).
> - Verify with `npx tsc --noEmit`. ESLint is broken (pre-existing config error).
> - Never assert on a fixed sleep. A first-hit route compile here can exceed 10 seconds,
>   and a 4s wait produced a bug report that had to be withdrawn (§17a).
> - Don't commit unless I ask.
> - Update the docs as you go, and tell me what you find rather than only what you fixed.
>
> **Six decisions are open (D1, D2, D3, D5, D6, D8 in `STATUS.md` §4).** D8 blocks the last
> admin item. Ask rather than guess.

---

## 1. What changed on 10 Aug

- **Everything got committed** (D7), split by area into 15 reviewable commits.
- **Admin §3.1 is done** bar one blocked item — see §4.
- **The order money path is verified in both directions** on one transaction: approve
  `+₦1,300`, refund `−₦1,300`, dashboard back to where it started.
- **Chat and Help pages built** for agent and transporter (D4).
- **Dead links: 15 → 1.** Most were never missing pages; the links pointed at the wrong
  paths (§18).
- **Two fixes, one withdrawal:** row actions now confirm (15d); admin tab counts fixed
  (15e); **15f withdrawn as not a bug**.

## 2. Standing constraints (carry these forward)

1. **Only act on orders and products created by this testing effort.** The Garri order
   `69c1698467317734c348af91` (₦5,000,000) is on a hard FORBIDDEN list. Route mutating
   requests through an id allowlist that aborts anything else.
2. **Never suspend or reject the shared test account.** It is the only way into the app.
   For destructive user testing use `qa.flow.probe.8821@example.invalid` — `.invalid` is
   RFC 2606 reserved, so it can never be a real person.
3. **Test with newly created products.** Legacy products have inconsistent data.
4. **The signup/OTP bug is deferred** — explicitly out of scope.
5. Payment gateway is **not implemented**; manual bank transfer is the real flow.

## 3. Environment — the traps that cost time

**Stack:** Next.js 16.2.6 (App Router, turbopack), React 19, next-auth v4, TanStack Query
v5, Redux Toolkit, axios, Tailwind 4, zod + react-hook-form, sonner, framer-motion.

**Backend:** `https://tractive-be.vercel.app` — spec at `/docs/openapi.yaml`.

| Role | Email | Password |
|---|---|---|
| buyer + agent + transporter (one account) | `i59mv8titr@lnovic.com` | `Testpassword` |
| admin | `ibrahim.saliman.zainab@gmail.com` | `test123` |

### Read these before you start

- **Delete `.next`.** It re-bloats to ~5.7 GB and Turbopack then burns 30–90s per request
  on cache compaction.
- **Never run two `next dev` processes.** One was found still running from **two days
  earlier**, holding port 3000. Check with
  `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*Tractive-Fe*' }`.
- **A blanket 500 on every route may be a route collision, not a corrupted cache.** Adding
  `(main)/report` next to the existing `(Marketing)/report` 500'd the entire app including
  `/login`, with the real cause only visible in the dev log:
  *"You cannot have two parallel pages that resolve to the same path."*
  **There are four route groups — `(main)`, `(auth)`, `(Marketing)`, `(profiles)` — plus
  `account/`. Enumerate them before adding a route.**
- **Never assert on a fixed sleep.** A first-hit route compile can exceed **10 seconds**.
  A 4-second wait produced finding 15f, which had to be withdrawn. Wait on a content
  locator, or watch `framenavigated`.
- **The saved `storageState` expires between sessions**, and a stale one renders every
  screen as logged-out rather than erroring (bug 13d). Log in fresh
  (`newContext(browser, role, { fresh: true })`) and abort if still on `/login`.
- **Piping a long Playwright run through `grep`/`tail` buffers everything until exit.**
  Write to a file from inside the script instead.
- `api.cloudinary.com` is DNS-blocked → real image upload untested (products, receipts,
  **banners**). `stubCloudinary(page)` works around it.
- **`npx tsc --noEmit` is the verification command.** ESLint cannot run.

### Selector traps

- On admin screens `has-text("Approve")` also matches the **"Approved" tab** — it navigates
  away and silently dismisses the confirm dialog. Use `button:text-is()` scoped to the
  overlay.
- The admin transaction modal has **no `role="dialog"`** — scope to `.fixed.inset-0`.
- It also **does not close on Escape**; reload between rows instead.
- `a:has-text("Help")` matches the footer's *"Help center"*. Scope to `aside`.
- The user action-menu item is **"Remove"**, not "Removed"; the menu button is
  `button[aria-label="Open action menu"]`.
- `button:has-text("Add")` matches the global header "Add to store" on every agent page.

## 4. The harness

`lib.js` / `lib2.js` live in `…\9174500c-2889-4ddf-b1d5-d8a821fcea81\scratchpad\`, which is
also where `node_modules/playwright` is, so **every script must run with cwd set there**:

```
cd  <9174500c…>/scratchpad
node <other-scratchpad>/<script>.js
```

Scripts require lib by absolute path (`require(`${H}/lib.js`)`), not `./lib`.

10 Aug scripts (`…\6947e6d4-33a0-4d7a-8b14-974f8e566e09\scratchpad\`):

| Script | What it does |
|---|---|
| `x1-admin-recon.js` | all 10 admin screens, read-only, **aborts every non-GET** |
| `x2-admin-modals.js` | row detail modals; measures dialog role + Escape |
| `x3-payloads.js` | raw payload shapes (how 15e was pinned down) |
| `x4-txn-approve-reject.js` | product payment approve + reject. **Id allowlist** |
| `x5-user-lifecycle.js` | suspend → reactivate → remove → restore. **Cleanest guard: resolves the target id from the API, refuses the shared/admin accounts, re-runnable, net zero** |
| `x6-spec-check.js` | probes 29 endpoints against the spec with a lifted admin token |
| `x7-dashboard-numbers.js` | dashboard vs two API sources vs the transaction sum |
| `x8-support-shapes.js`, `x9`, `x10-chat-400.js` | chat/help payloads; proved backend 15 |
| `x11`, `x12` | verify the new Chat/Help routes as both roles |
| `y1`, `y2-eventpath.js`, `y3`, `y5` | the 15f investigation (event-path instrumentation) |
| `y4-verify-and-sweep.js` | verifies 15d/15f, banners form, track-orders |
| `y6-final-sweep.js` | track-orders row actions, banners CRUD, **the refund** |
| `y8-links.js` | lean dead-link re-audit, writes straight to a file |

**Token trick:** the app opens `/api/notifications/stream?token=…` on every page load. Lift
that JWT from the request URL to call the backend directly (`x6`, `x7`).

## 5. Test data — current state

| Kind | Id / detail | State |
|---|---|---|
| Transaction | `6a7641ae2b8e56022e704c00` — QA CLEAN1, ₦1,300 | approved → **refunded** |
| Transaction | `6a763b37f1031c35596c3cdc` — Sweet Potatoes, ₦680 | **rejected** (shows as *Failed*) |
| User | `6a7493b8e0c1e1c4e3e11d7c` — QA Flow Probe `.invalid` | **Active, net zero** |
| Support ticket | `6a7956050a2280f3467d2b58` — "QA sweep — Help page smoke test" | **stuck open** — closing it is backend 15 |
| Banner | QA Sweep Banner 10Aug | created then deleted, **net zero** |

**No pending product payments remain** (`approved 18, rejected 1, refunded 1`). Testing
another approval needs a fresh order paid through the buyer UI first.

## 6. Where to pick up

1. **Mobile / responsive — the highest-value item on the list.** Four of ~30 bugs so far
   live only in `*Mobile*` files, and the surface has never been opened. Run the existing
   recon scripts at 390×844 and 768×1024; `lib.js` sets the viewport in `newContext`.
2. **Notifications** — `GET /api/notifications` and the SSE stream 200 on every page load,
   but the UI has never been opened and no notification has been read or actioned.
3. **Buyer leftovers (§3.2)** — responding to a countered fleet bid, `FleetBidPaymentModal`
   (a whole untested payment path), multi-order checkout, `MakeBid` validation.
4. **Agent and transporter leftovers (§3.3, §3.4)** — customers modal, reviews replies,
   farmer edit/delete, transporter negotiations, fleet edit, driver edit/remove.
5. **The a11y modal pass (§3.6)** — now seven modals, and 17f is the worst: no dialog role
   and no buttons at all. One line each.
6. **Login edge cases, error boundaries, deliberate role-switch probing.**
7. Get backend **A, B, 10, 11, 12, 15** in front of the backend team.

## 7. Open decisions

**D1** fleet-bid withdrawal · **D2** reviews per-order vs per-seller · **D3** legacy
mispriced orders · **D5** is password reset in scope · **D6** restore the three deleted
`.md` files · **D8** the shared account's own agent application on `/admin/new`.

Full table with what each blocks: [`STATUS.md`](STATUS.md) §4.
**Answered:** product image required · **D4** build Chat/Help · **D7** commit by area.

## 8. Verification

```
npx tsc --noEmit
```

Clean as of the end of this session.
