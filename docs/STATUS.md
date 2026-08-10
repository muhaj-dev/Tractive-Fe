# Tractive — Test & Fix Status

**As of 10 Aug 2026.** Everything below was driven through the real UI (Playwright → Google
Chrome → `localhost:3000`) against the live backend `https://tractive-be.vercel.app`.

**All prior work is now committed** — nine commits on `dev`, split by area
(primitives · data layer · shared modal · buyer · agent · transporter · shared/nav/auth ·
docs · admin count fix). The only thing left dirty is the three deleted repo-root `.md`
files, held back pending **D6**.

Detail lives in:
- [`E2E-BUG-REPORT-2026-08-07.md`](E2E-BUG-REPORT-2026-08-07.md) — every bug, its fix, and how to re-test it
- [`BACKEND-ISSUES-2026-08-07.md`](BACKEND-ISSUES-2026-08-07.md) — the backend-facing list
- [`SESSION-HANDOFF-2026-08-09.md`](SESSION-HANDOFF-2026-08-09.md) — how to resume, environment traps, harness

**Verification command:** `npx tsc --noEmit` — clean. ESLint cannot run (pre-existing
circular-structure config error, unrelated to this work).

---

## 1. What works — verified in the live UI

### The core trade loop

Run end to end **three times**: agent lists → buyer bids → agent accepts / counters /
rejects → buyer accepts counter → checkout → "payment" → admin approves transaction →
agent sees the paid order → buyer books a fleet → admin approves fleet payment (auto-creates
a trip) → transporter drives New → Picked → On Transit → Delivered.

**The transport half was then run again 09 Aug entirely on objects created through the UI** —
fleet created in the UI → buyer books it → admin approves the payment → trip auto-created →
driven to delivered. That chain is what finally verified fix #7.

### Buyer surface — swept, zero API or console errors

| Area | Evidence |
|---|---|
| Wishlist add / remove / persist | `POST` → heart fills, count 3→4, survives reload; `DELETE` → back to 3 |
| Filters — rating, location, years | `?rating=5` → 5 cards drop to 3; `state=Zamfara` → 0, correctly |
| Track orders | 4 tabs with counts; delivered cards show transporter, IOT, model, full timeline |
| Confirm receipt | `POST …/confirm-receipt` → 200, `receiptConfirmed: true` |
| Leave a review | Submit disabled until rating **and** comment; proper `radiogroup` + per-star labels; duplicate 409 handled with a toast |
| Follow / unfollow | 201 / 200, label toggles correctly |
| Fleet bid (negotiate) | `POST …/fleet/{id}/bids` → 201 |
| Sellers list, store page, shipping & delivered | Render correctly on real data |

### Agent surface — swept, zero API or console errors

| Area | Evidence |
|---|---|
| **Product listing, end to end** | `POST /api/products` → 201. *First product ever listed through the UI* |
| Step 1 / step 2 validation | Farmer, name, category, **image**, quantity, unit, description, price all enforced inline |
| Categories & subcategories | Now API-driven (7 categories); picking one turns subcategory into a dependent `<select>` |
| Unit auto-fill | kg→1, 50kg bag→50, 100kg bag→100, tonne→1000 |
| Unit-weight gate (10d) | With a no-fixed-weight unit, submit blocked: *"Enter how many kg one bag weighs"* |
| Produce list | Active ↔ Out of Stock tabs; search + proper *"No products found"* empty state; price filter; pagination (10 / 9, Previous returns identically) |
| **Edit + save** | `PUT` → 200; ₦2,500→2,750, qty 40→45; table updated **without a reload**; persisted |
| **Out of stock → restock** | `PATCH {status}` and bulk `PATCH bulk/status` → 200; Active 13→12→13, a clean round trip |
| **Bulk delete** | `POST bulk/delete` → 200 carrying only the intended id; gone before and after reload |
| Destructive confirmations | Properly worded with counts + Cancel — *"1 product will be permanently deleted. This cannot be undone."* |
| **Farmer onboarding** | `POST /api/farmers` → 201; all 7 required fields validated; list 4→5 **without a reload** |

### Transporter surface — swept, all 11 pages 200, nothing redirects or throws

| Area | Evidence |
|---|---|
| **Driver onboarding** | `POST` → 201; 3 required fields validated; list 2→3 **without a reload**; actions Edit / Remove / Assign Fleet |
| **Add Fleet — submitted for the first time** | `POST /api/transporters/fleets` → 201; 8 required fields enforced; image required; listed without a reload |
| **Create Trip — correct behaviour** | Loads all 4 fleets and each one's confirmed bookings, labels those already dispatched, **disables their checkboxes**, keeps submit `disabled` until a selectable booking is ticked |
| Per-fleet payments (10c) | One `GET …/fleet/{id}/payments` per fleet, all 200 |
| Fleet list | 5 fleets with IOT, route, status, price; `available` / `on_transit` / `under_maintenance` render distinctly |
| **Trip lifecycle + fix #7** | New → Picked → On Transit → Delivered, every `PATCH` 200; the status dropdown always defaults to the **next** status and never re-offers the current one; delivered is terminal with no CTA |

### Admin interactions — the destructive controls, driven 10 Aug

Full write-up in §15 of the bug report.

| Area | Evidence |
|---|---|
| **Product payment approval** | `PATCH …/transactions/{id}/status {approved}` → 200. **The order money path, verified end to end**: dashboard Received Payment `218,641,380` → `218,642,680` (exactly +₦1,300) and order breakdown `paid` 13 → 14 |
| **Product payment rejection** | `PATCH …{rejected}` → 200, two-step confirmation on both actions |
| **User suspend / reactivate / remove / restore** | All four transitions 200 on a throwaway `.invalid` QA account, **finishing net zero, back in Active** |
| **Dashboard numbers are correct** | All four cards cross-checked against two independent API sources *and* against the sum of the 18 approved transactions — agree to the naira |
| **All 29 endpoints confirmed live** | Probed directly with an admin token against the Swagger spec; every one 200 |

Two blockers dissolved along the way: the "no QA-only user" problem (earlier sessions left
throwaway accounts behind — `qa.flow.probe.8821@example.invalid` uses the RFC 2606 reserved
`.invalid` TLD, so it can never be a real person), and **D4** (the Chat/Help APIs are real
and answer — see §15j).

### Admin surface — 10 of 11 screens clean

`/admin`, `all-users`, `active`, `suspended`, `removed`, `settings`, `transactions`,
`fleet-payments`, `new`, `rejected` all render with every backend call 200.
`/admin/track-orders` 404s (no page of its own) but both its children work —
`track-agent` (Paid 13 / Delivered 2) and `track-transporter` (Picked 6 / On Transit 1 /
Delivered 5). Fleet-payment approval is a correct two-step confirmation.

### Fixes shipped and verified

`2` delivered tab · `3` pending-payment tab · `4` transfer evidence · `5` trip status tabs ·
`8` booking page scoping · `10b` bidders-modal staleness · `10c` transporter fleet payments ·
`10d` unit vocabulary · `10e` fleet bounds · `10f` farmer prerequisite · `10g` form discard ·
`11b` fleet-bid invalidation · `11h`+`11h-2` wishlist heart a11y · `12a` unit picker ·
`12c` ₦ not $ · `12d` doubled "(kg)" · `12e` toast duplication · `12f` modal focus ·
`12g` avatar fallbacks · `12h` image required · `13a` missing assets ·
**`7` trip status dropdown (verified at last)** · `13c` duplicate fleet names ·
`14a` whole-truck pricing · `14b` admin mobile nav 404 · `14e` modal focus across 4 more
modals.

`4b` receipt upload is **wiring only** — Cloudinary is DNS-blocked here.
`10a` is frontend-fixed but depends on backend item 10.

---

## 2. What is not correct

### Backend — blocking, and in front of the backend team

| # | Issue | Severity |
|---|---|---|
| **A** | **Order totals wrong by a factor of `quantity`.** `unitPrice = amount / quantity` instead of `= amount`. `POST /api/orders` **enforces the wrong formula as a guard**, so computation and guard must change in the same deploy. An order was paid, approved and delivered for **₦2,000 instead of ₦5,100,000** | **Critical — money** |
| **B** | **Fleets are never released after delivery.** A whole-truck fleet is bookable exactly once in its lifetime. Bookings are never released either, so manual Create Trip is unreachable too | **Critical — blocks trade** |
| 10 | `won/checkout` still returns a bid after `POST /api/orders` consumed it — the same bid can be ordered repeatedly | High |
| 11 | **`unit` has three disagreeing vocabularies.** Stored `kg/bags/100kg_bag/packet`; enforced by create *and* update `kg/tonne/50kg_bag/100kg_bag`; documented in the spec `kg/ton/bag`. **7 of 22 products (32%) hold a unit their own API rejects**, so bagged goods cannot be listed | High |
| 12 | `POST /api/products` accepts `images: []` — a listing with no photograph goes live | Medium |
| 13 | `POST /api/auth/refresh` always 400s (*"Refresh token required"*) — a session can never be refreshed. Contract needs confirming | Medium |
| 3–9 | `fleet-trips?status=` filter, `picked` writing two disagreeing fields, orders never reflecting delivery, self-dealing not blocked, no fleet capacity/price validation, signup mailer (deferred) | High → Medium |

### Frontend — open

| # | Issue | Severity |
|---|---|---|
| 11a | Buyer cannot withdraw or cancel a fleet bid — no actions on the tab at all. Needs a backend `DELETE` route first | Medium — **decision needed** |
| 11d | A seller can be reviewed **once ever, not once per order** — the button is offered on every delivered order but only the first can succeed | Medium — **decision needed** |
| 12b | Agent Edit Product modal blocks its whole form behind a **9s** refetch, though it already holds the row's data. Left deliberately: needs a dirty-field check so a late fetch cannot clobber typed input | Medium |
| 13d | **An expired session renders an empty page, not an error.** A 401 paints "no data" — a 5-row fleet list became 0 rows silently. Frontend half: treat 401 as an error state. Backend half is item 13 | Medium |
| 15/16 | **The support `{id}` routes reject their own ids.** `GET /api/chat/{id}` and `DELETE /api/help/{id}` both 400 on ids their own list endpoints just returned, on valid-but-absent ids, and on malformed ids alike. So **a conversation can be listed but never opened, and a ticket can be raised but never closed.** Identical signature on two different resources points at one shared validator. Backend item 15 | **High — backend** |
| 14c | ~~15~~ **11 dead internal links** — Chat and Help are now built for both agent and transporter (§16). Remaining: `/agents`, `/transporters`, `/contact-us`, `/account-settings`, `/bid` and the 5 footer links | Medium — **decision needed** |
| ~~14c-a~~ | ~~**15 dead internal links.**~~ Chat and Help 404 for **both** agents and transporters (sidebar, desktop + mobile); 5 footer links 404 on every page; plus `/agents`, `/transporters`, `/contact-us`, `/account-settings`, `/bid`. These are missing *pages* — build or remove is a **product call** | Medium — **decision needed** |
| 14d | **Password reset does not exist.** `/forgot-password` and `/reset-password` both 404 and nothing links to them. With signup's mailer broken and refresh never working, account recovery has no path at all | Medium — **product gap** |
| ~~15d~~ | ~~Single-row destructive admin actions have no confirmation~~ — ✅ **FIXED 10 Aug** (§17b). All three ASR pages now confirm, naming the person: *"Suspend Tobi? … They will lose access until reactivated."* | ✅ |
| ~~15f~~ | ~~An entire admin page is unreachable~~ — ❌ **WITHDRAWN, not a bug** (§17a). The row click works; the `[id]` route just takes ~10s to compile on first hit in dev, and the probes waited 4s. A real a11y gap was found and fixed alongside it (the identity cell is now a keyboard-reachable `<Link>`, and clickable rows are keyboard-operable) | — |
| 17f | **Admin Trip Details modal has no dialog semantics and no buttons at all** — so no focusable close control; it cannot be dismissed from the keyboard. A step worse than 15g | Low (a11y) |
| 15b | A rejected transaction displays as **"Failed"** — the transactions screen has no *Rejected* tab, while fleet-payments does. The same concept is named differently on two adjacent screens | Low |
| 15g | `TransactionDetailModal` has no `role="dialog"` and does not close on Escape — the overlay stays up and swallows the next click. Same one-line `useModalA11y` fix as the others. The `/admin/new` modal next to it *does* have a dialog role, so the two disagree | Low (a11y) |
| 13e | Remaining modals still without focus management: `EditProductModal`, `BiddersModal`, `CustomerInfoModal`, the `CustomerCareModal`s, `TripDetailsModal`. Now a one-line `useModalA11y(isOpen, ref)` each | Low (a11y) |
| 11c | Follower count stays 0 after following — the button flips, the counter doesn't | Low |
| 11e | Wishlist shows a product as "Available" with `Quantity: 0` | Low |
| 11g | A confirmed order silently vanishes from Track Orders with no acknowledgement | Low |
| 11i | Delivered tracking shows *"Est date: N/A"* | Low |

**Withdrawn:** `11f` (header badge ignoring fleet bids) — **not a bug.** The badge counts
bids *needing a response*; fleet bids are already included and the ones observed were
`pending`, i.e. waiting on the transporter.

### Blocked, not broken

- **Real Cloudinary upload** — `api.cloudinary.com` is DNS-blocked here, so receipt *and*
  product image upload are stubbed. Needs a smoke test on a networked machine. **This is the
  only item on the whole list that cannot be done from this environment.**
- **Manual Create Trip** — no confirmed booking exists that isn't already on a trip
  (backend B). A new fleet does not help; a new fleet has no bookings. The *auto-created*
  trip path is fully verified.
- **No bookable fleet remains.** Every fleet including the new one has now been booked once,
  and backend B never releases them. Further transport testing needs another fleet created
  through the UI (cheap — Add Fleet works) or backend B fixed.

~~Fix #7~~ — **verified 09 Aug**, see §1.

---

## 3. Everything remaining to test

Every role's **pages** have been visited and every major **flow** exercised. What is left is
interaction depth — individual controls that have never had a button pressed — plus two
whole dimensions nobody has touched (mobile, notifications).

Ordered by value. `☐` = never exercised.

### 3.1 Admin interactions — the biggest gap

Five of the nine items are now done (10 Aug, bug report §15). Remaining:

- ☑ ~~suspend / remove / restore a user~~ — **done**, full lifecycle, net zero (§15c)
- ☑ ~~product-payment approval + rejection~~ — **done**, and the money path is verified
  end to end (§15a). **Note: no pending product payments remain** — the spread is now
  `approved 18, rejected 1, refunded 1`. Testing another approval needs a fresh order paid
  through the buyer UI first.
- ☑ ~~whether the dashboard widgets report correct numbers~~ — **done, they are correct**
  (§15h)
- ☐ **agent / transporter approval + rejection** (`/admin/new` has 7 rows, `/admin/rejected`).
  Started and deliberately stopped: the only row belonging to us is the **shared test
  account's own agent application**, and rejecting it could cost us the agent role — i.e.
  the only way in. It also already reads *"Approved / ACCOUNT STATUS active / Approved by
  admin"* while still sitting in the pending queue, which looks like a backend bug worth
  raising before pressing anything. Needs either a throwaway *application* or a decision.
- ☑ ~~refunds~~ — **done** (§17c). `POST /api/admin/transactions/refund` → 200, row moves to
  *Refunded*, and Received Payment fell by exactly ₦1,300 back to its pre-approval figure.
  **Both directions of the order money path are now verified on the same transaction.**
- ☑ ~~settings / banners~~ — **done, net zero** (§17d). Create → 201, delete → 200. Caveat:
  the image went through the Cloudinary stub, so real banner upload is still untested here.
- ☑ ~~user detail page `/admin/all-users/[id]`~~ — **reachable and renders** (§17a); the row
  click was never broken. Its internals (history panel, activity modals) are still untested.
- ☑ ~~`track-agent` / `track-transporter` row actions~~ — **done** (§17e). Correct paths are
  `/admin/track-orders/track-agent|track-transporter`. track-agent uses a per-row action
  menu; track-transporter opens a Trip Details modal (see the new 17f a11y finding).
- ☐ admin search / filters / pagination on all list screens (search *is* exercised
  incidentally by `x5-user-lifecycle.js`, which filters by email and works)

Two traps on these screens: `has-text("Approve")` also matches the **"Approved" tab** (it
navigates away and silently dismisses the confirm dialog — use `button:text-is()` scoped to
`[role="dialog"]`), and **row actions only appear after clicking the row**, which opens a
detail modal.

### 3.2 Buyer — leftover controls

- ☐ **respond to a countered fleet bid** — `MyFleetBids` renders Accept/Reject for
  `countered` bids; neither has ever been clicked
- ☐ **`FleetBidPaymentModal`** — paying for an accepted fleet bid, a completely untested
  payment path distinct from the direct booking that *is* verified
- ☐ **multi-order checkout** — the booking page offers *"Add products from your other orders
  (10)"*; every test shipped a single order line
- ☐ **`MakeBid` validation** on the product page (bids were placed, but not probed for bad input)
- ☐ **transactions page + `LiveChatModal`**
- ☐ **account pages** — profile edit, `AccountDetails`, `BankAccounts`
- ☐ the low-severity open bugs `11c`, `11e`, `11g`, `11i`

### 3.3 Agent — leftover controls

- ☐ **customers detail modal** (`CustomerInfoModal`)
- ☐ **reviews replies** — `/agent/reviews` shows a "0 replies" control never used
- ☐ **farmer edit / delete / details modal** (only *create* is verified)
- ☐ **order tab actions** on `received` / `packed` / `delivered` — e.g. marking an order packed
- ☐ **`CustomerCareModal`** (pending + received) and **`TransactionDetailsModal`**
- ☐ single-product restock (only the *bulk* path is verified)

### 3.4 Transporter — leftover controls

- ☐ **negotiations** — responding to a fleet bid as the transporter
  (`useRespondToFleetBidAsTransporter` is wired but never exercised)
- ☐ **customers**, **reviews**
- ☐ **fleet edit** — `AddFleet` takes `editFleetData` and relaxes its required fields; only
  the create path is verified
- ☐ **driver edit / remove / assign fleet** and `DriverDetailsModal` (only create is verified)
- ☐ **trip detail beyond status** — tracking map, `TripDetailsModal` internals
- ☐ **manual Create Trip completion** — blocked by backend 14, not by the UI

### 3.5 Cross-cutting — two dimensions nobody has touched

- ☐ **Mobile / responsive: entirely untested.** Every session ran at 1600×1400 desktop. This
  matters more than it sounds — **two of the bugs found so far live only in mobile
  components** (the admin `track-orders` 404 and the `/agent  ` typo were both in
  `*MobileNav*` files), which suggests the mobile navs are less exercised in general.
- ☐ **Notifications: never opened.** `GET /api/notifications` and the SSE
  `/api/notifications/stream` return 200 on *every* page load, so the plumbing is live, but
  the notifications UI has never been opened, and no notification has been read or actioned.
- ☐ **Login edge cases** — wrong password, unverified user, field validation, logout
- ☐ **Error boundaries / the 404 page** as a deliberate test
- ☐ **Role-switching edge cases** — exercised constantly as a side effect, never probed
  deliberately (e.g. switching mid-flow, or a role the account lacks)
- ☐ **Chat + Help** — currently 404 for agent *and* transporter; blocked on decision D5
- ☐ **Password reset** — does not exist; blocked on decision D6
- ☐ **Signup** — deferred by request (see Parked in the bug report)

### 3.6 Quality / a11y sweeps

- ☐ **Finish the modal focus pass** — five modals pass; the same one-line
  `useModalA11y(isOpen, ref)` is still needed for `EditProductModal`, `BiddersModal`,
  `CustomerInfoModal`, the `CustomerCareModal`s and `TripDetailsModal`
- ☐ **Migrate the remaining 10 `placeholder-avatar.png` call sites** to the resilient
  `Avatar` component (mostly admin screens — do it during 3.1)
- ☐ **A wider a11y pass** — the bare-`<div onClick>` pattern fixed in three places
  (`11h`, `11h-2`, `12f`) almost certainly exists elsewhere
- ☐ Tailwind canonical-class warnings across many files — cosmetic, flagged by the IDE, never
  addressed

### 3.7 Blocked — needs the backend or another machine

- ☐ **Real Cloudinary upload** (product images + payment receipts) — `api.cloudinary.com` is
  DNS-blocked here. **The only item on this whole list that cannot be done from this
  environment.**
- ☐ **Any further transport testing** — no bookable fleet remains. Create one via Add Fleet
  (it works), but each new fleet is a permanent row, so don't do it casually.
- ☐ **Manual Create Trip** — needs backend 14 (bookings never released).

---

## 4. Waiting on a decision

Seven open. Each one blocks specific work, so none of these are academic — the "Blocks"
column is why it matters that they get answered.

| # | Decision needed | Blocks | Options / recommendation |
|---|---|---|---|
| **D1** | **11a** — should a buyer be able to withdraw or cancel a fleet bid? | The Fleet Bids tab has **no actions at all**. Two bids have sat `Pending` for 20+ days with no way out. Cannot be built at all until the backend has a route | Product bids already have `DELETE /api/bids/{id}`; fleet bids have no equivalent. **If yes, the backend must add one first** — then it's a small frontend change |
| **D2** | **11d** — should reviews be **per-order** or **per-seller**? | The *Leave a review* button is offered on every delivered order but only the first can ever succeed (409 `"You have already reviewed this user"`). Currently handled gracefully, so it looks fine while being wrong | **Per-order** = backend change (scope the uniqueness to the order). **Per-seller** = frontend change (hide the button once reviewed). Per-order is the more useful product; per-seller is the cheaper fix |
| **D3** | **Legacy mispriced orders** — migrate, hand-correct, or write off? | Writing the migration for backend **A**. A blanket `× quantity` would *inflate* legacy rows placed with lot-total amounts, so it cannot be automated blindly | Needs a human pass over the affected orders. Related: every stored `commissionAmount` is wrong by the same factor |
| ~~**D4**~~ | ✅ **ANSWERED 10 Aug — build them.** The APIs exist and answer | — | See "Answered" below |
| **D5** | **14d** — is password reset in scope? | It **does not exist**: `/forgot-password` and `/reset-password` both 404 and nothing links to them. Combined with the signup mailer being broken and `refresh` never working (13d), **account recovery has no working path at all** | If in scope this is a real feature (route + email). If not, say so and it comes off the list — but then a locked-out user has no recourse, which is worth a deliberate decision rather than a silent gap |
| **D6** | **Restore the three deleted repo-root `.md` files?** `API_CHECKLIST.md`, `BACKEND_OUTSTANDING.md`, `BACKEND_RETEST_2026-07-29.md` | Nothing, but they still show as deleted in git and no command in these sessions touched them | Recoverable with `git restore <file>`. Someone deleted them deliberately or by accident — worth confirming which |
| ~~**D7**~~ | ✅ **ANSWERED 10 Aug — split by area, done** | — | See "Answered" below |
| **D8** | **New.** Should the shared test account's own agent application be approved or rejected on `/admin/new`? | The last untested approval screen. It is the only row on it that belongs to us | Approving looks harmless; **rejecting risks the agent role on the only account that can log in**. Separately, it already reads *"Approved / active / Approved by admin"* while sitting in the *pending* queue — raise that with the backend first |

**Answered so far:**

- ✅ **A product must have at least one image** — enforced on the frontend 09 Aug (12h), and
  the backend has been asked for the server-side rule as item 12.
- ✅ **D4 — build the Chat and Help pages** (10 Aug). Conditional on the APIs existing; they
  do, and all five return 200 (§15j): `GET /api/chat`, `GET /api/help`,
  `GET /api/support/contacts`, plus the admin `live-chats` (2 conversations already) and
  `queries` screens they feed. `/api/help` is a support-ticket API, `/api/chat` a
  conversation API. Building them also gives two untested admin screens real input.
- ✅ **D7 — commit, split by area** (10 Aug). Nine commits on `dev`. The three deleted
  repo-root `.md` files were deliberately left unstaged, pending **D6**.
