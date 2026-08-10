# Tractive E2E — Session Handoff (09 Aug 2026)

**Supersedes `SESSION-HANDOFF-2026-08-08.md`.** Branch `dev`, everything **uncommitted**.
Paste §0 into a new chat to resume.

> For an at-a-glance view of **what works / what is not correct / what is next to test**,
> see [`STATUS.md`](STATUS.md). This file is the operational detail: constraints,
> environment traps, and the harness.

---

## 0. Resume prompt — paste this into the new chat

> Read `docs/SESSION-HANDOFF-2026-08-09.md` first and tell me you understand what's going
> on before changing anything.
>
> Context: it's an E2E testing + bug-fixing effort on this Next.js marketplace, driven
> through the real UI with Playwright against the live backend. That file has the
> constraints (§2), the environment traps (§3), what's fixed (§5), what's still open (§6),
> and a "Where to pick up" section (§7). It links to three others:
>   - `docs/STATUS.md` (at-a-glance: what works / what's broken / what's next to test)
>   - `docs/E2E-BUG-REPORT-2026-08-07.md` (every bug + fix + how to re-test it)
>   - `docs/BACKEND-ISSUES-2026-08-07.md` (backend-facing items, for their team)
>
> Then work the §7 list in order. Fix #7 is now **verified** and every role's pages have
> been swept, so the top item is **admin interactions** — suspend / remove a user, approve
> or reject a product payment, agent/transporter approvals, settings/banners. `STATUS.md`
> §3.1 lists exactly what has never had a button pressed. Use exact-text locators on admin
> screens: `has-text("Approve")` also matches the "Approved" tab and silently dismisses the
> confirmation dialog.
>
> Important:
> - Respect the standing constraints in §2 — especially: only touch orders and products
>   created by this testing effort, and the FORBIDDEN Garri order
>   `69c1698467317734c348af91`. Use the guard pattern from `a4-interact.js` (product-scoped)
>   or `b7-receipt-review.js` (order-scoped) for anything that mutates.
> - **Delete `.next` before you start** and never run two dev servers — see §3, this cost
>   a lot of time.
> - Verify with `npx tsc --noEmit`. ESLint is broken (pre-existing config error).
> - You'll need to start the dev server yourself (`npm run dev`).
> - The Playwright harness paths and their gotchas are in §3. Scripts live in a different
>   scratchpad from `lib.js` and must run with cwd set to the older one.
> - Nothing is committed. Don't commit unless I ask.
> - Update the docs as you go, and tell me what you find rather than only what you fixed.
>
> **Seven decisions are open (D1–D7 in `STATUS.md` §4) and each blocks specific work** —
> read that table before planning, and ask me when one of them comes up rather than guessing.
> The ones most likely to block you: **D1** fleet-bid withdrawal (needs a backend route
> first), **D2** reviews per-order vs per-seller, **D4** the dead Chat/Help links, and **D5**
> whether password reset is in scope at all.

---

## 1. What this work is

Automate and test the complete Tractive marketplace flow as a real user, end to end, then
progressively fix what turns up:

```
agent creates products → buyer bids → agent accepts / counters / rejects
  → buyer accepts counter → buyer checks out and "pays" (no gateway yet)
  → admin approves the transaction → agent sees the paid order
  → buyer books a transporter fleet → admin approves the fleet payment (auto-creates a trip)
  → transporter drives New → Picked → On Transit → Delivered
```

Plus: identify and list every error, blockage, missing piece, or thing that should be fixed.

## 2. Standing constraints (carry these forward)

1. **Only act on orders and products created by this testing effort.** Never touch
   pre-existing ones. The Garri order `69c1698467317734c348af91` (₦5,000,000, 23 Mar 2026)
   is on a hard FORBIDDEN list. Route mutating requests through a guard that aborts
   anything outside the allowed set — `b7-receipt-review.js` (orders),
   `a4-interact.js` (products).
2. **Test with newly created products.** Legacy products have inconsistent data.
3. **The signup/OTP bug is deferred** — explicitly out of scope.
4. Payment gateway is **not implemented**; manual bank transfer is the real flow. Do not
   build gateway integration.

## 3. Environment

**Stack:** Next.js 16.2.6 (App Router, turbopack), React 19, next-auth v4 (Credentials +
JWT), TanStack Query v5, Redux Toolkit, axios, Tailwind 4, zod + react-hook-form, sonner,
framer-motion.

**Backend:** `https://tractive-be.vercel.app` — spec at `/docs/openapi.yaml` (5,799 lines;
fetch it, it answers contract questions faster than probing).

| Role | Email | Password |
|---|---|---|
| buyer + agent + transporter (one account, 3 roles) | `i59mv8titr@lnovic.com` | `Testpassword` |
| admin | `ibrahim.saliman.zainab@gmail.com` | `test123` |

**Harness:** Playwright driving **system Google Chrome** (`channel: "chrome"` — bundled
Chromium cannot be downloaded here). Per-role `storageState`. Cloudinary stubbed via
`page.route("**/api.cloudinary.com/**")`.

`lib.js` / `lib2.js` live in
`…\9174500c-2889-4ddf-b1d5-d8a821fcea81\scratchpad\` — that is also where
`node_modules/playwright` is, so **every script must run with cwd set there**:

```
cd  <9174500c…>/scratchpad
node <74643d00…>/scratchpad/<script>.js
```

Scripts from 08–09 Aug live in `…\74643d00-803f-49db-bc9e-754404585446\scratchpad\`:

| Script | What it does |
|---|---|
| `t1`–`t8`, `b1`–`b11b`, `v10*`, `verify*` | trade loop, buyer sweep, earlier fix verifications |
| `v11b.js` | 11b — fleet bid appears with no reload |
| `v11h.js` | 11h — wishlist heart a11y, Tab/Enter/Space, restores net zero |
| `a1-recon.js` | agent recon, all 11 pages; read-only; logs API calls, console errors, 404s per page |
| `a2-list-product.js` | lists a product end to end. Args: `[unitLabel] [name] [unitWeightKg]` |
| `a3-verify-units.js` | asserts every offered unit is accepted by the create API; no doubled "(kg)" |
| `a4-interact.js` | produce-list tabs/search/filters/pagination/action menu. **Product-scoped write guard** |
| `a5-editmodal.js`, `a6-editdiag.js` | Edit modal probes |
| `a7-farmers.js` | farmer onboarding: validation, create, list refresh |
| `a8-image-required.js` | 12h — an image is required to list |
| `a9-leftovers.js` | Edit save, out-of-stock, restock, bulk delete. **Narrowest guard: deletes only the one intended product id** |
| `a10-verify-fixes.js` | 12f/12g — modal close button, avatar fallbacks, placeholder asset |
| `a11-focus-probe.js` | measures modal focus: where focus lands on open, tabs-to-reach, scroll lock. **Reusable for auditing any modal** |
| `tr1-recon.js` | transporter recon, all 11 pages; read-only; per-page API calls, console errors and 404s |
| `tr2-drivers.js` | driver onboarding: validation, create, list refresh, row actions |
| `tr3-trip-fleet.js` / `tr6-addfleet.js` | Create Trip probe + **Add Fleet submit** (tr6 is tr3 with the trip half removed) |
| `tr4-createtrip.js` | attempts a real trip; **aborts unless the booking is for a product this effort created** |
| `tr5-trip-probe.js` | per-fleet booking states — proves the "already on a trip" dead end (13b) |
| `tr7-confirm-fleet.js` | fresh-login confirmation that the new fleet exists (works around 13d) |
| `warm11b.js`, `recon-awaiting.js` | warm protected routes from a logged-in session; dump buyer Awaiting cards |
| `w1-book-fleet.js`, `w2-pay-fleet.js` | buyer books a fleet and completes the manual-transfer payment. **Guard: the payment must name our fleet** |
| `w3-admin-approve.js`, `w4-approve-probe.js`, `w5-approve-modal.js` | admin fleet-payment approval, and the probes that found its two-step dialog. **Guard: only our payment id** |
| `w6-verify7.js` | **fix #7** — walks a trip New → Picked → On Transit → Delivered, asserting the dropdown default at each step. Guard: only our trip, with the pre-existing trip blacklisted |
| `w7-verify-pricing.js` | whole-truck quote (14a) — read-only |
| `w8-admin-recon.js` | admin recon, all 11 screens; read-only |
| `w9-rest-and-focus.js` | admin track-orders children, cross-cutting pages, **and the modal focus audit across 5 modals** |
| `deadlinks.js` *(this session's scratchpad)* | static audit: every internal `href` vs the real app routes — found 15 dead links |

### Known environment limits — read these, they cost hours

- **Delete `.next` at the start of a session.** It re-bloats to ~5.7 GB, and at that size
  Turbopack burns 54–88s per request on *"filesystem cache database compaction"* —
  `/login` never finished compiling (>9 min, then a 500). After
  `Remove-Item -Recurse -Force .next` the same route compiled in **22s** and warm
  navigations were 0.3–2s.
- **Never run two `next dev` processes against this repo.** It corrupts `.next`: every
  route returns an instant 500 rendering the pages-router `_error` fallback, with **no
  error in `.next/dev/logs/next-development.log`**. Recovery = kill the whole tree
  (`npm` → `next` → `start-server`, three node PIDs) and delete `.next`.
- If a server is already on port 3000, reuse it — `lib.js` hardcodes
  `BASE = "http://localhost:3000"`, so a server that fell back to 3001 is invisible.
- **`curl` cannot pre-warm protected routes** — middleware 307s in ~0.2s *before* the page
  compiles. Warm from inside a logged-in Playwright session.
- **A cold route reads as an empty list.** A fixed `waitForTimeout(5000)` after `goto`
  lands before data renders (the Fleet Bids tab reported `[]` while holding three bids).
  Wait on a content locator with a long timeout, not a sleep.
- **The saved `storageState` expires mid-run.** Scripts must `uiLogin` if a Login button
  appears, then `switchRole` — the shared account's active role is often not the one you
  want.
- `api.cloudinary.com` is DNS-blocked → **real image upload cannot be smoke-tested here.**
  Affects receipt upload *and* product images.
- Disposable-mail APIs blocked → signup OTP unobtainable (hence the shared account).
- **`npx tsc --noEmit` is the verification command** (it can take >7 min on a cold cache —
  run it in the background). ESLint cannot run: pre-existing circular-structure config
  error, unrelated to these changes.
- Windows Defender exclusion still **not** in place; needs an elevated shell:
  `Add-MpPreference -ExclusionPath "C:\Users\USER\Documents\Tractive-Fe"`.

### Selector traps

- `button:has-text("Add")` matches the **global header "Add to store"** on every agent
  page and opens the product modal. The farmers page control is `Onboard`
  (`button[aria-label="Onboard farmer"]`).
- The Edit modal takes **9–14s** to render (slow backend detail fetch); a 30s click
  timeout on its Save button will fire before the form exists.
- **On admin screens, `has-text("Approve")` also matches the "Approved" tab.** Clicking it
  navigates away and silently dismisses the confirmation dialog, so the approval appears to
  do nothing. Use `button:text-is(...)` scoped inside `[role="dialog"]`.
- Admin row actions (Approve / Reject) only exist **after clicking the row**, which opens a
  detail modal. They are not in the row itself.
- The fleet-booking flow's forward control on the transfer step is literally
  **"I've made the transfer"** — not Confirm/Submit/Continue.

## 4. Domain model learned the hard way

- One user holds `["buyer","agent","transporter"]`. Switch with
  `PATCH /api/profile/switch-role {activeRole}` — UI `/register-as` → pick → Continue.
- `order.status` = **payment** lifecycle: `pending` → `payment_pending` → `paid`.
- `order.transportStatus` = **delivery** lifecycle: `pending | picked | on_transit | delivered`.
- Frontend maps UI "parked" → API "paid" via `FE_TO_API_STATUS`.
- Payment: `POST /api/orders` → `POST /api/transactions` → admin
  `PATCH /api/admin/transactions/{id}/status` → order `paid` → `readyForTransport`.
- Fleet: buyer books → `POST /api/transporters/fleet/{id}/payments` → admin
  `PATCH /api/admin/fleet-payments/{id}/status` → **auto-creates a fleet trip**.
- `GET /api/transporters/fleet/{id}/payments` is transporter-scoped and works (403s for a
  fleet that is not theirs). No aggregate equivalent.
- Transport prices as `unitWeightKg × quantity`, falling back to treating quantity as
  kilograms — a missing `unitWeightKg` silently under-charges freight.
- **Product `unit` has three disagreeing vocabularies** — see backend item 11. Stored:
  `kg`/`bags`/`100kg_bag`/`packet`. Enforced by create *and* update: `kg`/`tonne`/
  `50kg_bag`/`100kg_bag`. Documented in the spec: `kg`/`ton`/`bag`.

## 5. Testing status

### Fully tested and passing

- **The core trade loop**, end to end through the real UI, three times.
- **The entire buyer surface** — swept 08 Aug, §11 of the bug report.
- **The agent surface** — swept 08–09 Aug, §12 of the bug report. A product has now been
  listed end to end through the UI for the first time, and a farmer onboarded.
- **The transporter surface** — swept 09 Aug, §13. A **driver** and a **fleet** have now
  been created through the UI for the first time. Create Trip is verified as far as the data
  allows (see 13b).

### Everything fixed so far

Full write-ups, each with a **"Page to test"** and its verification output, are in
[`E2E-BUG-REPORT-2026-08-07.md`](E2E-BUG-REPORT-2026-08-07.md).

| # | Fix | Verified |
|---|---|---|
| 2 | Agent "Delivered" tab empty; delivered orders stuck in Packed | ✅ |
| 3 | Orders created but never paid were unreachable — new Pending Payment tab | ✅ |
| 4 | `useConfirmPayment` never sent transfer evidence | ✅ |
| 4b | Receipt image upload (`screenshotUrl`) | ⚠️ wiring only — Cloudinary stubbed |
| 5 | Trip status tabs showed wrong trips | ✅ |
| 7 | Trip status dropdown defaulted from the wrong field | ✅ **VERIFIED 09 Aug** on trip `6a788319714655ab6300d880` |
| 8 | Booking page listed products from every order | ✅ |
| 10a | `useCreateOrder` invalidated nothing | ⚠️ frontend fixed, **backend item 10 outstanding** |
| 10b | Table behind the bidders modal stale after counter/reject | ✅ |
| 10c | Transporter could not see their own fleet payments | ✅ |
| 10d | Unit dropdown missing values; `unitWeightKg` optional | ✅ but see 12a |
| 10e | No fleet capacity/price bounds | ✅ frontend guard only |
| 10f | New agent blocked by an unexplained farmer prerequisite | ✅ |
| 10g | Add-to-store modal discarded a part-filled form on outside click | ✅ 5 cases |
| 11b | Fleet bids list stale after bidding — no invalidation + 3-min `staleTime` | ✅ ₦137,500 visible with no reload |
| 11h | Wishlist heart was a bare `<div onClick>` | ✅ Tab-reachable, Enter + Space, `aria-pressed`, net-zero |
| 11h-2 | Product-detail heart: no accessible name beyond `title`, no `aria-pressed` | ✅ third instance, same pass |
| 12a | Add-to-store offered units the API rejects with a 400 | ✅ picker now offers only accepted units — **backend item 11 outstanding** |
| 12c | Prices labelled `$` on a Naira marketplace | ✅ 3 files |
| 12d | "Weight of one kilogram (kg) **(kg)**" | ✅ all 4 units |
| 12e | Failed create showed two toasts, burying the actionable one | ✅ |
| 12h | A product could be listed with **no image** | ✅ required in step 1 — **backend item 12 outstanding** |
| 12f | Add-to-store modal had **no focus management** — focus stayed outside, 57 tab stops to reach it, no `role="dialog"`, page behind still scrolled | ✅ focus + trap + scroll lock; 57 tabs → 1 |
| 12g | Broken avatars rendered broken **and** `/images/placeholder-avatar.png` — the fallback in 13 places across 9 files — **did not exist** | ✅ asset added + resilient `Avatar` component |
| 11f | ~~Header badge ignores fleet bids~~ | ❌ **withdrawn — not a bug.** The badge counts bids needing a response; fleet bids are already included |
| 13a | **9 referenced image assets did not exist** (~44 references), incl. the 3 role icons on `/register-as` + `/add-role` and `placeholder.png` in 15 files — every image *fallback* in the app was itself broken | ✅ 2 generated, 7 repointed at existing art; audit now clean (103/103) |

## 6. Open bugs

### Backend — blocking

**A. Order totals wrong by a factor of `quantity` (money).** `unitPrice = amount / quantity`
instead of `unitPrice = amount`. `POST /api/orders` **enforces the wrong formula as a
guard**, so computation and guard must change together.

**B. Fleets are never released after delivery.** A whole-truck fleet is bookable exactly
once in its lifetime. Blocks all further transport testing including fix #7.

**Item 10.** `GET /api/buyers/biddings/won/checkout` still returns a bid after
`POST /api/orders` consumed it — the same bid can be ordered repeatedly.

**Item 11 (HIGH).** `POST`/`PATCH`/`PUT /api/products` reject `unit` values the products
table already holds. 7 of 22 products (32%) use `bags`/`packet`, both rejected; `50kg_bag`
and `tonne` are accepted and used by nothing; the spec documents a third set
(`kg`/`ton`/`bag`) with no `enum` at all. Bagged goods cannot be listed. Legacy products
are editable only because the frontend omits `unit` from its update payload.

**Item 12 (MEDIUM).** `POST /api/products` accepts `images: []` — a listing with no
photograph goes live. Frontend now blocks it, but that is a client-side guard only.

Full detail in [`BACKEND-ISSUES-2026-08-07.md`](BACKEND-ISSUES-2026-08-07.md).

### Frontend — open, not fixed

| # | Issue | Severity |
|---|---|---|
| 11a | Buyer cannot withdraw/cancel a fleet bid — no actions on the tab at all. Needs a backend `DELETE` first | Medium — **decision needed** |
| 11d | A seller can be reviewed **once ever, not once per order** | Medium — **decision needed** |
| 12b | Agent Edit Product modal blocks the whole form behind a 9s refetch though it already has the row data. Deliberately not fixed — needs a dirty-field check so a late fetch can't clobber typed input | Medium |
| 11c | Follower count stays 0 after following (button flips, counter does not) | Low |
| 11e | Wishlist shows a product as "Available" with `Quantity: 0` | Low |
| 11g | A confirmed order silently vanishes from Track Orders, no acknowledgement | Low |
| 11i | Delivered tracking shows "Est date: N/A" | Low |
| 13d | **An expired session renders an empty page, not an error.** `POST /api/auth/refresh` always 400s ("Refresh token required") so a stale session can never recover, and the resulting 401 paints "no data" — a 5-row fleet list became 0 rows silently. Cost real debugging time this session | Medium |
| 13c | Create Trip's fleet dropdown shows two identical "North Route Fleet" entries; the table distinguishes them by IOT, the dropdown doesn't | Low |
| 13e | **Three** modals now confirmed with no focus management: Onboard Driver (has `role="dialog"`, focus never enters), Create Trip (no dialog role at all), plus the ones listed below | Low (a11y) |

Two a11y/asset issues worth a follow-up pass, neither blocking:

- **Other modals share 12f's focus problem — now measured, not suspected.** `AddToStore` is
  fixed; **Onboard Driver** and **Create Trip** are confirmed broken (13e). The same pattern
  (a `motion.div` overlay with a `mousedown`-outside handler and no focus management) also
  appears in `EditProductModal`, `BiddersModal`, `CustomerInfoModal`, the various
  `CustomerCareModal`s and `TripDetailsModal`. Worth one pass — `a11-focus-probe.js`
  measures any modal in seconds, and `AddToStore` is the worked example to copy.
- **10 of the 13 `placeholder-avatar.png` references** still use the plain
  `src || fallback` form. They are no longer broken now the asset exists, but migrating
  them to `Avatar` would make them resilient to a 404 too — mostly admin screens, so do it
  when the admin sweep happens.

### Not tested at all yet

- **Agent — nearly done.** Edit save, restock, out-of-stock and bulk delete all pass
  (§12). Left: **customers detail modal** and **reviews replies** (`/agent/reviews` shows
  a "0 replies" control that has never been exercised).
- **Transporter — mostly done (§13).** Drivers, Add Fleet submission and Create Trip are
  covered. Left: **negotiations**, **customers**, **reviews**, **fleet edit**, and driving a
  trip Picked → On Transit → Delivered (needs a live trip — see §7).
- **Admin** — everything except the two approval screens: users, suspend/remove, settings,
  banners, track-orders, refunds, live chats, queries.
- **Cross-cutting** — chat, help/support, notifications, password reset, role-switching
  edge cases.

### Blocked

- **Fix #7 verification** needs one non-terminal trip. **This is now unblocked in
  principle** — the sweep created a fresh fleet, `6a786e7bd9239f0a4de4eb3c`
  ("QA Sweep Fleet 09Aug", 20,000 kg, ₦150, `available`, `currentLoadKg: 0`). Backend B
  makes a whole-truck fleet bookable exactly *once*, and this one has not been used, so it
  is the only bookable fleet in the environment. **Spend it deliberately:**

  ```
  buyer books QA Sweep Fleet 09Aug   (a paid order is needed — one sits in Pending Payment)
    → POST /api/transporters/fleet/6a786e7bd9239f0a4de4eb3c/payments
    → admin PATCH /api/admin/fleet-payments/{id}/status = approved
    → a fleet trip is auto-created
    → transporter: verify #7 (status dropdown must default to the NEXT status, not the
      current one), then drive Picked → On Transit → Delivered
  ```

  Do not waste it on anything else — creating another fleet is cheap, but each new fleet is
  another permanent row in the test data.

- **Manual Create Trip** stays blocked regardless: it needs a *confirmed booking not already
  on a trip*, and bookings are never released either (13b). A new fleet does not help,
  because a new fleet has no bookings.
- **Real Cloudinary upload** — DNS-blocked here. Affects receipt upload *and* product
  images. Needs a smoke test on a networked machine.

## 7. Where to pick up

1. ~~Finish the agent leftovers~~ — **done 09 Aug.** Edit save, out-of-stock, restock and
   bulk delete all verified (`a9-leftovers.js`). Only the customers detail modal and
   reviews replies remain, and they are small.
2. ~~Sweep the transporter surface~~ — **done 09 Aug** (§13). Drivers, Add Fleet and Create
   Trip covered.
3. **Spend the one bookable fleet on verifying fix #7** — see the Blocked note in §6 for the
   exact chain. This is the highest-value remaining item: #7 has been code-complete and
   unverifiable for three sessions, and this is the first chance to close it.
4. **Finish the transporter leftovers** — negotiations, customers, reviews, fleet edit — and
   drive the trip from step 3 through Picked → On Transit → Delivered.
5. **Then admin** (7 untouched screens), then cross-cutting (chat, notifications, password
   reset). When doing admin, migrate its `placeholder-avatar.png` usages to `Avatar`.
6. **One-pass modal focus audit** — three confirmed instances now (§6, 13e). `AddToStore` is
   the worked example; `a11-focus-probe.js` measures each in seconds.
7. Get backend **A, B, 10, 11, 12** in front of the backend team.
8. **Seven decisions (D1–D7)** are open and each blocks specific work — see §8, and
   `STATUS.md` §4 for the full table with recommendations.

## 8. Open questions for the user

**The authoritative list is [`STATUS.md`](STATUS.md) §4**, as a table with what each decision
blocks and a recommendation. Summarised here so this file stands alone:

| # | Decision | Blocks |
|---|---|---|
| D1 | Should a buyer be able to withdraw a fleet bid? (11a) | The Fleet Bids tab has no actions at all. Needs a backend `DELETE` route first |
| D2 | Reviews per-order or per-seller? (11d) | The review button is offered on every delivered order but only the first can succeed |
| D3 | Legacy mispriced orders — migrate, hand-correct, or write off? | The migration for backend A. Cannot be automated blindly |
| D4 | The 14 dead Chat / Help / footer links — build or remove? | Chat and Help 404 for every agent and transporter. Recommend removing now, building later |
| D5 | Is password reset in scope? | It does not exist. With signup's mailer broken and refresh failing, account recovery has no path |
| D6 | Restore the three deleted repo-root `.md` files? | Nothing, but they still show deleted in git |
| D7 | Commit strategy | 94 paths dirty on `dev` across ~25 fixes. Recommend splitting by area |

**Answered 09 Aug:** a product **must** have at least one image — enforced on the frontend
(12h), backend informed (item 12).

## 9. Test data created by these sessions

| Kind | Id / detail |
|---|---|
| Clean-run product | `6a762614bc8b24630d48e129` (`QA CLEAN1 Yellow Maize`) |
| Agent product | `6a7788c8ba0438019d691431` — QA AGENT4 White Maize, **now ₦2,750 × 45 100kg_bag** after the edit test — **first product listed through the UI** |
| Agent product | ~~QA AGENT3 Yellow Sorghum~~ `6a77883466751dac94d2b17d` — **deleted** as the bulk-delete test subject |
| Farmer | QA Sweep Farmer 08Aug, `+2348033344455`, Kano / Fagge |
| Driver | `6a786bf2a047ef91ebdc4ec5` — QA Sweep Driver 09Aug, `+2348055566677`, licence `QA-DRV-99881`, no fleet assigned — **first driver created through the UI** |
| Fleet | `6a786e7bd9239f0a4de4eb3c` — QA Sweep Fleet 09Aug, IOT `IOT-QA-0901`, Kaduna–Lagos, 20,000 kg, ₦150, `available` — **first fleet created through the UI, and the only bookable one left. Spend it on fix #7 (see §6).** |
| Clean-run order | `6a7627100a1730442be69616` — ₦1,680, delivered, receipt confirmed |
| Earlier order | `6a75d7825c88e28a8551fe6c` — ₦2,000 (should be ₦5,100,000) |
| 08 Aug bid | `6a76dc3ea6133da574ba92d9` — countered ₦1,100, accepted |
| 08 Aug order | `6a76df00…` / `#F3E6087D` — ₦1,050, **unpaid**, in Pending Payment |
| Fleet bids | ₦120,000 and ₦137,500 on North Route Fleet `69a67ace96f7df1573952158`, both pending — **cannot be withdrawn, see 11a** |
| Clean-run trip | `6a763121255839d6602fac52` (delivered) |
| Fleet payments | `6a75e7b5b9a3d4c579fe2ada`, plus one at ₦4,000,000 |
| Pre-existing trip advanced | `69ff4a66099795cd39d47d12` — was `loaded`, now `delivered` |

Reverted to net zero: two wishlist add/removes, one follow/unfollow of seller
`696f6c0a719a3fcdb97c3e16`. The only order ever mutated by this effort is
`6a7627100a1730442be69616` (confirm-receipt), through the guard.

## 10. Verification command

```
npx tsc --noEmit
```

Clean as of the end of this session. ESLint is unusable (pre-existing config error).
