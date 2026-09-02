# Tractive E2E — Session Handoff (10 Aug 2026)

**Supersedes `SESSION-HANDOFF-2026-08-09.md`.** Branch `dev`. Covers **two sessions on
10 Aug** — the first ended at §19 (mobile sweep); the second is §20 and is described in
§9 at the bottom of this file. Its work is **uncommitted**.

> **Start here if you are picking this up:** read §9 first — it is the newest state and it
> answers two of the open decisions, closes several §3 items, and adds three backend
> issues. Then §2 (constraints), §3 (environment traps) and §6 (where to pick up).

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
- **Mobile and tablet swept** (§19) — 42 pages at 390×844 and 42 at 768×1024, **zero
  horizontal overflow at either**. Four behavioural bugs found and fixed: the mobile
  notification dot was hardcoded mock data (3 navbars), the mobile menu could not be opened
  from a keyboard (4 navbars), the homepage banner rendered `<Image src="">`, and four
  dashboard avatar call sites rendered broken images.
- **A second withdrawal: 14d.** Password reset was never missing — the route is
  `/forget-password`, and the earlier audit probed the American spelling. **D5 dissolves**;
  the real defect is new backend item **16**, where the endpoint returns 200 for addresses
  with no account and **500 for every address that has one**.

**These changes are uncommitted** — the working tree holds the §19 fixes and the doc
updates. Commit was not requested.

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

Mobile scripts (`…\f4d44da8-e941-46d5-bc6b-b34a5f6cff1a\scratchpad\`):

| Script | What it does |
|---|---|
| `m1-mobile-recon.js <WxH>` | the §19 sweep. **Viewport is argv** — `390x844`, `768x1024`. All 42 pages, all roles, measures overflow / offending elements / tap targets / nav presence, screenshots each. Aborts every non-GET, and toggles the guard off only to switch role |
| `m2-assets.js` | names broken and empty-`src` images and the failing request URLs |
| `m3-verify.js` | re-verifies today's fixes in the browser, plus the 5× `won/checkout` probe |
| `m4-chart-overlap.js` | identifies what overlaps the admin Revenue chart (answer: the dev-tool badges, not app code) |

`lib.js`'s `newContext` now takes `viewport`, `isMobile`, `hasTouch`, `userAgent` and
`deviceScaleFactor` overrides — all optional, so every earlier script is unaffected.

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

**Notifications: `unreadCount` is 45** on the shared test account as of 10 Aug — plenty of
real data for the notifications work, and nothing has been read or actioned yet.

## 6. Where to pick up

**Mobile is no longer the top item — it was swept on 10 Aug (§19) and the layout is
clean.** 42 pages at 390×844 and 42 at 768×1024, zero horizontal overflow at either. It
still yielded four behavioural bugs, all fixed. Run the sweep again with
`node m1-mobile-recon.js 390x844` (the viewport is an argv now).

1. **Notifications** — the strongest remaining item. The API reports **45 unread** for the
   test account, so there is real data. Note §19b found the mobile bell was driven by a
   hardcoded mock array until today, so treat any earlier impression of it as void.
2. **Mobile *flows*** — the narrower gap the sweep leaves behind. Both passes were
   read-only; nobody has placed a bid, checked out, or submitted a form at 390px. Layout is
   evidenced, transacting on a phone is not.
3. **Buyer leftovers (§3.2)** — `FleetBidPaymentModal` above all, a whole untested payment
   path; then responding to a countered fleet bid, multi-order checkout, `MakeBid`
   validation.
4. **Agent and transporter leftovers (§3.3, §3.4)** — customers modal, reviews replies,
   farmer edit/delete, transporter negotiations, fleet edit, driver edit/remove.
5. **The a11y modal pass (§3.6)** — seven modals, 17f the worst (no dialog role, no buttons
   at all). One line each. Related: the bare-click-handler pattern has now been found in
   **five** places, so the `onClick`-on-a-`div` sweep is overdue.
6. **Login edge cases, error boundaries, deliberate role-switch probing.**
7. Get backend **A, B, 10, 11, 12, 15, 16** in front of the backend team — **16 is new and
   matters**: password reset 500s for every address that has an account.

## 7. Open decisions

**D1** fleet-bid withdrawal · **D2** reviews per-order vs per-seller · **D3** legacy
mispriced orders · **D6** restore the three deleted `.md` files · **D8** the shared
account's own agent application on `/admin/new`.

Full table with what each blocks: [`STATUS.md`](STATUS.md) §4.
**Answered:** product image required · **D4** build Chat/Help · **D7** commit by area ·
**D5 dissolved** — password reset was never missing, only misspelled in the audit (§19g);
what remains is backend item 16, not a product call.

## 8. Verification

```
npx tsc --noEmit
```

Clean as of the end of this session.

---

## 9. Second session, 10 Aug — notifications, the fleet-bid loop, partial checkout

**Uncommitted.** Full write-up in bug report **§20**; backend items **18, 19, 20**.

### What was asked for and what happened

A fresh product was taken all the way to a **pending** payment (there were none left, so
admin approval could not be re-tested). Getting there immediately broke, and the four
priorities after it each turned up something.

### The five findings that matter

1. **Partial checkout was impossible** (§20a, fixed). `my-biddings` sent the backend's
   **whole-basket** totals with only the **selected** `bidIds`, so any checkout of *some*
   won bids died on `400 "Total amount does not match accepted bids"`. Every earlier
   script ticked *every* checkbox, which is why it had never been seen. Totals are now
   derived from the selection.
2. **The transporter could never see a fleet bid** (§20c, fixed frontend-side).
   `GET /api/transporters/negotiations` returns `[]` in every variant while
   `/fleet/{id}/bids` returns the same 4 pending bids — two of them **22 days old** — so
   the negotiation loop had been dead the whole time. The page now falls back to
   aggregating per fleet **only when the server list is empty**, so a backend fix silently
   takes over. Loop verified: 0 → 5 rows, **accept → 200**, buyer sees *Pay Now*.
   → **backend 19**.
3. **Fleet-bid payment is blocked at the last call** (§20d).
   `POST /api/transporters/fleet/payments` → **405** (path resolves, verb not mounted;
   probed with an empty body). The modal itself is correct. The *direct booking* payment
   `/fleet/{fleetId}/payments` still works. → **backend 20**.
4. **Notifications** (§20b). The bell was a bare `div` in **all 11 navbars** — measured:
   **60 Tab presses never reached it**, so the panel could not be opened without a mouse.
   Also: notifications never linked anywhere (the API sends `metadata`, never `link`),
   mark-read failed **silently**, and the panel hid the entire read history once unread hit
   zero. All fixed and verified. Marking one read still 400s → **backend 18**, which is
   almost certainly the **same validator as item 15**.
5. **a11y** (§20e). Three modals given dialog semantics — `TransactionDetailModal` (closes
   **15g**), `TrackTransporterInfoModal` (closes **17f**), `FleetBidPaymentModal` — plus
   two real radio groups. `BankAccounts` was the sharp one: `role="radio"` on a `div` with
   no `tabIndex`, while the confirm button **silently does nothing** until a bank is picked.

### Decisions answered

- **D6 — restore the files.** `API_CHECKLIST.md`, `BACKEND_OUTSTANDING.md`,
  `BACKEND_RETEST_2026-07-29.md` were `git restore`d and no longer show as deleted.
- **D8 — leave it, report only.** Nothing on `/admin/new` was pressed. It still reads
  *"Approved / active / Approved by admin"* for a row in the **pending** queue — raise that
  with the backend.

**Still open: D1, D2, D3.**

### What was deliberately NOT done

- **"Mark all as read."** It is the only working way to clear the badge, but it would
  destroy the **49 unread** that are the only real data the notification area has. Press it
  only when you intend to spend them.
- **The transporter's counter and reject paths.** Only *accept* was exercised. They are
  reachable now that §20c is fixed.
- **Agent leftovers (§3.3) — none were reached.** Customers modal, review replies, farmer
  edit/delete, order tab actions, single-product restock are all still untouched. This is
  the biggest remaining gap.
- **Five modals** still need `useModalA11y`: `EditProductModal`, `BiddersModal`,
  `CustomerInfoModal` (×2), the `CustomerCareModal`s, `TripDetailsModal`.

### New traps (these cost time — read them)

- **`POST /api/orders` returns the product line-item `_id` *before* the order `_id`.** A
  naive `_id` regex grabs `…abb1` instead of the order's `…abb0`. Resolve the order id from
  `GET /api/orders`.
- **`page.route` interception breaks CORS preflight** for `fetch` issued inside the page —
  every raw endpoint probe returned `TypeError: Failed to fetch` until the handler was
  removed. Probe endpoints with **no route handler installed**.
- **A write guard must allow `PATCH /api/profile/switch-role`**, or `switchRole()` hangs and
  every later step fails for an unrelated-looking reason.
- **Mongo ids start with a digit**, so `input#<id>` is an invalid CSS selector — use
  `input[id="…"]`.
- **The agent produce table paginates now** (12 active), so `button:has-text("Next")`
  resolves to the **pagination** Next sitting under the modal overlay, which never becomes
  clickable. Use `.last()`.
- **The saved session expired mid-session** and `POST /api/auth/refresh` 400'd (backend 13),
  which renders as a redirect to `/login`. Use `newContext(…, { fresh: true })` +
  `uiLogin()` when a run starts failing on `switch-role` 401s.
- The My Orders tab is **"Pending Payment"** — capitalised; a lowercase selector misses it.

### Test data added

| Kind | Id | State |
|---|---|---|
| Product | `6a79a14c2a8944dd700abfdf` — QA PEND1 White Beans, ₦400/kg | active |
| Bid | `6a79a1ac2a8944dd700ac02c` — 3 kg @ ₦400 | accepted → ordered |
| Order | `6a79a66369acd8dadda5abb0` — ₦400 | **pending payment → paid, awaiting confirmation** |
| Transaction | `6a79a90239ec0e1c56c5d3ed` — ₦400, `PAY-1786358018286-3552` | **pending — this is the fresh one for admin approval** |
| Fleet bid | `6a778318aba43e06b1aeda05` — ₦137,500, North Route Fleet | **accepted** (was pending 1 day); cannot be paid, backend 20 |

**There is now one pending product payment on `/admin/transactions`** (₦400). That was the
point of the exercise — admin approval can be re-tested against it.

### Scripts (`…\8dadaa6f-a93a-4430-8776-ca02916e5708\scratchpad\`)

| Script | What it does |
|---|---|
| `p1-pending-product.js` | the full chain, steps 1–4, `START=n` to resume. Id-allowlist guard |
| `p3-pay-pending.js` | pays the pending order from My Orders; refuses any other order |
| `p4-find-order.js` | resolves the real order id (see the `_id` trap above) |
| `n1-notifications.js` | opens the panel, marks **one** read; **blocks mark-all** |
| `n2-badge.js` | proves the bell is/was keyboard-unreachable (60-Tab probe) |
| `n3-verify.js` | verifies the bell fix + row links, `ROLE=` argv |
| `f1`…`f3` | fleet-bid recon, negotiations-empty proof, URL-form probe |
| `f4-negotiate-loop.js` | transporter accept → buyer *Pay Now*, `STEP=n` |
| `f5-fleet-pay.js` | drives `FleetBidPaymentModal` to the 405 |
| `f6-payments-route.js` | empty-body probe of the payment routes (no interception) |
| `a1-verify-a11y.js` | verifies the dialog semantics in the browser |
