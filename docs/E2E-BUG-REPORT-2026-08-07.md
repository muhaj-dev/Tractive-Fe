# End-to-end bug report — 07 Aug 2026

Full buyer → agent → transporter → admin flow driven through the real UI
(`localhost:3000`) against the live backend (`https://tractive-be.vercel.app`),
using Playwright against Google Chrome.

**The complete flow does work end to end.** 4 products listed → 4 bids placed →
accept / counter / reject → counter accepted → checkout → payment → admin approval →
fleet booked → fleet payment approved → trip auto-created → New → Picked → On Transit →
Delivered, visible to buyer and transporter.

The issues below are what went wrong along the way, ordered by what to fix first.

Accounts used: `i59mv8titr@lnovic.com` (buyer + agent + transporter),
`ibrahim.saliman.zainab@gmail.com` (admin).

---

## 1. Order pricing is wrong by a factor of `quantity` — CRITICAL, live money

### What happens

The backend treats a bid's `amount` as **the total price for the whole lot**.
Every screen in the app presents it as **a price per unit**.

Real numbers from this run:

| Product | List price | Bid `amount` | `quantity` | Order stored | Should be |
|---|---|---|---|---|---|
| Premium White Maize | ₦950 /kg | 900 | 2,000 kg | `lineSubtotal: 900` | ₦1,800,000 |
| Long Grain Paddy Rice | ₦1,150 /kg | 1,100 | 3,000 kg | `lineSubtotal: 1100` | ₦3,300,000 |
| Sweet Potatoes | ₦700 /kg | 680 | 1,000 kg | `lineSubtotal: 680` | ₦680,000 |

Order `6a75d7825c88e28a8551fe6c` was created, **paid, admin-approved and delivered**
for **₦2,000** instead of ₦5,100,000.

### The exact formula in use

`GET /api/buyers/biddings/won/checkout` — isolated, single accepted bid:

```
bid: { product: "Sweet Potatoes (Orange Flesh)", listPrice: 700,
       amount: 680, quantity: 1000, unit: "kg", unitWeightKg: 1 }

response: productsSubtotal: 680 | localTransportTotal: 0 | totalAmount: 680
```

So the backend computes:

```
unitPrice       = bid.amount / bid.quantity      // 680 / 1000 = 0.68
lineSubtotal    = bid.amount                     // 680
productsSubtotal= Σ bid.amount
totalAmount     = productsSubtotal + localTransportTotal
```

`unitPrice` comes out as **₦0.68 per kilogram of sweet potatoes** — the number is
self-evidently wrong, which is the clearest signal the semantics are inverted.

### This is enforced, not incidental

`POST /api/orders` validates the client's `totalAmount` against its own formula and
rejects anything else:

```
totalAmount: 1       → 400 {"success":false,"message":"Total amount does not match accepted bids"}
totalAmount: 680000  → 400 {"success":false,"message":"Total amount does not match accepted bids"}   ← the correct figure
totalAmount: 680     → 201 created, unitPrice 0.68, lineSubtotal 680
```

Good news inside the bad: **the client cannot tamper with the order total.** The
validation is sound; only the formula it validates against is wrong. Both the
computation and the validation must change together, or checkout will start 400-ing.

### Why `amount` is meant to be per-unit

1. The bid form labels the field **"Proposed Price (₦)"** and puts it directly beside
   **"Quantity (kg)"** — [MakeBid.tsx:90](../src/app/(main)/buyer/_components/ProductDetails/productHeader/MakeBid.tsx#L90).
2. The product page shows the list price `₦1,150` and, on the same card,
   `Leading: ₦1,150`. A "leading bid" is only comparable to a list price if both are
   per-unit.
3. The agent's bids table has adjacent **Price** (`₦950`, the product's per-unit price)
   and **Leading** (`₦900`, the bid amount) columns.
4. The order line model already carries `quantity`, `unitPrice` **and** `lineSubtotal`
   as three separate fields. If `amount` were the lot total, `unitPrice` would be a
   derived fraction with no meaning — which is exactly what it currently is.

### Fix

Backend, in whatever module computes bid totals:

```
unitPrice        = bid.amount
lineSubtotal     = bid.amount * bid.quantity
productsSubtotal = Σ lineSubtotal
localTransportTotal = Σ (product.localTransport.required ? product.localTransport.fee : 0)
totalAmount      = productsSubtotal + localTransportTotal
```

Apply to **all three** places, together:
- `GET /api/buyers/biddings/won/checkout` (`productsSubtotal` / `totalAmount`)
- `POST /api/orders` (`unitPrice`, `lineSubtotal`, `totalAmount`)
- the `totalAmount` validation guard in `POST /api/orders`

No frontend change needed — it only renders what the API returns
([bidService.ts:329](../src/services/bidService.ts#L329) passes the values straight
through).

### Also check

- **Existing orders are wrong in the database** and will need a migration or a
  write-off decision. Legacy orders (Cocoa ₦53,000, claister ₦304,000, Corn ₦404,000)
  used bid amounts that look like lot totals, so a blind `× quantity` migration would
  inflate them. These need a manual pass.
- **Commission is derived from the total** (`commissionRate: 0.1`), so every
  commission figure is wrong by the same factor.
- **Transport pricing is unaffected** — fleet payment computed ₦250,000 for 5,000 kg
  correctly, from `weight × pricePerKg`. That path is fine.

---

## 2. Agent never sees an order reach Delivered — HIGH — ✅ FIXED

### The bug

After an order was fully delivered (buyer shows **Delivered**, transporter shows the
completed timeline), the agent's Orders page read:

```
New 1 · Packed 11 · Delivered 0
```

### Root cause

Two sides of the app read two different fields:

- **Buyer** filters on `order.transportStatus`
  ([ShippingList.tsx:26](../src/app/(main)/buyer/my-orders/_components/ShippingList.tsx#L26)) — correct.
- **Agent** filtered on `order.status`, sending `?status=delivered` to the API.

`order.status` is the *payment* lifecycle (`pending` → `payment_pending` → `paid`).
Delivery is only ever written to `transportStatus`, so a delivered order keeps
`status: "paid"` forever. `?status=delivered` therefore matched nothing and the order
stayed under Packed (which maps to `paid` via `FE_TO_API_STATUS`).

### Fix

- `isOrderDelivered(record)` added in
  [OrderService.ts](../src/services/OrderService.ts) — true when `transportStatus` **or**
  `status` is `delivered`, so it covers both a transporter delivery and an agent marking
  the order delivered by hand.
- `mapOrderRecord` reports `delivered` when that holds.
- [AgentOrderTable.tsx](../src/app/(main)/agent/_components/table/AgentOrderTable.tsx)
  queries `status=parked` for the Delivered tab and splits Packed / Delivered
  client-side.
- The three agent order pages (`new`, `packed`, `delivered`) now derive both tab counts
  from one `paid` query.

### Verified

Clean run with a brand-new product (`QA CLEAN1 Yellow Maize`), order
`6a7627100a1730442be69616`, trip `6a763121255839d6602fac52`:

| | Before | After |
|---|---|---|
| Agent Packed | 9 (contained the order) | 8 (does not) |
| Agent Delivered | 3 → showed 0 before the fix | 4 (contains the order) |

---

## 3. Orders get stranded with no way to pay them — HIGH — ✅ FIXED

### The bug

The payment modal existed only in the moment right after checkout. Close it and the
unpaid order was unreachable: it is not `paid`, so it never appears under Awaiting
Transport, and there was no pending-payments view anywhere.

This was stranding **real** orders, not just test ones — a `Garri` order from
**23 March 2026** was sitting unpaid and unreachable in this account.

### Fix

- `isOrderUnpaid` / `isOrderAwaitingApproval` added in
  [OrderService.ts](../src/services/OrderService.ts).
- `useUnpaidOrders()` in [useOrderQueries.ts](../src/hooks/queries/useOrderQueries.ts)
  fetches orders unfiltered and narrows client-side — deliberately, because
  `?status=pending` misses `payment_pending` orders and `?status=payment_pending`
  returns an empty list on the API today.
- New **Pending Payment** tab on My Orders
  ([PendingPaymentList.tsx](../src/app/(main)/buyer/my-orders/_components/PendingPaymentList.tsx)),
  first in the tab order, with a **Complete payment** button per order.
- Orders already awaiting admin approval render as
  *"Transfer submitted — awaiting confirmation"* with no button, so a buyer cannot pay twice.

### Verified

```
Pending Payment 3 · Awaiting Transport 8 · Shipping & Delivered 4

QA CLEAN1 Yellow Maize  #22EEA034  Transfer submitted — awaiting confirmation  ₦1,200
Sweet Potatoes          #237E62DC  Transfer submitted — awaiting confirmation  ₦680
Garri                   #C348AF91  Payment not completed                    ₦5,000,000  [Complete payment]
```

---

## 4. `useConfirmPayment` was dead code — HIGH — ✅ FIXED

### The bug

[usePaymentQueries.ts:44](../src/hooks/queries/usePaymentQueries.ts#L44) wraps
`POST /api/payments/{paymentRef}/confirm` and **no component imported it**. The buyer
could never submit which bank they used or a narration — `paymentConfirmation` was always
`{ bankUsed: null, narration: null, screenshotUrl: null }`. **Admins were approving
transfers with no evidence to match against a bank statement.**

### Fix

- The bank list is now selectable
  ([BankAccounts.tsx](../src/app/(main)/buyer/my-biddings/_components/BankAccounts.tsx)) —
  the buyer taps the account they transferred to.
- [AccountDetails.tsx](../src/app/(main)/buyer/my-biddings/_components/AccountDetails.tsx)
  collects that plus an optional narration/reference, and blocks confirmation until a
  bank is chosen.
- New shared
  [OrderPaymentModal.tsx](../src/app/(main)/buyer/my-biddings/_components/OrderPaymentModal.tsx)
  runs method → bank details → `POST /api/transactions` → `POST /api/payments/{ref}/confirm`.
  `BidsCheckout` and the new Pending Payment tab both use it, so the flow exists in one
  place. If the confirm call fails the transaction still stands and the buyer still sees
  success — the payment is recorded either way.

### Verified

Both requests now fire, in order:

```
POST /api/transactions
  {"order":"6a75ede4…","amount":680,"paymentMethod":"bank_transfer"}          -> 201

POST /api/payments/PAY-1786133303333-3890/confirm
  {"bankUsed":"Access Bank","narration":"QA test transfer ref 99231"}         -> 200
  -> paymentConfirmation: { bankUsed: "Access Bank",
                            narration: "QA test transfer ref 99231",
                            screenshotUrl: null }
```

Confirming without picking a bank is blocked client-side — zero network calls made.

Regression-checked the original path too: bid → accept → checkout → pay fires
`/api/orders` → `/api/transactions` → `/api/payments/{ref}/confirm` and shows the success
modal.

### Receipt upload — added

[AccountDetails.tsx](../src/app/(main)/buyer/my-biddings/_components/AccountDetails.tsx)
now takes an optional receipt image: **+ Attach receipt image** → thumbnail preview with
a remove button → uploaded to Cloudinary on confirm → `screenshotUrl` sent with the
payload. Images only, 5MB cap, and the button shows *"Uploading receipt…"* while it runs.

A failed upload **does not block payment** — the buyer sees *"Couldn't upload your
receipt. Continuing without it."* and the transaction still goes through. Losing optional
evidence is better than losing the payment.

Verified end to end:

```
POST https://api.cloudinary.com/v1_1/do8rhsyvi/image/upload
  multipart: file=Beans.png (image/png), upload_preset=products

POST /api/transactions   {"order":"6a76402a…","amount":1300,…}          -> 201
POST /api/payments/PAY-1786134958836-2377/confirm
  {"bankUsed":"Access Bank","narration":"Receipt test ref 7781",
   "screenshotUrl":"https://res.cloudinary.com/do8rhsyvi/…/sample.jpg"} -> 200

stored: paymentConfirmation {
  bankUsed: "Access Bank",
  narration: "Receipt test ref 7781",
  screenshotUrl: "https://res.cloudinary.com/do8rhsyvi/…/sample.jpg"   ← was always null
}
```

**Caveat:** `api.cloudinary.com` is DNS-blocked on this machine, so the upload response
was stubbed in the test harness. The **request** is real and identical in shape to the
product-image upload that already works in production — but the actual Cloudinary
round-trip is unverified here and should be smoke-tested on a machine with access.

---

## 5. Trip status mismatch — transporter tabs showed the wrong trips — HIGH — ✅ FIXED (frontend)

### What was actually wrong

Two separate defects, both confirmed live.

**5a. The backend's trip `status` filter is unreliable.** With all four trips
`delivered`:

```
GET /api/transporters/fleet-trips?status=picked      -> 4 trips, every one delivered
GET /api/transporters/fleet-trips?status=delivered   -> 4 trips (correct)
GET /api/transporters/fleet-trips?status=planned     -> 0
GET /api/transporters/fleet-trips?status=on_transit  -> 0
GET /api/transporters/fleet-trips?status=loaded      -> 0
```

The **Picked tab was listing four already-delivered trips.** Still open on the backend.

**5b. `loaded` is not in the frontend's status union**
([fleetTripService.ts:3](../src/services/fleetTripService.ts#L3)), so
`normalizeTripStatus` fell through to `planned` — a picked trip would be re-offered
"Mark Picked" and could reappear under New.

### Fix (defensive, frontend)

- `transportStatus` added to `FleetTripSummary`; it is the field the backend keeps
  correct on every transition.
- `tripEffectiveStatus(trip)` in
  [tripHelpers.ts](../src/app/(main)/transporter/_components/tripHelpers.ts) prefers
  `transportStatus` and falls back to `status` for older trips.
- `loaded` mapped to `picked` in `normalizeTripStatus`.
- [BookingTripsView.tsx](../src/app/(main)/transporter/_components/BookingTripsView.tsx)
  re-applies the tab's status client-side, so a tab only shows trips genuinely in that
  state, and the card timeline / "Mark …" button read the effective status.

### Verified

| Tab | Before | After |
|---|---|---|
| New | 0 | 0 |
| **Picked** | **4 (all delivered)** | **0** |
| On Transit | 0 | 0 |
| Delivered | 4 | 4 |

**The backend filter still needs fixing** — the frontend is now merely resilient to it.

---

## 6. `picked` writes an inconsistent status pair — MEDIUM

```
PATCH /api/transporters/fleet-trips/{id}/status {"status":"picked"}
  → { status: "loaded", transportStatus: "picked" }     ← disagree

PATCH … {"status":"on_transit"}
  → { status: "on_transit", transportStatus: "on_transit" }   ← consistent

PATCH … {"status":"delivered"}
  → { status: "delivered", transportStatus: "delivered" }     ← consistent
```

Only `picked` fails to update `status`. This is the direct cause of issue 5.

---

## 7. Trip status dropdown defaults to the current status — MEDIUM — ✅ FIXED **and VERIFIED 09 Aug**

### The bug, as observed

On a trip already in Picked, the "Update Trip Status" `<select>` defaulted to **Picked**
and the button read **"Mark as Picked"**. Clicking without touching the dropdown re-sent
the status the trip was already in — API `200`, toast *"Trip status updated!"*, nothing
changed. Captured live during the first delivery run:

```
[picked tab]  statusPicked=true  cta="Mark as Picked"
  -> 200 { status: "loaded", transportStatus: "picked" }   // no-op, reported as success
```

### Root cause — the same stale-field problem as #5

`StatusUpdateForm` already computes its options by slicing the lifecycle *after* the
current status, so the logic was right. It was being fed the wrong status:
`status={data.status}`, which is `"loaded"` on a picked trip. `normalizeTripStatus`
mapped that to `planned`, so the option list started at *Picked* and defaulted there.

### Fix

- `status={tripEffectiveStatus(data)}` in
  [TripDetailsModal.tsx](../src/app/(main)/transporter/_components/TripDetailsModal.tsx) —
  prefers `transportStatus` over the lagging `status`.
- The map/timeline header in the same file reads the effective status too.
- With `loaded` now aliased to `picked` (see #5), the options for a picked trip become
  `[On Transit, Delivered, Cancelled]` and the button reads **"Mark as On Transit"**.

### Verified — 09 Aug 2026, live UI, trip `6a788319714655ab6300d880`

Blocked for three sessions. Unblocked by creating a fresh fleet through the UI (§13), then
running the whole chain: buyer books it → `POST …/fleet/{id}/payments` 201 → admin approves
→ the response carried `fleetTripId: 6a788319714655ab6300d880`.

Then the trip was walked through every state (`w6-verify7.js`):

| Trip state | Dropdown default | Options offered | CTA |
|---|---|---|---|
| New | `picked` | Picked, On Transit, Delivered, Cancelled | "Mark as Picked" |
| **Picked** ← where the bug lived | **`on_transit`** | **On Transit, Delivered, Cancelled** | **"Mark as On Transit"** |
| On Transit | `delivered` | Delivered, Cancelled | "Mark as Delivered" |
| Delivered | *(none)* | *(none)* | *(none)* — terminal, correct |

**The picked row is the fix.** The current status is no longer in the option list at all, so
the no-op resubmission is now impossible rather than merely unlikely.

It also confirms the root cause and #5's mapping in one shot. Marking picked returned:

```
PATCH /api/transporters/fleet-trips/6a788319714655ab6300d880/status -> 200
      status=loaded   transportStatus=picked
```

`status` really does lag at `loaded` — the exact stale field that used to be passed as
`status={data.status}` and normalised to `planned`. With `tripEffectiveStatus(data)` the UI
reads `transportStatus`, treats `loaded` as `picked`, and starts the options at On Transit.

Full lifecycle driven New → Picked → On Transit → Delivered, every `PATCH` 200, zero console
errors. The script's guard allowed writes only to this trip id and explicitly blacklisted the
pre-existing trip `69ff4a66099795cd39d47d12`; it never fired.

---

## 7b. A fleet is never released after delivery — CRITICAL — backend, blocks new trips

Found while trying to verify #7. All five trips on the test transporter are `delivered`,
yet none of its four fleets can be booked again:

| Fleet | State | Booking attempt |
|---|---|---|
| North Route (Abia→Anambra) | `status: on_transit` — trip delivered | `409 already reserved or in use` |
| West Route (Oyo→Borno) | Space remaining **0.01 tons** | Pay not actionable |
| Olando (Kwara→Yobe) | `status: available` | `409 already reserved or in use` |
| North Route (Kaduna→Lagos) | Full load **0 tons** | Pay not actionable |

So a whole-truck fleet is bookable **exactly once in its lifetime**. In production this
takes a transporter out of business after their first delivery. Note Olando reports
`status: "available"` and still 409s, so the reservation is tracked separately from
`status` and outlives the delivered trip.

Full write-up and the requested backend change are in
[BACKEND-ISSUES-2026-08-07.md §2](./BACKEND-ISSUES-2026-08-07.md).

---

## 8. Booking page lists products from every order, not the selected one — MEDIUM — ✅ FIXED

Booking transport for a single order ("Book Transport (1)") renders
*"Products from your 1 selected order are pre-selected below"* and then lists products
from all ten transport-ready orders — Cocoa, claister, Corn ×2, millet ×2, Beans,
spageetii, rice, Garri.

The totals are computed correctly from the selected order only (5,000 kg, ₦250,000), so
this is presentational — but it makes the page impossible to trust at the moment the
buyer commits money.

### Root cause

[TruckDetailsAndShipProduct.tsx](../src/app/(main)/buyer/transporter-list/_components/BookingTransport/BookingHeader/TruckDetailsAndShipProduct.tsx)
built its list from `flattenOrderProducts(orders)` over *every* transport-ready order.
`pendingOrderIds` — the orders the buyer actually picked — was only used to pre-tick
checkboxes, never to scope the list.

### Fix

- The list is now scoped to the selected orders. Products from other orders sit behind an
  explicit *"Add products from your other orders (N)"* toggle — consolidating several
  orders onto one truck is a real flow, so it is kept, just not the default.
- The toggle cannot hide a row that is already ticked, so nothing counted in the totals
  can be off-screen.
- `setAllProducts` still receives the full list, so steps 2 and 3 resolve a selection from
  any order.
- If the pending ids match nothing (stale state, order not yet ready) it falls back to
  showing everything rather than rendering an empty list.

### Page to test

[`/buyer/my-orders?tab=awaiting`](http://localhost:3000/buyer/my-orders?tab=awaiting)
→ tick **one** order → **Book Transport (1)** → pick a transporter → **Book** on a fleet.
The landing page is `/buyer/transporter-list/booking-transporter/{fleetId}` — check the
*"I want to ship"* list under Summary.

Reach it by clicking, not by pasting the URL: the selected-order ids live in redux, and a
hard load of the booking URL has nothing to scope by (it then falls back to showing all,
by design).

### Verified — 08 Aug 2026, live UI

Selected one order out of 9 transport-ready orders holding 11 products between them:

```
selected order #22EEA034      (1 product: QA CLEAN1 Yellow Maize)
[scoped]   rows=1   ["QA CLEAN1 Yellow Maize"]
           toggle="Add products from your other orders (10)"
[expanded] rows=11  [… all 11 …]
banner="Products from your 1 selected order are shown and pre-selected below."
page errors: 0
```

Summary panel read Total Weight 50 kg, Transport Cost ₦694.50 — the selected order only.

---

## 9. Self-dealing is not blocked — MEDIUM

With one account holding all three roles, the backend accepted a bid where
`buyer === agent` (`6988b3b0e7c550daf1640bfb` on both sides), let the same user counter
their own bid, accept it, order from themselves, and transport it for themselves. Every
bid in this run has an identical buyer and agent id.

---

## 10. Smaller issues

| # | Issue |
|---|---|
| 10a | Bids stay in **Ready to checkout** after an order has been created from them — the tab still read `2` afterwards. **⚠️ Frontend fixed, backend still broken — see below.** |
| 10b | Agent's bids table shows stale status after Accept — the modal said *Accepted* while the table row still said *Pending* until a reload. **✅ FIXED** |
| 10c | Transporter's Transactions → Pending showed `0` / "No data available" while a pending fleet payment for them existed. They cannot see money owed. **✅ FIXED** |
| 10d | Product unit dropdown offers only `kg` and `tonne` ([ItemDetailsForm.tsx:329](../src/app/(main)/agent/_components/ItemDetailsForm.tsx#L329)) while live data uses `bags`, `packet`, `100kg_bag`. Matches NEW-4 in `BACKEND_RETEST_2026-08-04.md`. **✅ FIXED** |
| 10e | No fleet validation — one fleet reads *"Full Load: 400,000,000,000 tons"*, *"Per Kg: ₦0"*. **✅ FIXED (frontend guard)** |
| 10f | A new agent cannot list any product until they create a farmer first ([ItemDetailsForm.tsx:72](../src/app/(main)/agent/_components/ItemDetailsForm.tsx#L72)), with no on-screen explanation. **✅ FIXED** |
| 10g | Add-to-store modal closes on any outside click, discarding a part-filled form. **✅ FIXED** |

---

### 10a — order creation invalidated nothing — ⚠️ frontend fixed, backend outstanding

**Page to test:** [`/buyer/my-biddings?sub=ready`](http://localhost:3000/buyer/my-biddings?sub=ready)
→ tick a won bid → **Checkout**. Then watch the *Ready to checkout* pill and
[`/buyer/my-orders?tab=pending`](http://localhost:3000/buyer/my-orders?tab=pending).

**Root cause (frontend):** `useCreateOrder` had **no `onSuccess` at all** — creating an
order invalidated nothing, so the won-bids list, the bid tabs and the order lists were all
left stale. Same gap in `useCreateTransaction`, which refreshed the bids but not the order
lists, so the Pending Payment tab kept offering *"Complete payment"* for a payment already
submitted.

**Fix:** [useOrderQueries.ts](../src/hooks/queries/useOrderQueries.ts) now invalidates
`wonBidsCheckout`, `wonBids`, `myBids` and `orderKeys.lists()` after an order is created;
[useTransactionQueries.ts](../src/hooks/queries/useTransactionQueries.ts) invalidates
`orderKeys.lists()` after a transaction.

**Verified — 08 Aug 2026, live UI.** The refetch now fires:

```
POST /api/orders                        -> 201
GET  /api/buyers/biddings/won/checkout  ← was never happening before
GET  /api/buyers/biddings?status=countered|pending|rejected
```

The new order appeared under **Pending Payment** with no reload. **But the pill still read
`1`** — reading the refetch payload shows the server still returns the consumed bid:

```
won/checkout -> 200 bids=1
  bid 6a76dc3ea6133da574ba92d9  amount=1050 qty=10 status=accepted
  contains the bid we ordered from: TRUE
```

So the visible symptom needs a backend change — **item 10 in
[BACKEND-ISSUES-2026-08-07.md](BACKEND-ISSUES-2026-08-07.md)**. Until then the buyer can
check the same bid out repeatedly and create duplicate orders.

---

### 10b — table behind the bidders modal stayed stale — ✅ FIXED

**Page to test:** [`/agent/bids`](http://localhost:3000/agent/bids) → row ⋮ menu →
*View Bidders* → **Action** → *Counter* or *Reject* (these keep the modal open) → watch the
**Status** cell of the row behind the modal.

**Root cause:** the table was refetched only in the modal's `onClose`. Accept closes the
modal, but **reject and counter leave it open**, so the row behind kept its old status
until a reload.

**Fix:** [BiddersModal.tsx](../src/app/(main)/agent/bids/_components/BiddersModal.tsx)
takes an `onBidUpdated` callback, fired after every successful status change and wired to
`fetchBids` in [bids/page.tsx](../src/app/(main)/agent/bids/page.tsx).

**Verified — 08 Aug 2026, live UI.** Countering a fresh bid, modal still open:

```
PATCH /api/bids/6a76dc3e…        ← the action
GET   /api/bids/6a76dc3e…        ← modal's own refetch
GET   /api/bids?page=1&limit=10  ← NEW: the table refetch
row:  Pending → Countered         (no reload)
```

Note: verified via the counter path. The originally reported symptom was after *Accept*,
which already closed the modal and refetched — if a stale row is still seen specifically
after Accept, the remaining suspect is the backend's per-listing status, not this.

---

### 10c — transporter could not see their own fleet payments — ✅ FIXED

**Page to test:** [`/transporter/pending`](http://localhost:3000/transporter/pending) —
the **Pending** and **Approved** tabs.

**Root cause:** the page was fed `GET /api/transporters/transactions`, which returns
**product-order** transactions, not fleet payments. The table's own columns
(Fleet / IOT / Kg / Payment / Payer / Date) were already fleet-shaped — it was simply
wired to the wrong source.

Backend item 6 concluded that no transporter-scoped endpoint existed. That is **not quite
right** and worth correcting: there is no *aggregate* endpoint, but
`GET /api/transporters/fleet/{id}/payments` **is** transporter-scoped and works. Verified
08 Aug 2026 with a transporter token:

```
fleet 69a67ace… -> 200  payment ₦250,000, loadWeightKg 5000, status approved
fleet 69fb76bb… -> 200  payment ₦600,000
fleet 69c942bc… -> 200  payment ₦4,000,000
fleet 69bfd5b5… -> 403  "Not authorized for this fleet"   (not theirs — skipped)
```

**Fix:** `fleetService.getMyFleetPayments()` lists the transporter's own fleets and fans
out over that endpoint, folding the fleet record into each payment for the name/IOT the
table renders, and skipping any fleet that 403s. The new
`useTransporterTransactions()` hook merges fleet payments with the existing order
transactions, de-duplicates by id and sorts newest first; the page counts and both tabs
read from it.

An aggregate endpoint would still be better — this makes N+1 requests — so backend item 6
is worth doing, just re-scoped from "impossible" to "inefficient".

**Verified — 08 Aug 2026, live UI:**

```
Pending  0 -> 5      Approved  4 -> 8
[0] North Route Fleet ABC-123 | IOT-TRK-002 | 3,000 KG | ₦250,000   | rufai wale | 04/08/2026
[2] Olando ABC-123            | IOT-TRK-003 | 3 KG     | ₦4,000,000 | rufai wale | 29/07/2026
[3] West Route Fleet ABC-124  | IOT-TRK-004 | 30 KG    | ₦600,000   | rufai wale | 08/05/2026
page errors: 0
```

The 4 original product-order rows are preserved, not replaced — they show as
"Fleet" / "--" because that table has no columns for them.

---

### 10d — unit dropdown offered the wrong vocabulary — ✅ FIXED

**Page to test:** agent → **Add to store** → step 2 → the **Unit** dropdown and the field
below it.

**The actual vocabulary**, from `GET /api/products` on 08 Aug 2026 (20 products):

```
kg ×12    bags ×6    packet ×1    100kg_bag ×1
```

Three of the four could not be selected. `tonne`, the only non-kg option offered, is used
by **no product in the database**.

**Fix:** [productUnits.ts](../src/utils/productUnits.ts) holds the vocabulary in one
place. The dropdown renders from it.

There was a second, more expensive half to this. Transport prices by weight as
`unitWeightKg × quantity`, and falls back to treating the quantity as kilograms when the
weight is missing — so "50 bags" with no unit weight ships as if it were 50 kg. Three of
the six `bags` products in the database have no `unitWeightKg`. The field was optional and
mislabelled *"Unit Weight (bags)"*, which reads as a weight expressed in bags.

So: the field is now **required** for any unit whose weight is not fixed by its name
(`bags`, `packet`), auto-filled for the ones where it is (`kg`→1, `100kg_bag`→100,
`tonne`→1000), relabelled *"Weight of one bag (kg)"*, and carries an explanation of what
goes wrong without it.

**Verified — 08 Aug 2026, live UI:**

```
unit options: kg | bags | 100kg_bag | packet | tonne
bags       -> label "Weight of one bag (kg) *"   value ""
              hint  "Transport is priced by weight — without this, 50 bags would be
                     shipped as if they weighed 50 kg."
100kg_bag  -> label "Weight of one 100kg bag (kg)"  value "100"   (auto-filled)
submit with bags + blank weight -> blocked: "Enter how many kg one bag weighs"
POST /api/products fired: 0
```

---

### 10e — no fleet capacity or price validation — ✅ FIXED (frontend guard)

**Page to test:** transporter → **Add Fleet** → the **Price** and **Capacity** fields.

**Root cause:** validation was presence-only — `formData.price !== ""` passes for `"0"`,
and any non-empty string passed for capacity. That is how a fleet came to advertise
*"Full Load: 400,000,000,000 tons"* at *"Per Kg: ₦0"*.

**Fix:** capacity must parse to a number greater than 0 and at most **100 tonnes**
(generous — the largest road freight in use is well under it, but it stops a typo becoming
a listing); price must be greater than ₦0. Both render inline errors and block submission,
and the submit toast now names the actual problem instead of "fill in all required fields".

This is a client-side guard only — the API still accepts these values directly, so
**backend item 8 still stands.**

**Verified — 08 Aug 2026, live UI:**

```
capacity "400000000000 tons" -> "That is 400,000,000,000 tons — the maximum is 100"
price    "0"                 -> "Enter a price greater than ₦0"
capacity "20 tons" + price 150000 -> both errors clear
```

---

### 10f — the invisible farmer prerequisite — ✅ FIXED

**Page to test:** agent → **Add to store**, as an agent with no farmers.

**Root cause:** a product cannot be listed without a farmer, but a brand-new agent has
none — and the picker just sat there empty. Opening the dropdown said *"No farmers found
matching """*, which reads as a search miss rather than "you have no farmers".

**Fix:** when the agent has zero farmers the modal shows an explanation and a link
straight to `/agent/farmers`; the dropdown's empty text distinguishes "you have none" from
"your search matched none".

**Verified — 08 Aug 2026, live UI** (farmers endpoint stubbed empty to simulate a new
agent):

```
notice: "You need to add a farmer before you can list a product — every product is
         tied to the farmer who grew it."
cta   : "Add your first farmer →" -> /agent/farmers
dropdown: shows "You have no farmers yet" instead of "No farmers found matching"
```

---

### 10g — add-to-store modal discarded a part-filled form — ✅ FIXED

**Page to test:** any agent page → sidebar **Add to store** → type a product name → click
the dark backdrop, or press <kbd>Esc</kbd>.

**Fix:** [AddToStore.tsx](../src/app/(main)/agent/_components/AddToStore.tsx) routes the
backdrop click and <kbd>Esc</kbd> through `requestClose()`, which raises a *"Discard this
item?"* prompt whenever anything is filled in. An empty form still closes silently. The
form is also reset after a successful save, so a saved product does not linger as a draft.

**Verified — 08 Aug 2026, live UI.** Five cases, all passing:

| Case | Result |
|---|---|
| empty form + backdrop click | closes silently, no prompt |
| part-filled + backdrop click | prompt shown, modal stays |
| *Keep editing* | form intact (`"Draft Millet 900"` still there) |
| <kbd>Esc</kbd>, then <kbd>Esc</kbd> again | first asks, second dismisses the prompt and keeps the form |
| *Discard* | closes, and reopening starts blank |

---

## 11. Buyer surface sweep — 08 Aug 2026

Everything on the buyer side that the original run never touched, driven through the real
UI as the buyer. **No fixes applied yet — this is findings only.**

### What works (verified, no action needed)

| Area | Evidence |
|---|---|
| Wishlist add / remove / persist | `POST /api/wishlist` → heart fills, count 3→4, survives reload; `DELETE /api/wishlist` → back to 3 |
| Seller & transporter filters — rating | `GET /api/sellers?rating=5` → 5 cards drop to 3; `rating=1` → 4 |
| Filters — location | `state=Zamfara` / `location=Zamfara` → 0 cards, correctly |
| Filters — years | `yearsOfExperience=6` applied and combined with location |
| Track orders | 4 tabs with counts; delivered cards show transporter, IOT, model, Picked/On Transit/Delivered timeline |
| Confirm receipt | `POST /api/orders/6a7627100a1730442be69616/confirm-receipt` → 200, `receiptConfirmed: true` |
| Leave a review | Submit correctly disabled until rating **and** comment; proper `radiogroup` + per-star `aria-label`; duplicate 409 handled with a toast and a "reviewed" state |
| Follow / unfollow | `POST …/follow` → 201, `DELETE …/follow` → 200, label toggles Follow ↔ Following |
| Negotiate (fleet bid) | `POST /api/transporters/fleet/{id}/bids` → 201 |
| Shipping & Delivered, sellers list, store page | Render correctly with real data |

Across every buyer page: **zero API errors, zero console errors.**

### Bugs found

**11a. A buyer cannot withdraw or cancel a fleet bid — MEDIUM**

The Fleet Bids tab renders bids but offers **no actions whatsoever** — the only buttons on
the page are the two tab switches. Two bids have sat `Pending` for 20 days with no way to
withdraw them.

Product bids have `DELETE /api/bids/{id}`; `bidService.withdrawBid` notes fleet bids have
no equivalent route. So this needs a backend endpoint first — logged as a gap, not a
frontend defect.

**11b. Fleet bids list is stale after placing a bid — MEDIUM — ✅ FIXED 08 Aug**

After `POST …/fleet/{id}/bids` returns 201, the app navigates to the Fleet Bids tab and
the new bid **is not there**. It only appears after a manual reload:

```
immediately after 201 : ["₦50,000", "₦50,000"]          ← the new bid missing
after reload          : ["₦120,000", "₦50,000", "₦50,000"]
```

Same family as 10a/10b — a mutation that does not invalidate the list it feeds.

### Root cause

[useTransporterQueries.ts:134](../src/hooks/queries/useTransporterQueries.ts#L134) —
`useCreateFleetBid` had no `queryClient` at all: `onSuccess` fired a toast and nothing
else. Two things then conspired to hide the new bid:

1. nothing invalidated `transporterKeys.fleetBids()`, and
2. `useBuyerFleetBids` sets `staleTime: 3 * 60 * 1000`, so the navigation to the Fleet
   Bids tab served the 3-minute-old cache instead of refetching.

The sibling mutations on the same list (`useRespondToFleetBid`,
`useCreateFleetPayment`) already invalidated it — only the create path was missed.

### Fix

Invalidate `transporterKeys.fleetBids()` in the hook's `onSuccess`. Because
`fleetBids()` is a key *prefix* of `fleetBidsForFleet(fleetId)`, this also refreshes the
transporter-side view of bids on that fleet, which had the same staleness.

The invalidation is placed in the hook rather than the caller: the hook's `onSuccess`
runs before the component's, so the refetch is already in flight when
[Negotiate.tsx:74](<../src/app/(main)/buyer/transporter-list/_components/BookingTransport/BookingHeader/Negotiate.tsx#L74>)
navigates 1.5s later.

### Page to test

`/buyer/my-orders?tab=awaiting` → pick an order → **Book Transport** → a fleet →
**Negotiate** → amount → **Send Request**. The app lands on
`/buyer/my-biddings?tab=fleet-bids`; the new bid must be present with no reload.

### Verified — 08 Aug 2026, live UI (`v11b.js`)

Bid of **₦137,500** on North Route Fleet `69a67ace96f7df1573952158`:

```
BEFORE bids           : ["₦120,000","₦50,000","₦50,000"]
POST /api/transporters/fleet/69a67ace96f7df1573952158/bids -> 201
new bid appeared without reload: true after 0.1s
AFTER (no reload)     : ["₦137,500","₦120,000","₦50,000","₦50,000"]
AFTER reload          : ["₦137,500","₦120,000","₦50,000","₦50,000"]
PASS — 11b fixed (bid appears with no reload)
```

0.1s means the row was already rendered when the tab mounted, not filled in by a later
refetch. The no-reload and post-reload lists are identical. The script routed every
request through the order-mutation guard; it blocked nothing, because the flow attempts
no order write.

**11c. Follower count does not update after following — LOW**

Following a seller flips the button to *Following* (201 confirmed), but the counter next
to it stays at **0 followers**. Only the button reflects the change.

**11d. A seller can only ever be reviewed once, not once per order — MEDIUM**

Every delivered order shows *Leave a review*. Submitting a second one for a different
order returns:

```http
POST /api/reviews -> 409
{"success":false,"message":"You have already reviewed this user","hasReviewed":true,
 "data":{ "rating":5, "comment":"self review probe", "createdAt":"2026-08-06" }}
```

The frontend handles this gracefully, so it is not broken — but the button is offered on
every delivered order and can only ever succeed for the first one. Either the review
should be per-order, or the button should not be offered once the buyer has reviewed that
seller. **Product decision needed.**

**11e. An out-of-stock product is labelled "Available" — LOW**

In the wishlist, `rice` shows *"Quantity: 0 100kg_bag"* and *"₦60,000,000"* with an
**Available** badge. Zero quantity should not read as available.

**11f. Header "My Biddings" count ignores fleet bids — LOW**

The nav badge reads `0` while three fleet bids sit pending. It tracks product bids only.
Minor, but the badge is the buyer's only cue that something needs attention.

### ⚠️ Withdrawn 09 Aug — this is not a bug

On a closer read of [SubNavbar.tsx:79-84](../src/components/nav/SubNavbar.tsx#L79-L84), the
badge **already includes fleet bids** and is behaving correctly:

```tsx
const { data: counteredProductBids } = useCounteredBids(1, 10, isLoggedIn);
const { data: fleetBids = [] } = useBuyerFleetBids();
const counteredCount =
  (counteredProductBids?.pagination.total ?? 0) +
  (fleetBids?.filter((b) => b.status === "countered").length ?? 0);
```

The badge counts bids **that need the buyer's response** — `countered` ones — for products
*and* fleets. The three bids observed were `pending`, i.e. waiting on the *transporter*, so
they correctly require no buyer action and correctly do not appear. `MyFleetBids` agrees: it
separates `counteredBids` (which get Accept/Reject buttons) from `otherBids` (which get
none).

My original note — "the badge is the buyer's only cue that something needs attention" —
argued against itself: a pending bid needs no attention. No code change made. The 11b fix
does mean this query is now kept fresh, so a *countered* fleet bid will show up promptly.

**11g. A confirmed order silently vanishes from Track Orders — LOW**

After confirming receipt the Delivered tab went **4 → 3** and the order disappeared, with
no "receipt confirmed" state shown anywhere. The buyer gets no acknowledgement that the
thing they just did had an effect beyond the row disappearing.

**11h. The wishlist heart is not keyboard reachable — LOW (accessibility) — ✅ FIXED 08 Aug**

[BidingCard.tsx:125](../src/components/cards/BidingCard.tsx#L125) — the toggle is a bare
`<div onClick>` with no `role`, no `aria-label`, no `tabIndex`. It cannot be reached or
activated by keyboard, and a screen reader announces nothing. It should be a `<button>`
with `aria-pressed`.

### Fix

`<div onClick>` → `<button type="button">` with:

- `aria-label` naming the product *and* the action — `Add QA CLEAN1 Yellow Maize to
  wishlist` / `Remove … from wishlist`. Cards appear in grids of 29+ on `/buyer`, so a
  bare "Add to wishlist" would give a screen reader 29 identical controls.
- `aria-pressed={localWishlisted}` so the state is announced, not just painted via
  the svg `fill`.
- `aria-hidden="true"` + `focusable="false"` on the decorative svg.
- `disabled` while the mutation is in flight, replacing the old
  `pointer-events-none` (which stops a mouse but not a keyboard).
- a `focus-visible` outline — it had no focus style, because it could never hold focus.

### A third instance, found while fixing this

`TruckCard` was already a correct button. But
[ProductInfo.tsx:82](<../src/app/(main)/buyer/_components/ProductDetails/productAndSellersInfo/ProductInfo.tsx#L82>)
— the heart on the product detail page — is a `<button>` whose only accessible name came
from a `title` tooltip, with no `aria-pressed`, so a screen reader never announced
whether the product was wishlisted. Given the same `aria-label` / `aria-pressed` /
`aria-hidden` treatment. Not in the original 11h report; it is the same defect class and
was fixed in the same pass.

### Page to test

`/buyer` (29 cards), any wishlist/store/similar-products grid, and
`/buyer/product/{id}` for the third instance.

### Verified — 08 Aug 2026, live UI (`v11h.js`)

```
wishlist buttons found on /buyer: 29
tag=BUTTON  type=button  tabIndex=0  svg aria-hidden=true
aria-label "Add QA CLEAN1 Yellow Maize to wishlist"   aria-pressed "false"
focusable via .focus(): true
reachable by Tab within 120 stops: true
Enter  -> POST /api/wishlist -> 201   aria-pressed false→true,
          label becomes "Remove QA CLEAN1 Yellow Maize from wishlist"
Space  -> DELETE /api/wishlist -> 200  aria-pressed true→false
restored to original state: true
PASS — 11h fixed
```

Tab-reachability was tested by walking focus from the top of the document, not just by
calling `.focus()` — programmatic focus would have passed even on a `tabIndex`-less
element. Both Enter and Space activate. The wishlist entry added during the test was
removed again, so this is net zero.

**11i. Delivered tracking shows "Est date: N/A" — LOW**

The estimated-delivery field is empty on delivered orders. Cosmetic, but it is on the
tracking panel the buyer looks at most.

### Test data created by this sweep

| Kind | Id / detail |
|---|---|
| Fleet bid | ₦120,000 on North Route Fleet `69a67ace96f7df1573952158`, pending |
| Receipt confirmation | order `6a7627100a1730442be69616` marked `receiptConfirmed` |
| Follow | followed then unfollowed seller `696f6c0a719a3fcdb97c3e16` — net zero |
| Wishlist | one product added then removed — net zero |

No pre-existing order was touched. The confirm-receipt call was routed through a guard
that aborts any request aimed at an order outside this test run; it fired once, for the
allowed order.

---

## 12. Agent surface sweep — 08 Aug 2026

The agent role, which had never been tested at all. Recon of all 11 pages first, then
interactions, driven through the real UI as the agent. **A product has now been listed
end to end through the UI for the first time.**

Every script routed its requests through a guard that aborts any order write and anything
aimed at the FORBIDDEN Garri order; product writes were further restricted to products
this testing effort created. The guard never fired — no flow attempted a forbidden write.

### Recon — all 11 pages

| Page | Rows | Backend | Notes |
|---|---|---|---|
| `/agent` | 1 | all 200 | 6 dashboard endpoints (overview, most-sold-categories, most-sold-items, revenue, out-of-stock, top-customers) |
| `/agent/produce-list` | 10 | all 200 | Active 11 / Out of Stock 2, pager 1–2 |
| `/agent/new` | 2 | all 200 | |
| `/agent/bids` | 10 | all 200 | |
| `/agent/pending` | 2 | all 200 | |
| `/agent/received` | 16 | all 200 | |
| `/agent/packed` | 9 | all 200 | |
| `/agent/delivered` | 3 | all 200 | |
| `/agent/farmers` | 4 | all 200 | |
| `/agent/customers` | 1 | all 200 | |
| `/agent/reviews` | 0 | all 200 | renders as cards, not a table — 0 rows is not an empty state |

**No page redirected, returned 4xx, or threw.** The only console errors across the whole
surface were three 404s for one broken image (12g).

### What works (verified, no action needed)

| Area | Evidence |
|---|---|
| **Product listing, end to end** | `POST /api/products` → **201**, product `6a7788c8ba0438019d691431` |
| Step-1 validation | Next with nothing filled → `["Please select a farmer","Please enter a product name","Please select a category"]`, stays on step 1 |
| Farmer picker | 4 farmers listed with phone numbers, selection fills the field |
| Category / subcategory | Category list now comes from the API (7: Grains, Tubers, Vegetables, Fruits, Livestock, Meat, Edible); picking Grains turns subcategory into a dependent `<select>` (Rice, Maize, Beans, Millet, Sorghum) — the 10d fallback path is no longer being used |
| Image attach | file → 1 blob preview, `images: [...]` in the payload |
| Step-2 validation | submit empty → `["Enter a valid quantity","Description is required","Enter a valid price"]` |
| Unit auto-fill | kg→1, 50kg bag→50, 100kg bag→100, tonne→1000 |
| 10d unit-weight gate | with `bags` selected, submit blocked: *"Enter how many kg one bag weighs"* |
| New product in the list | visible **without a reload** — `useCreateProduct` invalidation is correct |
| Produce list tabs | Active 10 rows ↔ Out of Stock 2 rows |
| Search | `"QA AGENT4"` → 1 row; nonsense → 0 rows + *"No products found — Add your first product to get started"* |
| Price filter | ₦1000–3000 → 5 rows, all genuinely in range |
| Pagination | page 1 = 10 rows, page 2 = 9, contents differ, Previous returns to the identical page 1 |
| Row action menu | Edit / Delete |
| **Farmer onboarding** | `POST /api/farmers` → **201**; all 7 required fields validated on empty submit; list **4 → 5 without a reload**; persists after reload; zero errors |
| **Product edit + save** | `PUT /api/products/{id}` → 200; ₦2,500→2,750 and qty 40→45; table updated **without a reload**; persisted |
| **Active → Out of Stock** | status `<select>` in the Edit modal → `PATCH {status:"out_of_stock"}` 200; Active 13→12, Out of Stock 2→3; product appears on the Out of Stock tab |
| **Restock** | bulk `PATCH /api/products/bulk/status {status:"available"}` 200; Active 12→13, OOS 3→2 — a clean round trip |
| **Bulk delete** | `POST /api/products/bulk/delete` 200 carrying **only** the intended id; row gone before and after reload; Active 13→12 |
| Destructive confirmations | Both are properly worded with counts — *"1 product will be permanently deleted. This cannot be undone."* / *"Yes, restock 1"*, each with a Cancel |

### Bugs found

**12a. The product-create API rejects units its own data uses — HIGH — ✅ frontend fixed, backend outstanding**

Listing a product with unit **Bag** — a value 6 live products already use — fails:

```http
POST /api/products   { "unit": "bags", ... }
-> 400 {"error":"Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"}
```

Tallied against live data (`GET /api/products?limit=200`, 22 products, 08 Aug):

| unit | products | accepted by `POST /api/products` |
|---|---|---|
| `kg` | 13 | ✅ |
| `bags` | 6 | ❌ |
| `100kg_bag` | 2 | ✅ |
| `packet` | 1 | ❌ |
| `50kg_bag` | 0 | ✅ (offered by nothing, used by nothing) |
| `tonne` | 0 | ✅ |

**7 of 22 products — 32% — could not be re-created through the API that serves them.**

This is the other half of 10d. 10d widened the dropdown to the four units observed in
`GET /api/products`, which was the right diagnosis of the wrong contract: the create
endpoint validates against a *different* vocabulary. Before 10d the picker offered only
`kg` and `tonne`, both valid, so the mismatch was invisible.

**Frontend fix.** `productUnits.ts` now records `acceptedByCreateApi` per unit and exports
`CREATABLE_PRODUCT_UNITS`; the picker offers only units that can actually be saved.
Offering "Bag" and watching every submission 400 is worse than not offering it. The full
`PRODUCT_UNITS` list is retained so a legacy `bags` product still resolves its label and
unit weight. **Flip `bags`/`packet` to `acceptedByCreateApi: true` and they return to the
dropdown** — one line each, once the backend is fixed.

**Confirmed 09 Aug — `PATCH` and `PUT` share the same validator**, tested directly against
the API on a product this effort created. `PATCH {price}` → 200, but `PATCH {unit:"bags"}`
and `PUT {unit:"bags"}` both → the same 400. The 7 legacy products are editable today
*only* because the frontend's `UpdateProductData` omits `unit` entirely. They cannot have
their unit corrected, and a read-modify-write against `PUT` — which the spec documents as
"Replace/update product" taking the **full** `Product` schema — 400s on all of them.

And the spec documents a **third** vocabulary: `openapi.yaml` says `kg`, `ton`, `bag`, with
`unit` typed as a bare `string` and **no `enum` anywhere**. So: documented `kg/ton/bag`,
enforced `kg/tonne/50kg_bag/100kg_bag`, stored `kg/bags/100kg_bag/packet` — only `kg`
appears in all three.

**Backend must still reconcile them** — logged as backend issue 11. Note the knock-on:
with `bags` and `packet` gone, every remaining unit has a fixed weight, so the 10d
`unitWeightKg` gate is now **dormant** — still correct, still proven (it blocked the
`bags` submission above), but no currently-offered unit exercises it.

Verified after the fix (`a3-verify-units.js`):

```
units offered: ["kg","50kg_bag","100kg_bag","tonne"]
offered but rejected by the create API: []
PASS — every offered unit is accepted by the create API
```

**12b. The Edit Product modal blocks the whole form behind a slow refetch — MEDIUM**

Clicking **Edit** shows *"Edit Product — Loading latest details…"* and nothing else for
**9–14 seconds**, then renders the form correctly:

```
[log] 📝 Editing product: 6a7788c8ba0438019d691431
[log] 🚀 Fetching product details for 6a7788c8ba0438019d691431
  -> GET /api/products/6a7788c8ba0438019d691431
  <- 200      (9s later)
```

It is not broken — it is slow, and it did not have to wait. The modal is handed the row's
product (`initialProduct`), and
[EditProductModal.tsx:50](<../src/app/(main)/agent/produce-list/_components/table/EditProductModal.tsx#L50>)
already falls back to it, but the render gates on the fetch anyway:

```tsx
{isFetching && !fetchedProduct ? <spinner/> : <form/>}
```

Name, price, quantity and category are all in the table row, so the form could render
immediately and refresh in place. **Not changed here on purpose:** rendering from list
data means the `formData` sync effect can overwrite input the agent has already typed when
the fetch lands, and getting that right needs a dirty-field check. Flagging rather than
half-fixing it.

Worth noting the backend side too: 9s for a single product by id is slow enough that this
is visible on every edit.

**12c. Prices labelled in dollars on a Naira marketplace — LOW — ✅ FIXED**

`Min Price ($)` / `Max Price ($)` on the produce-list filters (both the Active and
Out-of-Stock variants) and `Price ($)` in the Edit Product modal. Every other price in the
app is `₦`, including the Add-to-store form two clicks away. Three files, now `₦`.

**12d. "Weight of one kilogram (kg) (kg)" — LOW — ✅ FIXED**

The unit-weight field appends "(kg)" to a label that already carries its own
parenthetical, so selecting **Kilogram (kg)** produced *"Weight of one kilogram (kg)
(kg)"*. Introduced with 10d. Now strips the trailing parenthetical for prose use, applied
to the label, the placeholder, the helper text and the validation message. Verified across
all four offered units — no doubling.

**12e. A failed product create showed two toasts, the useful one buried — LOW — ✅ FIXED**

The 400 above produced *both* `"Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"`
(from `useCreateProduct.onError`) and then `"Failed to create product. Please try again."`
(from the component's catch) — the generic one landing second and burying the actionable
one. Worse, a Cloudinary failure reported "Failed to create product" when the product had
never been attempted.

Each layer now reports only what it uniquely knows: media upload failures get their own
message and return early, and API failures are left to the hook, which already has the
server's own wording.

**12f. The Add-to-store modal had no focus management at all — MEDIUM (a11y) — ✅ FIXED 09 Aug**

Reported first as "the `×` is a bare `<div onClick>`", which it was. Converting it to a
button exposed the larger problem: **the dialog never received focus**, so the button
still could not be reached. Measured with `a11-focus-probe.js`:

```
activeElementOnOpen        : BUTTON "+ Add Item"    ← the trigger, OUTSIDE the modal
activeElementIsInsideModal : false
focus first entered the modal after 57 tabs
first 14 tab stops         : Produce list, Farmers, Bids, Orders, Pending, Received,
                             Customers, Reviews, Chat, Help, "I am looking for…",
                             + Add Item, Active, Out of Stock      ← all behind the modal
bodyStillScrollable        : visible
```

A keyboard or screen-reader user opened the dialog and was left outside it, having to Tab
57 times across the page the dialog was covering. The panel also had no `role="dialog"`,
so it was not announced as a dialog — only the *inner* discard prompt had
`role="alertdialog"`.

### Fix

- `×` is now a `<button type="button">` with `aria-label="Close item upload"` and a
  focus-visible ring.
- The panel gets `role="dialog"` + `aria-modal="true"` + a static `aria-label`. Static
  rather than `aria-labelledby` because step 1 is headed *"Item upload"* and step 2
  *"Item Details"* — any single heading id would dangle on the other step.
- On open: focus moves to the close button, the previously focused element is remembered,
  and `body` scroll is locked. On close: scroll is restored and focus returns to whatever
  opened the dialog.
- **Tab is trapped** within the panel, wrapping at both ends, and Shift+Tab from the first
  element goes to the last. The discard prompt lives inside the panel so it is covered by
  the same trap.

### Verified — 09 Aug 2026, live UI

```
activeElementOnOpen        : BUTTON "Close item upload"
activeElementIsInsideModal : true
bodyStillScrollable        : hidden
focus first entered the modal after 1 tabs      (was 57)
first tab stop             : "Search farmer by name..."   ← the first real field
close control reachable by Tab: true
modal closed by keyboard      : true
```

Escape still works and still routes through the discard confirmation (10g).

**12g. Broken avatars, and a placeholder asset that was never committed — MEDIUM — ✅ FIXED 09 Aug**

The only console errors on the entire agent surface:

```
404  image  https://res.cloudinary.com/do8rhsyvi/image/upload/v1/test_avatar.png
     on /agent  and  /agent/customers
```

That URL is not in the codebase — it is the account's stored avatar, i.e. bad data. But
product images have an `onError` placeholder fallback
([BidingCard.tsx:123](../src/components/cards/BidingCard.tsx#L123)) and avatars did not, so
a broken avatar rendered as a broken image.

### The bigger find: the fallback itself was missing

While fixing this: `/images/placeholder-avatar.png` is the avatar fallback in **13 places
across 9 files** — `agent/bids`, `BiddersModal`, and **7 admin screens** (`active`,
`all-users/[id]`, `fleet-payments` ×2, `removed`, `suspended`, `transactions`) — and **the
file did not exist**:

```
/images/placeholder-avatar.png  -> 404
/images/bidder1.png            -> 200
/images/leadingavatar.png      -> 200
```

So every `src={user.avatar || "/images/placeholder-avatar.png"}` in the app fell back to a
404. Any user without an avatar rendered broken, across the whole admin user-management
surface. The asset was simply never committed.

### Fix

1. **Added `public/images/placeholder-avatar.png`** — a generated 128×128 neutral avatar
   (grey disc, head-and-shoulders glyph, transparent corners, 656 bytes). This alone
   repairs all 13 existing references.
2. **Added [`src/components/ui/Avatar.tsx`](../src/components/ui/Avatar.tsx)** — wraps
   `next/image` and falls back on `onError`, not just on a null `src`, with a guard so a
   failing fallback cannot loop. Used on the three customer avatars
   (`TopCustomers`, `agent/customers/page`, `CustomerInfoModal`).

The remaining 10 references still use the plain `src || fallback` form; they are no longer
broken now the asset exists, and can be migrated to `Avatar` opportunistically.

### Verified — 09 Aug 2026, live UI

```
/images/placeholder-avatar.png -> 200 (656 bytes)
/agent            avatar img: placeholder-avatar.png  naturalWidth 128  broken: false
/agent/customers  5 imgs, broken: []                  naturalWidth 128
```

**Honest limitation:** the browser still *requests* `test_avatar.png` and still logs its
404 — `onError` is by definition after the failure. What changed is that the user now sees
a clean placeholder instead of a broken image. Removing the request needs the bad URL
cleaned up in the backend data.

**12h. A product could be listed with no image at all — MEDIUM — ✅ FIXED 09 Aug**

Step 1 validated farmer, name and category but never media, and `handleSubmit` sent
`images: []` happily — `POST /api/products` returned 201 for a listing with no photograph.
Buyer cards fall back to a placeholder, so the listing looks broken rather than absent.

**Product owner's decision: at least one image is required.** Enforced in step 1, which is
the step that owns the media picker:

- `handleNext` refuses to advance with `imageFiles.length === 0`, message *"Please add at
  least one image of the product"* rendered with `role="alert"`;
- the error clears the moment an image is attached;
- the section label is marked `*`, via a new `imagesRequired` prop on `MediaUpload` —
  `MediaUpload` is shared with the Edit Product modal, where images are **not** required
  because the product already has them, so the asterisk is opt-in rather than hardcoded.

Verified in the live UI (`a8-image-required.js`):

```
images label: "Upload Images (Unlimited) *"
without an image: error + role=alert "Please add at least one image of the product",
                  onStep1=true  onStep2=false        ← Next refused
after attaching : no alerts, 1 preview
advanced to step 2 with an image: true
PASS — an image is now required to list a product
```

**This is a client-side guard only.** It stops this form; it does nothing about direct API
calls or any other client. The server-side rule is logged as **backend issue 12** and is
still needed.

### Test data created by this sweep

| Kind | Id / detail |
|---|---|
| Product | `6a7788c8ba0438019d691431` — QA AGENT4 White Maize. **Now ₦2,750 × 45 100kg_bag** after the edit-save test; taken out of stock and restocked (net zero) |
| Product | ~~QA AGENT3 Yellow Sorghum~~ `6a77883466751dac94d2b17d` — created while the script mis-ordered its 10d probe, then **deleted** as the bulk-delete test subject. Net zero. |
| Farmer | QA Sweep Farmer 08Aug, `+2348033344455`, Kano / Fagge |
| Fleet bid | ₦137,500 on North Route Fleet `69a67ace96f7df1573952158` (11b verification) |

Both products carry the stubbed Cloudinary image URL, because `api.cloudinary.com` is
DNS-blocked here — **real image upload is still untested**. No product was edited or
deleted; no order was touched.

---

## 13. Transporter surface sweep — 09 Aug 2026

The transporter role. Recon of all 11 pages first, then the three paths that had never been
exercised: **drivers**, **Create Trip**, and **Add Fleet submission**.

All scripts routed requests through a guard blocking order writes, product writes and every
`DELETE`. It never fired.

### Recon — all 11 pages

`/transporter`, `/fleet-list`, `/drivers`, `/new`, `/picked`, `/on-transit`, `/delivered`,
`/pending`, `/negotiations`, `/customers`, `/reviews`.

**Every page renders, every backend call returned 200, nothing redirected, nothing threw.**
`/new`, `/picked` and `/on-transit` are empty ("No trips in this status") — correct, see
13b. `/pending` correctly issues one per-fleet `GET /api/transporters/fleet/{id}/payments`
for each of the 4 fleets (fix 10c still holding).

*Note on the recon log:* the `/transporter` row also lists `GET /api/agents/dashboard/*`
calls. That is an artefact of the harness — `switchRole` visits `/register-as` and `/agent`
while the log label is still `/transporter`. Not role leakage.

### What works (verified, no action needed)

| Area | Evidence |
|---|---|
| **Driver onboarding** | `POST /api/transporters/drivers` → **201**, driver `6a786bf2a047ef91ebdc4ec5`; empty submit blocked with *"Full name / Phone number / License Number is required"*; list **2 → 3 without a reload**; persisted; zero errors |
| Driver row actions | Edit / Remove / Assign Fleet |
| **Add Fleet — submitted for the first time** | `POST /api/transporters/fleets` → **201**, fleet `6a786e7bd9239f0a4de4eb3c`; all 8 fields marked required are enforced; at least one image required; appeared in the list **without a reload** |
| Add Fleet capacity/price guards | 10e still holding — submit gated on `capacityError` / `priceError` |
| **Create Trip — correct behaviour** | Modal loads all 4 fleets, fetches each one's confirmed bookings, labels those already dispatched *"already on a trip"*, **disables their checkboxes**, and keeps "Create trip" `disabled` until a selectable booking is ticked. Clicking a disabled checkbox does nothing. See 13b for why it can't complete |
| Fleet list | 5 fleets with IOT, route, status, price, date; statuses `available` / `on_transit` / `under_maintenance` render distinctly |

### Bugs found

**13a. Nine referenced image assets did not exist — MEDIUM — ✅ FIXED 09 Aug**

Recon logged **340 image 404s** across the transporter surface. Auditing every
`/images/…` reference in the codebase against `public/images/` found **9 referenced files
missing**, used in ~44 places:

| Missing asset | References | Where it hurts |
|---|---|---|
| `/images/placeholder.png` | 15 files | buyer bids/orders/wishlist/store, agent bids & reviews, transporter reviews, shared `Reviews` |
| `/images/placeholder-avatar.png` | 13 places / 9 files | agent bids, `BiddersModal`, **7 admin screens** — fixed under 12g |
| `/images/placeholder-product.jpg` | 6 files | agent transaction tables & detail modal |
| `/images/agent-icon.png`, `buyer-icon.png`, `transporter-icon.png` | 6 places / 2 files | **`/register-as` and `/add-role` — the role picker every user meets** |
| `/images/profile1.png` | 3 files | leading-bidder avatar on product cards |
| `/images/AlmostFull.png`, `/images/EmptyTruck.png` | 1 each | truck image fallback |

Every one of these is a *fallback* — the "no image available" path. So the app's entire
degradation strategy was itself broken: a product with no photo, a user with no avatar, or
a truck with no image rendered a broken image rather than a placeholder. The role-selection
screen showed **three** broken images.

### Fix

- **Generated `public/images/placeholder.png`** — a 400×300 neutral "no image" graphic
  (grey field, mountains-and-sun glyph, framed). Repairs all 15 references.
- **Generated `public/images/placeholder-avatar.png`** under 12g (128×128 neutral avatar).
- **Repointed the role icons at assets that already existed** — `AsABuying.png`,
  `AsAAgent.png`, `AsATransporter.png` were sitting in `public/images/` unused, and are
  clearly the intended photographs (a grower in a field, a driver in a cab). No new art
  needed; the code was simply pointing at the wrong filenames.
- **Repointed** `placeholder-product.jpg` → `placeholder.png`, `profile1.png` →
  `placeholder-avatar.png`, and `AlmostFull.png` / `EmptyTruck.png` → the existing
  `transportTruck.png`.

### Verified

```
audit: all 103 referenced images now exist   (was 9 missing)
```

**13b. Create Trip cannot be completed — every confirmed booking is already on a trip — HIGH (backend)**

The Create Trip UI is correct (see the table above), but there is nothing for it to
dispatch. All four fleets, probed one by one:

```
West Route Fleet  69fb76bbe9b0c1859d580c5d  checkbox disabled=true  "claister • 5kg • already on a trip"
Olando            69c942bcf41a272cfa476795  checkbox disabled=true  "Sweet Potatoes…, QA CLEAN1… • 1100kg • already on a trip"
North Route Fleet 69a67ace96f7df1573952158  checkbox disabled=true  "Premium White Maize… • 5000kg • already on a trip"
North Route Fleet 69a6762796d6912191ec3a66  checkbox disabled=true  "Beans • 3000kg • already on a trip"
Create trip disabled=true in every case
```

This is **backend issue B seen from the other side**: bookings are never released after
delivery any more than fleets are, so every confirmed booking stays permanently attached to
its long-finished trip. Manual trip creation is unreachable in this environment through no
fault of the frontend.

**A new fleet does not fix it** — a fresh fleet has no bookings at all. The full chain
needed is: new fleet → buyer books it → admin approves the fleet payment (auto-creates a
trip). That chain is now *possible* for the first time (see 13e).

**13c. The fleet picker shows duplicate names with nothing to tell them apart — LOW**

The Create Trip fleet dropdown reads:

```
Select fleet…
West Route Fleet
Olando
North Route Fleet     ← 69a67ace…  Abia - Anambra,      on_transit
North Route Fleet     ← 69a6762796…  Cross River - Adamawa, under_maintenance
```

Two entries are character-for-character identical while being different trucks on different
routes in different states. The transporter cannot tell which one they are dispatching. The
fleet-list *table* distinguishes them fine (IOT `IOT-TRK-002` vs `IOT-TRK-001`), so the data
is available — the dropdown just doesn't use it. Appending the IOT or the route would fix it.

**13d. An expired session silently renders an empty page — MEDIUM**

Observed repeatedly, including mid-run right after the fleet was created:

```
GET  /api/profile        -> 401
POST /api/auth/refresh   -> 400 {"error":"Refresh token required"}
… fleet list then rendered 0 rows, with no message of any kind
```

Two problems compounding:

1. **The refresh path never works.** `POST /api/auth/refresh` is called without a refresh
   token and always 400s, so a session that ages out cannot recover.
2. **A 401 renders as "no data" rather than as an error.** The fleet list went from 5 rows
   to 0 and simply looked like an empty account. This is exactly the failure mode fixed for
   fleet bids earlier ("a failed request is not an empty list" —
   [MyFleetBids.tsx:71](<../src/app/(main)/buyer/my-biddings/_components/MyFleetBids.tsx#L71>)),
   but the pattern is not applied here.

It also cost real debugging time in this session: the Add Fleet run reported
`fleets 4 -> 0` and looked like the fleet had failed to save, when in fact it had been
created (`201`) and the list was merely unauthorised. Confirmed by re-reading with a fresh
login: **5 fleets, the new one present and `available`.**

Worth deciding whether the frontend should force a re-login on 401 rather than paint an
empty state.

**13e. Two more modals with no focus management — LOW (a11y), same class as 12f**

The prediction in 12f held. Measured:

| Modal | `role="dialog"` | focus enters on open | body scroll locked |
|---|---|---|---|
| Add-to-store | ✅ (fixed 12f) | ✅ | ✅ |
| **Onboard Driver** | ✅ + `aria-labelledby` | ❌ **no** | ❌ no |
| **Create Trip** | ❌ **none** | ❌ **no** | ❌ no |

The driver modal is the interesting one: it already has correct dialog semantics *and* an
`id`'d title, so someone knew to do this — the focus move was just never added. Neither is
fixed here; they want the one focus-management pass noted in the handoff, now with three
confirmed instances rather than a suspicion.

### Test data created by this sweep

| Kind | Id / detail |
|---|---|
| Driver | `6a786bf2a047ef91ebdc4ec5` — QA Sweep Driver 09Aug, `+2348055566677`, licence `QA-DRV-99881`, no fleet assigned |
| Fleet | `6a786e7bd9239f0a4de4eb3c` — QA Sweep Fleet 09Aug, IOT `IOT-QA-0901`, Kaduna–Lagos, 20,000 kg, ₦150, `available`, `wholeTruckOnly` — **first fleet ever created through the UI, and the only bookable one in the environment** |

The fleet carries the stubbed Cloudinary image URL, because `api.cloudinary.com` is
DNS-blocked here. No trip was created, no order or product touched, nothing deleted.

---

## 14. Closing out the backlog — 09 Aug 2026

Fix #7 verified (see §7), then the remaining untested areas: admin, cross-cutting pages,
and the modal focus audit. Everything below was driven through the real UI.

### The fix-#7 chain, end to end

The first complete fleet booking → payment → approval → trip → delivery cycle done entirely
through the UI on a fleet created through the UI:

```
Add Fleet (UI)      -> fleet   6a786e7bd9239f0a4de4eb3c
buyer books it      -> POST …/fleet/{id}/payments 201, payment 6a78810f381428c5e639f830
admin approves      -> PATCH /api/admin/fleet-payments/{id}/status 200
                       response carried fleetTripId 6a788319714655ab6300d880
transporter drives  -> picked -> on_transit -> delivered, every PATCH 200
```

Admin approval is a proper two-step: clicking Approve on the row opens a **"Fleet Payment
Details"** modal, and Approve there opens a `role="dialog"` confirmation — *"Approve fleet
payment? This marks the payment as approved. The transporter and buyer will be notified."*
Correct for a money action. (It also cost time in this session: the first attempt clicked a
button matching `has-text("Approve")` and hit the **"Approved" tab** instead, silently
dismissing the dialog. Use exact-text locators on this screen.)

### 14a. Whole-truck fleets were quoted per-kg — the buyer saw 1/300th of the real price — HIGH (money) — ✅ FIXED

Found while booking the new fleet. On a `flat_rate_whole_truck` fleet priced at ₦150:

```
booking page  : Per Kg: ₦0.01 …  Transport Cost: ₦0.5 (₦0.01/kg)     ← what the buyer saw
payment step  : Transport Cost: ₦0.5
POST …/payments -> 201 { amount: 150 }                                ← what they were charged
admin detail  : WHOLE TRUCK Yes · LOAD WEIGHT 50 kg · FLEET PRICE ₦150 · AMOUNT ₦150
```

The backend is right — a whole-truck fleet is billed its flat price however much of it you
fill. The frontend computed `pricePerKgEquivalent × weight` for every fleet, whole-truck or
not, so the quote was **300× below the charge**. On the real fleets in this account
(₦250,000 and ₦4,000,000 whole-truck) a small load would quote as pocket change.

Root cause: `ApiTruck` carries `wholeTruckOnly` and `pricingModel`, but the booking page's
mapping to `TruckItem` dropped both, so no component downstream could tell.

### Fix

- `TruckItem` now carries `wholeTruckOnly` / `pricingModel`, and the booking page passes
  them through.
- New [`src/utils/transportPricing.ts`](../src/utils/transportPricing.ts) —
  `computeTransportCost(item, weight)` returns the amount **and** a `basisLabel`, so the
  three places that quoted a price cannot drift apart again:
  `TruckDetailsAndShipProduct` (review step), `DeliveryDetailsAndPaymentMethod` (payment
  step) and `Negotiate` (the asking price a fleet bid is made against — it had the same
  bug, so buyers were negotiating against a nonsense figure).
- The header no longer shows a meaningless "Per Kg: ₦0.01" for a whole-truck fleet; it
  shows "Whole truck: ₦150".

### Verified — 09 Aug 2026, live UI

```
fleet is whole-truck: true   flat price=₦150   quoted=₦150
Transport Cost: ₦150 (whole truck)          ← on a 3,000 kg load
>>> PASS <<<
```

The payment step could not be re-checked on this fleet — it has now been booked once and
backend B means it is permanently unbookable, so `Pay` is disabled. Both steps share the
same helper, so they cannot disagree.

### 14b. Admin surface — 10 of 11 screens clean, one hard 404

Recon of `/admin`, `all-users`, `active`, `suspended`, `removed`, `settings`,
`track-orders`, `transactions`, `fleet-payments`, `new`, `rejected`.

**Every screen renders with all backend calls 200 — except `/admin/track-orders`, which
returns a 404 document.** The route has no `page.tsx`; only `track-agent/` and
`track-transporter/` children exist. Both children work well:

| Page | Content |
|---|---|
| `/admin/track-orders/track-agent` | Paid (13) / Delivered (2), 10 rows |
| `/admin/track-orders/track-transporter` | Picked (6) / On Transit (1) / Delivered (5), 6 rows |

The **desktop** nav links to `/admin/track-orders/track-agent` (correct). The **mobile** nav
linked to the bare parent — a guaranteed 404 for any admin on a phone.
**Fixed:** mobile nav now points at the same child route as desktop.

### 14c. Fifteen dead internal links across the app — MEDIUM

Prompted by the above, every internal `href` in `src/` was checked against the 79 real app
routes. **15 point at routes that do not exist:**

| Dead link | Linked from | Impact |
|---|---|---|
| `/agent/chat`, `/agent/help` | agent sidebar (desktop + mobile) | **Chat and Help 404 for every agent** |
| `/transporter/chat`, `/transporter/help` | transporter sidebar (desktop + mobile) | **Chat and Help 404 for every transporter** |
| `/help-center`, `/help-center/how-to-buy-on-agric-tech`, `/help-center/how-to-sell-on-agric-tech`, `/hot-line`, `/our-location` | `Footer.tsx` | 5 footer links 404 on every page |
| `/agents`, `/transporters` | admin + transporter mobile navs | 404 |
| `/contact-us` | admin navbars | 404 |
| `/account-settings` | `register-as` | 404 |
| `/bid` | buyer home slider | 404 |
| `/agent  ` *(trailing spaces)* | `AgentMobileNavbar` | typo — **✅ FIXED** |

Only the typo was fixed. The rest are **missing pages, not broken links**: the fix is either
to build them or to remove the entries, which is a product call — flagged rather than
guessed at. `/buyer/chat` and `/buyer/help` also 404 when visited directly, though nothing
links to them with a literal href.

### 14d. Password reset does not exist — MEDIUM (product gap)

`/forgot-password` and `/reset-password` both return 404, and **nothing links to them** — so
this is not a broken link but an absent feature. A user who forgets their password currently
has no route back into the account. Worth confirming whether it was ever scoped; combined
with the signup mailer being broken (Parked, below) and refresh never working (13d), account
recovery has no working path at all.

### 14e. Modal focus audit — 4 of 5 modals were broken, all now pass — ✅ FIXED

The audit predicted in §12/13 was run with `a11-focus-probe.js` / `w9-rest-and-focus.js`.
Before:

| Modal | `role="dialog"` | `aria-modal` | focus enters | scroll locked |
|---|---|---|---|---|
| Add-to-store | ✅ | ✅ | ✅ | ✅ |
| Onboard Farmer | ✅ | ❌ | ❌ | ❌ |
| Onboard Driver | ✅ | ❌ | ❌ | ❌ |
| Create Trip | ❌ | ❌ | ❌ | ❌ |
| Add Fleet | ❌ | ❌ | ❌ | ❌ |

### Fix

Extracted the behaviour proven on Add-to-store into
[`src/hooks/useModalA11y.ts`](../src/hooks/useModalA11y.ts) — focus into the dialog on open,
Tab trapped inside (wrapping both ways), body scroll locked, focus returned to the opener on
close — and applied it to the other four, adding `role="dialog"` / `aria-modal` /
an accessible name where missing.

`AddToStore` deliberately keeps its own copy: the hook was extracted *from* it, its Escape
handling is entangled with the discard prompt (10g), and re-plumbing a verified fix to save
a few lines is not worth the regression risk.

After:

```
PASS  Add-to-store       PASS  Onboard Farmer   PASS  Onboard Driver
PASS  Create Trip        PASS  Add Fleet
```

Not yet done: `EditProductModal`, `BiddersModal`, `CustomerInfoModal`, the
`CustomerCareModal`s and `TripDetailsModal` — same treatment, now a one-line hook call each.

### 14f. Also fixed: the duplicate fleet names (13c)

The Create Trip dropdown now qualifies each fleet with its plate/IOT and route, so the two
"North Route Fleet" entries are distinguishable.

### Test data created by this session

| Kind | Id / detail |
|---|---|
| Fleet payment | `6a78810f381428c5e639f830` — ₦150, bank transfer, **approved** |
| Fleet booking | `6a78810f381428c5e639f82d` |
| Fleet trip | `6a788319714655ab6300d880` — Kaduna → Lagos, driven to **delivered** |
| Driver | `6a786bf2a047ef91ebdc4ec5` — QA Sweep Driver 09Aug |

The trip shipped order `#22EEA034` (`QA CLEAN1 Yellow Maize`, 50 kg), created by this
testing effort. Every script's guard allowed writes only to our own ids; none ever fired.

---

## 15. Admin interaction sweep — 10 Aug 2026

The largest remaining gap in `STATUS.md` §3.1: every admin screen rendered
cleanly, but only *fleet* payment approval had ever had a button pressed. This
session drove the destructive controls for the first time.

Scripts (this session's scratchpad): `x1-admin-recon.js` (read-only, all 10
screens), `x2-admin-modals.js` (read-only, row detail modals),
`x3-payloads.js` (raw payload shapes), `x4-txn-approve-reject.js`,
`x5-user-lifecycle.js`, `x6-spec-check.js`, `x7-dashboard-numbers.js`.

Every write went through an id allowlist that aborts anything else, and the
read-only scripts abort *all* non-GET traffic outright.

### 15a. Product payment approval and rejection — ✅ WORKS, the money path is verified

The order money path — as opposed to the fleet money path — had never been
exercised. Both halves work:

| Action | Call | Result |
|---|---|---|
| Approve | `PATCH /api/admin/transactions/6a7641ae2b8e56022e704c00/status {"status":"approved"}` | 200, row moved Pending → Approved |
| Reject | `PATCH /api/admin/transactions/6a763b37f1031c35596c3cdc/status {"status":"rejected"}` | 200, row left Pending |

Both targets were created by this effort on 7 Aug from the shared test account
(the ₦680 order is the one from the total-validation test, recorded at the
bottom of this file). Both show a proper two-step `ConfirmActionModal` with a
worded description before anything is sent.

**The approval propagated correctly, end to end.** Measured immediately before
and after:

- dashboard *Received Payment* `218,641,380` → `218,642,680` — exactly `+₦1,300`
- order breakdown `paid` `13` → `14`

So approving a product payment really does flip the order to `paid`. That is
the single most important untested path in §3.1 and it passes.

**Note for whoever tests next: there are now no pending product payments left.**
The status spread across all 20 transactions is `approved 18, rejected 1,
refunded 1`. Another approval test needs a new order paid through the buyer UI
first.

### 15b. A rejected transaction displays as "Failed" — LOW (frontend, vocabulary)

The API accepts `[approved, rejected, pending]` and we sent `rejected`, which
the backend stored as `rejected`. The transactions screen has no *Rejected*
tab — its tabs are All / Pending / Approved / **Failed** / Refunded — so the row
now reads **Failed**.

The fleet-payments screen next to it *does* have a Rejected tab. So the same
concept is called "Rejected" on one payment screen and "Failed" on the other,
and an admin who clicks *Reject* is told the payment "Failed". Cosmetic, but
the two screens should agree.

### 15c. User suspend / remove / restore — ✅ WORKS, full lifecycle, net zero

The most destructive controls in the app, and previously untestable because
there was no QA-only account and the shared login must never be suspended.

**Resolved without needing signup** (which is still broken): earlier sessions
left throwaway accounts behind, listed at the bottom of this file. One of them,
`qa.flow.probe.8821@example.invalid`, uses the `.invalid` TLD reserved by
RFC 2606, so it can never belong to a real person. That is the target.

All four transitions pass, and the account finishes exactly where it started:

| Step | Call | Result |
|---|---|---|
| Suspend | `PATCH /api/admin/users/{id} {"status":"suspended"}` | 200, left Active, appears in Suspended |
| Reactivate | `POST /api/admin/users/{id}/reactivate` | 200, back in Active |
| Remove | `PATCH /api/admin/users/{id} {"status":"removed"}` | 200, appears in Removed |
| Restore (*Onboard*) | `POST /api/admin/users/{id}/reactivate` | 200, back in Active |

`x5-user-lifecycle.js` resolves the target id from the API payload, refuses any
write naming the shared or admin account, and blocks any write that does not
name that one id. It is re-runnable and leaves no trace.

### 15d. Single-row destructive actions have no confirmation — MEDIUM (safety)

Measured during 15c, on every one of the four transitions: **the row action
menu fires immediately.** One click on *Suspended*, *Remove*, *Reactivate* or
*Onboard* and the `PATCH`/`POST` is already gone. No dialog, no undo.

This is inconsistent with the app's own behaviour elsewhere:

- the **bulk** versions of the very same actions, on the very same page, all
  route through `ConfirmActionModal` with a worded description and a count
  (*"This will suspend 2 selected users. They will lose access until
  reactivated."*)
- **transaction** approve and reject both confirm (15a)
- **fleet-payment** approval confirms — it is a deliberate two-step
- agent **product deletion** confirms, with a count

So selecting a checkbox and choosing *Suspend* asks you to confirm, while
opening the row's own menu and choosing *Suspended* does not. The single-row
path is the easier one to hit by accident, and it is the one with no guard.
`ConfirmActionModal` already exists and the page already imports it.

### 15e. Admin `Active`/`Suspended` tab counts read (0) — ✅ FIXED

`/admin/active` painted `Active (0) Suspended (0) Removed (1)` while the table
under it listed 10 active users. The identical tabs on `/admin/suspended` and
`/admin/removed` read `Active (18) Suspended (2) Removed (1)`. Stable after
6 seconds, so not a race.

**Root cause.** Three near-duplicate pages, each with its own stats reader.
`/admin/suspended` and `/admin/removed` use `readStatusCount`, which checks the
top-level key before `byStatus`. `/admin/active` used `readNumber` with only
`["byStatus.active", "active"]`.

The live payload is flat, with no `byStatus` object at all:

```json
{"totalUsers":21,"buyers":9,"agents":7,"transporters":2,"admins":1,
 "activeUsers":18,"suspendedUsers":2,"removedUsers":1, ...}
```

Neither lookup matched, so both fell through to `?? 0`. `Removed` was correct
only by accident, because `removedUsers` was already in its list.

**Fix.** `/admin/active` now tries `activeUsers` / `suspendedUsers` /
`removedUsers` first, matching what `AllUserOverview` already did — that
component renders 18 / 2 / 1 correctly on the very same payload.

**Verified** against the live payload, not inferred: `GET
/api/admin/users/stats` returns `activeUsers 18, suspendedUsers 2,
removedUsers 1`.

Worth a follow-up: four separate readers for one payload is why this drifted.
One shared helper would prevent the next copy from diverging.

### 15f. ~~Clicking a user row does not open the user detail page~~ — WITHDRAWN, not a bug

`/admin/all-users/[id]` exists as a complete page — eight components including
`UserProfileBar`, `UserHistoryPanel`, `UserOverviewStrip` and three modals.
Clicking a row on `/admin/all-users` does nothing: the URL does not change and
no request is made.

The wiring looks correct (`onRowClick={openDetail}` →
`router.push('/admin/all-users/' + id)`) and `_id` **is** present on every row
in the payload, so the obvious explanation — an empty id producing
`/admin/all-users/` — is not it. Not yet root-caused.

Nothing else links to the route either, so **an entire admin page is currently
unreachable through the UI.**

### 15g. The admin transaction modal has no dialog semantics — LOW (a11y)

Measured with the same probe used for 12f/14e. `TransactionDetailModal` has no
`role="dialog"` and does not close on Escape — the overlay stays up and
swallows the next click. It is the same pattern already fixed in five other
modals, and `useModalA11y(isOpen, ref)` is one line.

The `/admin/new` approval modal, by contrast, *does* have `role="dialog"` and a
`Close` button, so the two admin modals disagree with each other.

### 15h. Dashboard widgets report correct numbers — ✅ VERIFIED

§3.1 asked whether the dashboard figures are actually right; they render, but
nobody had cross-checked them. They are right.

The spec documents a set of per-metric endpoints the app never calls, which
makes them an independent second source for the same figures:

| Card | Painted | `dashboard/overview` (app) | spec endpoint | Verdict |
|---|---|---|---|---|
| Users | 21 | 21 | 21 (`registered-users`) | agree |
| Received Payment | ₦218,642,680 | 218642680 | 218642680 (`received-payments`) | agree |
| Orders | 20 | 20 | 20 (`orders`) | agree |
| Visitors | 17 | 17 | 17 (`visitors`) | agree |

Independently, summing the 18 approved transactions from
`/api/admin/transactions` gives **218,642,680** — matching both sources to the
naira.

### 15i. Spec vs implementation — the documentation is stale, the code is fine

Prompted by a request to confirm every endpoint against the Swagger spec, all
29 endpoints this sweep touches were probed directly against the live backend
with an admin token (`x6-spec-check.js`). **Every one returned 200.** Nothing is
broken — but the spec and the app have drifted apart in three places, which
matters because the spec is what the backend team works from.

**1. The dashboard section documents endpoints the app does not use, and omits
the ones it does.** Both sets are live.

| Documented in the spec | Actually called by the app |
|---|---|
| `/api/admin/dashboard/registered-users` | `/api/admin/dashboard/overview` |
| `/api/admin/dashboard/received-payments` | `/api/admin/dashboard/revenue?period=` |
| `/api/admin/dashboard/orders` | `/api/admin/dashboard/top-buyers?limit=` |
| `/api/admin/dashboard/visitors` | `/api/admin/dashboard/top-agents?limit=` |
| `/api/admin/dashboard/revenue-chart` | `/api/admin/dashboard/top-transporters?limit=` |
| `/api/admin/top-buyers`, `/top-agents`, `/top-transporters` | |

Note the spec puts top-buyers at `/api/admin/top-buyers` while the app calls
`/api/admin/dashboard/top-buyers`. **Both work.**

**2. Two endpoints the admin UI depends on are absent from the spec entirely:**

- `/api/admin/approvals/transporters` (+ `/{id}`) — 200, returns 2 rows. Only
  `approvals/agents` and `approvals/farmers` are documented, so there is no
  documented way to approve a transporter, though the UI does it.
- `/api/admin/banners` — 200, returns 2 banners. Backs the whole settings screen.
- `/api/support/contacts` — 200, `{hotline, whatsapp, email}`.

**3. Two overlapping routes for the same job, and the app picks the undocumented
one.** For user status the spec has a purpose-built
`PATCH /api/admin/users/{id}/status` with `enum: [active, suspended]`; the app
instead sends `PATCH /api/admin/users/{id} {"status": ...}`. That generic route
is documented only by example, with no enum — and the app sends
`"removed"` through it, which appears in no enum anywhere but works.

Similarly `POST /api/admin/users/{id}/onboard` is documented ("Onboard user
(reactivate)") and never called: the button labelled **Onboard** calls
`/reactivate` instead. Both return 200.

**Requested of the backend team:** document the five dashboard endpoints the app
actually uses (or tell us to migrate to the documented ones), add
`approvals/transporters`, `banners` and `support/contacts`, add `removed` to a
status enum, and say which of the two user-status routes is canonical.

### 15j. Support APIs confirmed live — unblocks the Chat/Help decision (D4)

Probed as part of 15i, because D4 hinged on whether these exist:

| Endpoint | Status | Shape |
|---|---|---|
| `GET /api/chat` | 200 | `array(0)` |
| `GET /api/help` | 200 | `array(0)` |
| `GET /api/support/contacts` | 200 | `{hotline, whatsapp, email}` |
| `GET /api/admin/live-chats` | 200 | `array(2)` — two conversations already exist |
| `GET /api/admin/queries` | 200 | `array(0)` |

`/api/help` is a support-ticket API (`POST {subject, message, priority,
linkedOrderId, linkedTransactionId}`, `DELETE /api/help/{id}` to close) and
`/api/chat` is a conversation API (`POST {initialMessage}`, then
`GET`/`POST /api/chat/{conversationId}` for messages).

So the 14 dead Chat/Help links (14c) can be backed by real endpoints rather than
removed, and building them also gives the untested admin *Queries* and *Live
chats* screens something to receive.

### Test data touched by this session

| Kind | Id / detail | State |
|---|---|---|
| Transaction | `6a7641ae2b8e56022e704c00` — QA CLEAN1 Yellow Maize, ₦1,300 | Pending → **Approved** (deliberate) |
| Transaction | `6a763b37f1031c35596c3cdc` — Sweet Potatoes, ₦680 | Pending → **Rejected** (deliberate) |
| User | `6a7493b8e0c1e1c4e3e11d7c` — QA Flow Probe, `qa.flow.probe.8821@example.invalid` | suspended → reactivated → removed → restored, **net zero, Active** |

Nothing else was mutated. The pre-existing Garri order `69c1698467317734c348af91`
was on the abort list in every script and was never touched.

---

## 16. Chat and Help pages built — 14c partially closed, 10 Aug 2026

**Decision D4 was answered "build them if the APIs exist".** They exist and
answer (§15j), so the four dead sidebar routes are now real pages:

| Route | Was | Now |
|---|---|---|
| `/agent/chat` | 404 | Chat |
| `/agent/help` | 404 | Help & support |
| `/transporter/chat` | 404 | Chat |
| `/transporter/help` | 404 | Help & support |

Shared implementation, one component each, so the two roles cannot drift:
`src/components/support/SupportChatView.tsx` and `SupportHelpView.tsx`, with
the four route files as three-line wrappers. Data access went into the existing
`supportService` / `useSupportQueries` pair rather than a new one.

### What works, verified in the live UI

| Behaviour | Evidence |
|---|---|
| Both routes render for **both** roles | `h1` "Chat" / "Help & support", `http 200`, no 404 text, no console errors |
| Sidebar links reach them | `<a href="/transporter/chat">` and `/transporter/help`, both inside `<aside>`, both land correctly |
| Support contacts | `GET /api/support/contacts` → hotline / WhatsApp / email, rendered as `tel:`, `wa.me` and `mailto:` links |
| Conversation list | `GET /api/chat` → 2 real conversations with participant names, last message and timestamps |
| **Raise a support request** | `POST /api/help` → **201**, and the ticket appears in the list **without a reload** |
| Ticket list | `GET /api/help` → renders subject, message, priority and status chips |
| Form validation | Submit blocked until both subject and message are non-empty, with inline per-field errors and `aria-invalid` |

Verified by `x11-verify-support.js` and `x12-verify-support2.js`.

### What is blocked by the backend

Both blockers are **backend item 15**, and neither is a frontend defect:

- **A conversation cannot be opened.** `GET /api/chat/{conversationId}` returns
  400 for every id, including the ones `GET /api/chat` just returned.
- **A ticket cannot be closed.** `DELETE /api/help/{id}` returns 400 for every
  id, with the same signature.

The pages are written against the documented contract and will work unchanged
once those routes are fixed. In the meantime:

- the thread pane shows an explicit *"This conversation cannot be opened yet"*
  panel with a retry, **not** an empty thread — an empty thread would repeat
  bug 13d, where a failed load read as "no data" and cost real debugging time.
  The conversation's most recent message is still shown, so the pane is never
  simply blank.
- the *Close ticket* button stays wired and surfaces the server's own message.

### What is deliberately still missing

`14c` counted 15 dead links. Four are now built. The rest are untouched and
still a product call: `/agents`, `/transporters`, `/contact-us`,
`/account-settings`, `/bid`, and the five footer links.

### Test data left behind

One support ticket is stuck open in live data, because closing it is the very
thing that is broken: `6a7956050a2280f3467d2b58`, *"QA sweep — Help page smoke
test"*, priority `low`, raised by the shared test account. Safe to delete
server-side.

---

## 17. Admin §3.1 completed, and 15f withdrawn — 10 Aug 2026

Scripts: `y1-rowclick.js`, `y2-eventpath.js`, `y4-verify-and-sweep.js`,
`y5-nav-and-track.js`, `y6-final-sweep.js`.

### 17a. 15f was not a bug — WITHDRAWN

Reported earlier as *"an entire admin page is unreachable"*. It is not. The row
click works; it is just **very slow the first time in dev**, because Turbopack
is compiling the `/admin/all-users/[id]` route on demand.

Instrumenting the real click settled it. A capture-phase listener showed the
event reaching the `<tr>` from **every** cell, and watching navigation events
over 15 seconds instead of 4 showed:

```
t+3s   url=/admin/all-users
t+6s   url=/admin/all-users
t+9s   url=/admin/all-users
       [nav] /admin/all-users/6a7499a7c5c0651227008a1c     <- ~10s in
t+12s  url=/admin/all-users/6a7499a7c5c0651227008a1c
final: h1 "Tobi", real user detail, no error
```

The earlier probes waited 2.5–4s and concluded the click was dead. **The lesson
is the one already in the handoff — never assert on a fixed sleep** — and it
applies to navigation, not just to data loading. A first-hit route compile in
this project can exceed 10 seconds.

**What was kept.** The investigation still found a genuine a11y gap, so the
change stays, reframed as an improvement rather than a fix:

- the identity cell is now a real `<Link>` with an `aria-label`
  (*"Open Tobi's profile"*) instead of text inside a click handler. It is
  keyboard reachable, shows a focus ring, offers a real target, and navigates
  natively — which also means it works before React hydrates.
- the row itself, which is click-only by design, now carries `tabIndex={0}`,
  `role="link"` and Enter/Space handling in `AdminTableList`, so every admin
  table that opts into `onRowClick` becomes keyboard-operable at once. This is
  the same bare-click-handler pattern already fixed at 11h, 11h-2 and 12f.

### 17b. 15d fixed — row actions now confirm — ✅

Single-row *Suspend* / *Remove* / *Reactivate* / *Onboard* on `/admin/active`,
`/admin/suspended` and `/admin/removed` previously sent their write on one
click, while the bulk versions of the same actions confirmed.

All three pages now route row actions through the `ConfirmActionModal` they
already imported, and the copy names the person rather than saying "1 selected
user". Verified in the UI:

> **Suspend Tobi?** This will suspend Tobi. They will lose access until
> reactivated.  `Cancel` `Suspend`

A row action still uses the **single-user** endpoints — it is not rewritten as
a one-element bulk call.

`/admin/all-users` already had its own confirmation, so the gap was confined to
those three pages.

### 17c. Refunds — ✅ VERIFIED, and the money path closes

`/admin/transactions` → open an approved transaction → **Refund** → reason
field → **Confirm Refund**.

```
POST /api/admin/transactions/refund
  {"transactionId":"6a7641ae2b8e56022e704c00","reason":"QA sweep ..."}   200
```

Row moved to **Refunded**, and the dashboard moved with it:

| | Received Payment |
|---|---|
| before this session | 218,641,380 |
| after approving the ₦1,300 payment (§15a) | 218,642,680 |
| after refunding it | **218,641,380** |

Approve `+₦1,300`, refund `−₦1,300`, back to the start. Both directions of the
order money path are now verified against the same transaction.

The app calls the collection route `POST /api/admin/transactions/refund` with
the id in the body, which **is** the documented one.

### 17d. Banners CRUD — ✅ VERIFIED, net zero

`/admin/settings` → **+ New banner** opens a proper `role="dialog"` with image
upload, title, link, position, alt text, start/end dates and an active toggle.

```
POST   /api/admin/banners                        201   list 2 -> 3
DELETE /api/admin/banners/6a796f01555d2b10f22b29ae 200   list 3 -> 2
```

Created *"QA Sweep Banner 10Aug"* and deleted it again, with a delete
confirmation in between. Nothing left behind.

Two caveats: the image had to go through the harness's **Cloudinary stub**, so
real banner image upload is still untested here (same limit as product images
and receipts); and none of the form's inputs carry a `required` attribute, so
field validation was not probed in depth.

### 17e. Track-orders row actions — ✅ COVERED

The routes are `/admin/track-orders/track-agent` and
`/admin/track-orders/track-transporter` — there is no `/admin/track-agent`,
which is what an earlier probe in this session wrongly requested and got a 404
from. (The parent `/admin/track-orders` still has no page of its own, which is
bug 14b, already fixed in the mobile nav.)

| Screen | Rows | Tabs | Row click |
|---|---|---|---|
| track-agent | 10 | Paid (14) · Delivered (2) | no modal — the per-row action menu is the affordance (10 present) |
| track-transporter | 6 | Picked (6) · On Transit (1) · Delivered (5) | opens **Trip Details** with route, tracking code, weight, packages, buyers, GPS |

`Paid (14)` is independent confirmation that the §15a approval landed — it was
13 before.

### 17f. Admin Trip Details modal has no dialog semantics — LOW (a11y)

Found opening the track-transporter row modal. It renders real content, but:

- no `role="dialog"`
- **no `<button>` elements at all** — so there is no focusable close control;
  it cannot be dismissed or operated from the keyboard

That is a step worse than 15g (the transaction modal), which at least has
buttons. Both want the same one-line `useModalA11y(isOpen, ref)`.

### 17g. Avatar migration (§3.6) — partially done

Migrated to the resilient `Avatar`, which survives a URL that 404s and not just
a missing one:

- `UserProfileBar` (the user detail header)
- `FleetPaymentDetailModal` — buyer avatar, **and the transporter avatar, which
  was hardcoded to `/images/placeholder-avatar.png`** and so never showed a real
  photo even when the transporter had one

Still on the plain `src || placeholder` form, all low risk now the asset exists:
the mappers in `/admin/active`, `/admin/suspended`, `/admin/removed`,
`/admin/transactions`, `/admin/fleet-payments`, plus `agent/bids`,
`BiddersModal`, `OtherStoreProduct`, `BiddingProduct` and `WishList`.

Also noted: `AllUserType` defines its own local `UserAvatar` that shadows the
shared component. It is not broken — it renders coloured initials — but it is a
third avatar implementation alongside `Avatar` and `UserAvatar`.

---

## Parked — signup (deferred by request, not fixed)

Recorded so it isn't lost. **Signup is broken for every new user in production.**

- `POST /api/auth/register` → **500**, but the user row is created anyway (re-registering
  the same email returns `409 User already exists`).
- `POST /api/auth/resend-verification` → **500**. This is the endpoint the "Resend" link
  calls ([signupAuth.ts:201](../src/utils/signupAuth.ts#L201)).
- `POST /api/auth/request-verification` → **200** `{"message":"Verification code sent"}`.
  This one works and is not used anywhere in the frontend.

Net effect: a new user gets a server error, no email, cannot re-register (409), and
cannot log in (403 unverified). Permanently bricked.

Smallest useful fix is one line — repoint `resendOtpCode` at
`/api/auth/request-verification`. The backend still needs to find why its mailer throws
on two paths and succeeds on the third, and stop returning 500 after the user row is
committed.

Also parked from the same area: the signup form submits natively if clicked before React
hydrates, putting the password in the URL
(`/signup?name=…&email=…&password=…`) — [signup/page.tsx:101](../src/app/(auth)/signup/page.tsx#L101).

---

## Environment limits (not app bugs)

- `api.cloudinary.com` does not resolve on this network. Product image upload was stubbed
  in the harness with a hosted Cloudinary URL, so **real image upload is untested here**.
- Playwright's bundled Chromium cannot be downloaded; the harness drives the installed
  Google Chrome.

---

## Test data created by this run

| Kind | Id / ref |
|---|---|
| Products | Premium White Maize `6a749eac79cacdb288598bcd`, Long Grain Paddy Rice `6a749ec29f192e80d3fa94fe`, Sweet Potatoes `6a749ed89f192e80d3fa951a`, Fresh Roma Tomatoes `6a749eee4a0f3e3f904f2459` |
| Bids | accepted `6a749fa4…`, countered→accepted `6a749fb5…`, rejected `6a749fd9…`, accepted `6a749fc6…` |
| Orders | `6a75d7825c88e28a8551fe6c` (₦2,000, delivered), plus one ₦680 order from the total-validation test |
| Transaction | `PAY-1786109323770-8460` (approved) |
| Fleet payment | `6a75e7b5b9a3d4c579fe2ada` (approved) |
| Trips | `6a75e83f3d3be8eb954a63bf` (delivered) |
| Pre-existing trip moved | `69ff4a66099795cd39d47d12` — was `loaded`, now `delivered` |
| Stuck signups | `muhajdev@gmail.com`, `muhajdev+buyer@`, `muhajdev+agent@`, `muhajdev+transporter@`, `probe.tractive.qa1@mail.tm`, `muhaj.dev.qa1@gmail.com`, `timing.probe.9931@gmail.com`, `qa.flow.probe.8821@example.invalid` |
