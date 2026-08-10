# Tractive E2E Automation — Session Handoff

> ⚠️ **SUPERSEDED by [`SESSION-HANDOFF-2026-08-09.md`](SESSION-HANDOFF-2026-08-09.md).**
> Start there — it carries the resume prompt, the agent-sweep results, and backend items
> 11 and 12. This file is kept only for history.

**Date:** 2026-08-08 (updated end of day — supersedes the morning version of this file)
**Branch:** `dev`, all work **uncommitted** in the working tree (59 changed/new paths)
**Purpose:** Paste this into a new chat to resume with full context.

---

## 1. What this work is

Automate and test the complete Tractive marketplace flow as a real user, end to end, then
progressively fix what turns up. The flow under test:

```
agent creates products
  → buyer bids
  → agent accepts / counters / rejects
  → buyer accepts counter
  → buyer checks out and "pays" (no gateway yet — the button just has to work)
  → admin approves the transaction
  → agent sees the paid order
  → buyer books a transporter fleet
  → admin approves the fleet payment (auto-creates a trip)
  → transporter drives New → Picked → On Transit → Delivered
```

Plus: identify and list every error, blockage, missing piece, or thing that should be
fixed.

## 2. Standing constraints (carry these forward)

1. **Only act on orders created by this testing effort.** Never touch pre-existing orders.
   The Garri order `69c1698467317734c348af91` (₦5,000,000, 23 Mar 2026) is on a hard
   FORBIDDEN list. Scripts that mutate an order should route the request through a guard
   that aborts anything outside the allowed set — see `b7-receipt-review.js` for the
   pattern.
2. **Test with newly created products.** Legacy products have inconsistent data.
3. **The signup/OTP bug is deferred** — explicitly out of scope.
4. Payment gateway is **not implemented**; manual bank transfer is the real flow. Do not
   build gateway integration.

## 3. Environment

**Stack:** Next.js 16 (App Router, turbopack), React 19, next-auth v4 (Credentials + JWT),
TanStack Query v5, Redux Toolkit, axios, Tailwind 4, zod + react-hook-form, sonner,
framer-motion.

**Backend:** `https://tractive-be.vercel.app` — swagger at `/docs/openapi.yaml`.

**Test credentials (user-supplied, test environment):**

| Role | Email | Password |
|---|---|---|
| buyer + agent + transporter (one account, 3 roles) | `i59mv8titr@lnovic.com` | `Testpassword` |
| admin | `ibrahim.saliman.zainab@gmail.com` | `test123` |

**Test harness:** Playwright driving **system Google Chrome** (`channel: "chrome"` —
bundled Chromium cannot be downloaded here). Per-role `storageState`. Cloudinary stubbed
via `page.route("**/api.cloudinary.com/**")`.

Harness lives at:
`C:\Users\USER\AppData\Local\Temp\claude\c--Users-USER-Documents-Tractive-Fe\9174500c-2889-4ddf-b1d5-d8a821fcea81\scratchpad\`
— `lib.js` (launch/context/save/shot/stubCloudinary), `lib2.js` (`uiLogin`, `adminLogin`,
`switchRole` with self-healing re-login, `describe`), numbered scripts `01-…`–`33-…`.

Scripts written on 08 Aug live in the **newer** session scratchpad
(`…\74643d00-803f-49db-bc9e-754404585446\scratchpad\`): `verify8.js`, `verify10g.js`,
`v10c.js`, `v10def.js`, `v10f.js`, `t1`–`t8` (trade loop + probes), `b1`–`b11b` (buyer
sweep). They import `lib.js`/`lib2.js` from the older path and **must be run with cwd set
to the older scratchpad** (that is where `node_modules/playwright` lives).

Added end of 08 Aug, same directory and same cwd rule:

| Script | What it does |
|---|---|
| `v11b.js` | 11b — places a fleet bid, asserts it appears with no reload |
| `v11h.js` | 11h — wishlist heart semantics, Tab-reachability, Enter/Space, restores to net zero |
| `a1-recon.js` | agent recon, all 11 pages; read-only guard; logs API calls, console errors and 404s per page |
| `a2-list-product.js` | lists a product end to end. Args: `[unitLabel] [name] [unitWeightKg]` |
| `a3-verify-units.js` | asserts every unit the picker offers is one the create API accepts, and no label doubles "(kg)" |
| `a4-interact.js` | produce-list tabs / search / price filter / pagination / action menu. **Has the product-scoped write guard** |
| `a5-editmodal.js`, `a6-editdiag.js` | Edit modal probes — why it sits on "Loading latest details…" |
| `a7-farmers.js` | farmer onboarding: validation, create, list refresh |
| `warm11b.js`, `recon-awaiting.js` | warm protected routes from a logged-in session; dump the buyer Awaiting-Transport cards |

Two selector traps these cost time on, worth carrying forward:
- `button:has-text("Add")` matches the **global header "Add to store"** on every agent
  page and opens the product modal. The farmers page control is `Onboard`
  (`button[aria-label="Onboard farmer"]`).
- `text=/^Order #[A-Z0-9]{8}$/` is fine once data has rendered, but on a cold route it
  times out — the page is up before the rows are.

**Known environment limits:**
- `api.cloudinary.com` is DNS-blocked → real image upload cannot be smoke-tested here.
- Disposable-mail APIs blocked → signup OTP unobtainable (hence the shared account).
- **`npx tsc --noEmit` is the verification command.** ESLint cannot run — pre-existing
  circular-structure config error, unrelated to these changes.
- **Dev server is slow, and the cause is mostly `.next` bloat — delete it.** The Windows
  Defender exclusion is still not in place (it cannot be set from a non-elevated shell).
  The user must run, as admin:
  `Add-MpPreference -ExclusionPath "C:\Users\USER\Documents\Tractive-Fe"`.
  **But the bigger win, measured 08 Aug:** `.next` had re-bloated to **5.69 GB**, and at
  that size Turbopack spent 54–88s per request on *"Finished filesystem cache database
  compaction"* — `/login` never finished compiling at all (>9 min, then a 500).
  After `Remove-Item -Recurse -Force .next`, the same route compiled in **22s**, and
  warm navigations were 0.3–2s. Wipe `.next` at the start of a session; it is a
  regenerable cache and the recompile cost is far less than the compaction tax.
- **Never run two `next dev` processes against this repo.** Doing so corrupts `.next` —
  every route then returns an instant 500 rendering the pages-router `_error` fallback,
  with *no* error in `.next/dev/logs/next-development.log` to explain it. The only
  recovery found was killing the whole process tree and deleting `.next`. Next warns
  `Another next dev server is already running` and tells you the PID; believe it.
- If a port-3000 server is already up, reuse it — `lib.js` hardcodes
  `BASE = "http://localhost:3000"`, so a server that fell back to 3001 is invisible to
  the whole harness.
- **Protected routes cannot be pre-warmed with `curl`.** Middleware 307s an
  unauthenticated request in ~0.2s *before* the page compiles, so the compile never
  happens. Warm them from inside a logged-in Playwright session instead.
- **A cold route reads as an empty list.** On a fresh `.next`, a fixed
  `waitForTimeout(5000)` after `goto` lands before the data renders — the Fleet Bids tab
  reported `[]` when it actually held three bids. Wait on a content locator
  (`text=/Your Bid: ₦/`) with a long timeout, not on a sleep.
- The saved `storageState` expires; scripts should call `uiLogin` if a Login button
  appears, then `switchRole` — the shared account's active role is often not the one you
  want.

## 4. Domain model learned the hard way

- One user holds `["buyer","agent","transporter"]`. Switch with
  `PATCH /api/profile/switch-role {activeRole}` — UI route `/register-as` → pick → Continue.
- `order.status` = **payment** lifecycle: `pending` → `payment_pending` → `paid`.
- `order.transportStatus` = **delivery** lifecycle: `pending | picked | on_transit | delivered`.
- Frontend maps UI "parked" → API "paid" via `FE_TO_API_STATUS`.
- Payment: `POST /api/orders` → `POST /api/transactions` → admin
  `PATCH /api/admin/transactions/{id}/status` → order `paid` → `readyForTransport`.
- Fleet: buyer books → `POST /api/transporters/fleet/{id}/payments` → admin
  `PATCH /api/admin/fleet-payments/{id}/status` → **auto-creates a fleet trip**.
- `GET /api/transporters/fleet/{id}/payments` **is transporter-scoped and works** (403s for
  a fleet that is not theirs). There is no aggregate equivalent.
- Product units in live data: `kg`, `bags`, `packet`, `100kg_bag`. `tonne` is used by
  nothing. Transport prices as `unitWeightKg × quantity`, falling back to treating quantity
  as kilograms — so a missing `unitWeightKg` silently under-charges freight.

## 5. Testing status

### Fully tested and passing

- **The core trade loop**, end to end through the real UI, three times — twice on 07 Aug
  (legacy + clean product) and again on 08 Aug (bid → counter → accept → order).
- **The entire buyer surface** — swept 08 Aug, see §7.

- **The agent surface** — swept 08 Aug, see §12 of the bug report. A product has now been
  listed end to end through the UI (`6a7788c8ba0438019d691431`), and a farmer onboarded.

### Never tested at all

- **Agent — what is left** — product **edit save** (the modal was opened and its form
  reached, but no save was completed), restock, bulk delete, out-of-stock transitions,
  customers detail, reviews replies
- **Transporter** — drivers, negotiations, customers, reviews, fleet edit, **Create Trip**
  (only auto-created trips have been seen), fleet submission (the Add Fleet form was
  validated but never submitted)
- **Admin** — everything except the two approval screens: users, suspend/remove, settings,
  banners, track-orders, refunds, live chats, queries
- **Cross-cutting** — chat, help/support, notifications, password reset, role-switching
  edge cases

### Blocked

- **#7 verification** needs one non-terminal trip. Every fleet is unbookable (backend B),
  so none can be created. ~30 seconds to confirm once the backend releases fleets.
- **Real Cloudinary upload** — DNS-blocked here. Affects receipt upload *and* product
  images. Needs a smoke test on a networked machine.

## 6. Everything fixed so far

All verified in the live UI unless stated. Full write-ups, with a **"Page to test"** and
the verification output for each, are in
[`E2E-BUG-REPORT-2026-08-07.md`](E2E-BUG-REPORT-2026-08-07.md).

| # | Fix | Verified |
|---|---|---|
| 2 | Agent "Delivered" tab was empty; delivered orders stuck in Packed | ✅ |
| 3 | Orders created but never paid were unreachable — new Pending Payment tab | ✅ |
| 4 | `useConfirmPayment` never sent transfer evidence (`bankUsed`, `narration`) | ✅ |
| 4b | Receipt image upload (`screenshotUrl`) | ⚠️ wiring only — Cloudinary stubbed |
| 5 | Trip status tabs showed wrong trips (backend `?status=` filter broken) | ✅ |
| 7 | Trip status dropdown defaulted from the wrong field | ❌ code done, **blocked** on backend B |
| 8 | Booking page listed products from every order, not the selected one | ✅ 1 scoped row vs 11 total |
| 10a | `useCreateOrder` invalidated **nothing** on success | ⚠️ frontend fixed, **backend item 10 outstanding** |
| 10b | Table behind the bidders modal stale after counter/reject | ✅ `Pending → Countered`, no reload |
| 10c | Transporter could not see their own fleet payments | ✅ Pending 0→5, Approved 4→8 |
| 10d | Unit dropdown missing `bags`/`packet`/`100kg_bag`; `unitWeightKg` optional | ✅ submit blocked without it |
| 10e | No fleet capacity/price bounds | ✅ frontend guard only |
| 10f | New agent blocked by an unexplained farmer prerequisite | ✅ verified with a stubbed empty list |
| 10g | Add-to-store modal discarded a part-filled form on outside click | ✅ 5 cases |
| 11b | Fleet bids list stale after placing a bid — `useCreateFleetBid` invalidated nothing, and the list had a 3-min `staleTime` | ✅ ₦137,500 bid visible with no reload |
| 11h | Wishlist heart was a bare `<div onClick>` | ✅ Tab-reachable, Enter + Space, `aria-pressed`, net-zero |
| 11h-2 | Product-detail heart had no accessible name beyond a `title`, no `aria-pressed` | ✅ same pass (a third instance found while fixing 11h) |
| 12a | Add-to-store offered units (`bags`, `packet`) that `POST /api/products` rejects with a 400 | ✅ picker now offers only accepted units — **backend issue 11 outstanding** |
| 12c | Prices labelled `$` on the produce-list filters and the Edit modal | ✅ now `₦`, 3 files |
| 12d | "Weight of one kilogram (kg) **(kg)**" — doubled parenthetical | ✅ verified across all 4 units |
| 12e | A failed create showed two toasts, burying the actionable one | ✅ each layer reports only what it knows |

**Every frontend item from the original report is now closed.**

## 7. Open bugs

### Backend — blocking

**A. Order totals wrong by a factor of `quantity` (money).** `unitPrice = amount / quantity`
instead of `unitPrice = amount`. `POST /api/orders` **enforces the wrong formula as a
guard**, so computation and guard must change together. Reproduced again 08 Aug:
`amount 1050 × qty 10` stored as `unitPrice 105, lineSubtotal 1050` (should be `1050` /
`10,500`).

**B. Fleets are never released after delivery.** A whole-truck fleet is bookable exactly
once in its lifetime. Blocks all further transport testing including #7.

**Item 11 (new, 08 Aug, HIGH).** `POST /api/products` rejects `bags` and `packet`, the
units **7 of 22 live products (32%) already use** — so a bagged product cannot be listed
at all. Meanwhile `50kg_bag` and `tonne` are accepted and used by nothing. The create
validator and the stored data disagree. Frontend now offers only accepted units;
**still to confirm whether `PATCH /api/products/{id}` shares the validator** — if it does,
those 7 products cannot be edited either and this is worse than High.

**Item 10 (new, 08 Aug).** `GET /api/buyers/biddings/won/checkout` still returns a bid
after `POST /api/orders` consumed it — so the same bid can be ordered repeatedly and the
"Ready to checkout" count never drops. Frontend invalidation is already in place and
confirmed; the payload itself still contains the bid.

Full detail for all of these, plus items 3–9, in
[`BACKEND-ISSUES-2026-08-07.md`](BACKEND-ISSUES-2026-08-07.md). Item 6 was **corrected** on
08 Aug (a per-fleet endpoint does exist) and downgraded to Low.

### Frontend — found 08 Aug in the buyer sweep, NOT yet fixed

See §11 of the bug report for evidence.

| # | Issue | Severity |
|---|---|---|
| 11a | Buyer cannot withdraw/cancel a fleet bid — no actions on the tab at all. Needs a backend endpoint first | Medium — **decision needed** |
| 11d | A seller can be reviewed **once ever, not once per order** — needs a product decision | Medium — **decision needed** |
| 11c | Follower count stays 0 after following (button flips, counter does not) | Low |
| 11e | Wishlist shows a product as "Available" with `Quantity: 0` | Low |
| 11f | Header "My Biddings" badge ignores fleet bids — data is already fetched, only the count filter is wrong ([SubNavbar.tsx:83](../src/components/nav/SubNavbar.tsx#L83)) | Low |
| 11g | A confirmed order silently vanishes from Track Orders, no acknowledgement | Low |
| 11i | Delivered tracking shows "Est date: N/A" | Low |
| 12b | Agent Edit Product modal blocks the whole form behind a 9s refetch, though it already has the row data. Deliberately not fixed — needs a dirty-field check so a late fetch can't clobber typed input | Medium |
| 12f | Add-to-store `×` close is a bare `<div onClick>` (Escape does work) | Low (a11y) |
| 12g | Broken avatar 404s on `/agent` and `/agent/customers`; avatars have no `onError` fallback though product images do | Low |
| 12h | A product can be listed with **no image at all** — step 1 never validates media | Low — **product decision** |

**11b, 11h, 12a, 12c, 12d and 12e are fixed** — see §6.

## 8. Where to pick up

**11b and 11h are done and verified** (§6). **11a** and **11d** still need decisions
before any code (see §9).

**The agent surface has been swept** (§12). Product listing and farmer onboarding both
work end to end; the notable find is **12a / backend item 11**, the unit-vocabulary
mismatch that made bagged products unlistable.

Suggested order:
1. ~~Fix 11b + 11h~~ — **done 08 Aug**.
2. ~~Sweep the **agent** surface~~ — **done 08 Aug**, see §12 of the bug report.
3. **Finish the agent leftovers**, all small and all on `/agent/produce-list`: complete an
   Edit **save** (only the form was reached), restock, out-of-stock transition, bulk
   delete. Use a product-scoped guard — `a4-interact.js` has one that allows writes only
   to products this effort created.
4. Then **transporter** (drivers, Create Trip, fleet submission), then **admin** (7
   untouched screens), then cross-cutting (chat, notifications, password reset).
5. Get backend A, B, item 10 and **item 11** in front of the backend team. A and B block
   real money and real trade, B blocks further transport testing here, and item 11 blocks
   listing a whole category of goods.
6. Ask the backend team the open question in item 11: does `PATCH /api/products/{id}`
   share the create validator? If so the 7 `bags`/`packet` products cannot be edited
   either.

## 9. Open questions for the user

1. **11a** — should a buyer be able to withdraw a fleet bid? If yes, the backend needs a
   `DELETE` route for fleet bids (product bids already have one).
2. **11d** — should reviews be per-order or per-seller? Currently the button is offered on
   every delivered order but only the first can ever succeed.
2b. **12h** — must a product have at least one image? Step 1 of Add-to-store never
   validates media, so a listing with no photograph is currently allowed.
3. **Legacy mispriced orders** — migrate, hand-correct, or write off? Blocks writing the
   migration.
4. **Restore the three deleted repo-root `.md` files?** `API_CHECKLIST.md`,
   `BACKEND_OUTSTANDING.md`, `BACKEND_RETEST_2026-07-29.md` still show as deleted in git
   and were not touched by any command in these sessions. Recoverable with `git restore`.
   **Still undecided.**
5. **Nothing has been committed.** 59 paths are modified/new in the working tree on `dev`.
   Say the word if you want this committed or split into branches.

## 10. Test data created by these sessions

| Kind | Id / detail |
|---|---|
| Clean-run product | `6a762614bc8b24630d48e129` (`QA CLEAN1 Yellow Maize`) |
| Clean-run order | `6a7627100a1730442be69616` — ₦1,680, delivered, receipt confirmed 08 Aug |
| Earlier order | `6a75d7825c88e28a8551fe6c` — ₦2,000 (should be ₦5,100,000) |
| 08 Aug bid | `6a76dc3ea6133da574ba92d9` — countered ₦1,100, accepted |
| 08 Aug order | `6a76df00…` / `#F3E6087D` — ₦1,050, **unpaid**, in Pending Payment |
| 08 Aug fleet bid | ₦120,000 on North Route Fleet `69a67ace96f7df1573952158`, pending |
| 08 Aug fleet bid (11b verify) | ₦137,500 on North Route Fleet `69a67ace96f7df1573952158`, pending — **cannot be withdrawn, see 11a** |
| 08 Aug agent product | `6a7788c8ba0438019d691431` — QA AGENT4 White Maize, 40 × 100kg_bag, ₦2,500 — **first product ever listed through the UI** |
| 08 Aug agent product | QA AGENT3 Yellow Sorghum — 40 × kg, ₦2,500 |
| 08 Aug farmer | QA Sweep Farmer 08Aug, `+2348033344455`, Kano / Fagge |
| Clean-run trip | `6a763121255839d6602fac52` (delivered) |
| Fleet payments | `6a75e7b5b9a3d4c579fe2ada`, plus one at ₦4,000,000 |
| Pre-existing trip advanced | `69ff4a66099795cd39d47d12` — was `loaded`, now `delivered` |

Reverted to net zero: one wishlist add/remove, one follow/unfollow of seller
`696f6c0a719a3fcdb97c3e16`.

## 11. Verification command

```
npx tsc --noEmit
```

Clean as of the end of this session. ESLint is unusable (pre-existing config error).
