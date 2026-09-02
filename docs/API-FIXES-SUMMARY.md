# API fixes required — short list

Retested **01 Sep 2026** against https://tractive-be.vercel.app, after the backend
reported the four open items fixed. Every item was re-run against the live API on the
shared account (`i59mv8titr@lnovic.com`) and then re-checked in Chrome against the local
frontend on `localhost:3000`. Full detail:
[BACKEND-ISSUES-2026-08-07.md](BACKEND-ISSUES-2026-08-07.md) and
[API-FIXES-REQUIRED.md](API-FIXES-REQUIRED.md).

**All four are confirmed fixed.** Two new, smaller issues surfaced while verifying — see
*Newly found* below.

## Fixed — verified 01 Sep 2026

### 1. Fleet load never resets ✅

- **Was:** released fleets kept `currentLoadKg` at 19950 / 39995 / 399999999998900, and
  fleet `69a67ace96f7df1573952158` was stuck `on_transit`.
- **Now:** `GET /api/transporters/fleets` returns all 5 fleets with `currentLoadKg: 0`;
  4 are `available` and 1 is `under_maintenance`. Nothing is stuck `on_transit`, including
  `69a67ace96f7df1573952158`. The legacy rows were migrated.
- **Verified in UI:** Transporter → Fleet List renders the five rows at `available` /
  `under_maintenance`.
- **Left over (item 8, unrelated):** fleet `69c942bcf41a272cfa476795` still *stores*
  `capacityKg: 400000000000000`. Load reset is fine; the absent capacity bound is a
  separate open item.

### 2. Trip status filter ignores bad values ✅

- **Was:** `?status=pending` and `?status=bogus_value` both returned the full unfiltered
  list of 5 delivered trips.
- **Now:** the param is validated. `?status=bogus_value` → **400** with
  `Invalid trip status. Use pending, planned, picked, loaded, on_transit, arrived,
  delivered, or cancelled`. `pending` and `planned` are both real states and return 0;
  `picked` 0, `on_transit` 0, `delivered` 5.
- **Verified in UI:** the **New** tab now shows "No trips in this status" instead of
  listing finished trips.

### 3. Won bids can be checked out twice ✅

- **Was:** `won/checkout` still offered bid `6a76dc3ea6133da574ba92d9` after order
  `6a76df00ceed3c17f3e6087d` consumed it, because only *paid* orders were excluded.
- **Now:** exclusion is by order reference, not payment state. Cross-checking all 20
  biddings against all 18 orders: **17 accepted bids, all 17 consumed by an order, 0
  unconsumed** — so the empty basket is correct, not a false empty. Critically the two
  bids held by *unpaid* orders are now excluded too:
  `6a79a1ac2a8944dd700ac02c` (order `payment_pending`) and `6a76dc3ea6133da574ba92d9`
  (order `pending`). That was the double-charge hole.
- **Verified in UI:** Buyer → My Biddings shows **Ready to checkout 0**.

### 4. Bookings are never released ✅

- **Was:** bookings stayed `confirmed` forever and Create Trip was unreachable.
- **Now:** no booking is stuck at `confirmed`. Of 10 bookings, 5 are `completed`
  (including `6a78810f381428c5e639f82d`, whose trip is delivered) and 5 are
  `pending_payment`.
- **Verified in UI:** Create Trip opens and its fleet dropdown lists all 5 fleets — the
  flow is reachable again. Selecting a fleet shows "No confirmed bookings on this fleet",
  which is now the *correct* empty state: nothing is currently paid-and-awaiting-a-trip.
- **Not yet provable:** that a genuinely `confirmed` booking renders in the dropdown.
  That needs a paid fleet booking on the test account; none exists right now.

## Newly found while verifying

### A. `GET /api/fleet-bookings?status=` is not validated — the item 2 bug, unfixed here

`?status=bogus_value` returns **all 10** bookings instead of filtering or erroring.
Known values do work (`confirmed` → 0, `pending_payment` → 5, `completed` → 5). The
validation added to `fleet-trips` was not applied to `fleet-bookings`. Same fix wanted:
reject unknown values with a 400, never fall back to the unfiltered list.

### B. `fleet-trips` needs a multi-status filter

The validated enum has 8 values but the transporter UI has 4 tabs, so a tab covers more
than one state (`pending`+`planned` → New, `picked`+`loaded` → Picked). The endpoint
accepts only one: `?status=a,b` → 400, and `?status[]=a&status[]=b` is ignored and returns
the unfiltered list (a variant of A).

Now that the filter is actually honoured, a trip in a tab's *secondary* status is dropped
server-side and the frontend cannot recover it — a `pending` trip will not appear under
New, nor a `loaded` one under Picked. This did not bite before, because the ignored filter
returned everything and the client re-filtered. **Please add a repeatable or
comma-separated `status` param.** Noted in `BookingTripsView.tsx`.

## Still untested

- **Fleet capacity/price validation (item 8)** — still no server-side bound; a legacy row
  holds `capacityKg: 400000000000000`. Not retested against a fresh write.
- **Intermittent 500 on won/checkout** — did not reproduce.
- **Two disagreeing status fields** (`status` vs `transportStatus`) — all 5 trips agree
  (`delivered`/`delivered`), but no trip is mid-lifecycle, so the `picked` transition is
  still unproven. This is what makes B a risk rather than a confirmed break.
