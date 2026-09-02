# APIs that need correction

**Filed 10 Aug 2026. Retested 18 Aug 2026, and again on 01 Sep 2026** after the backend
reported the four remaining items fixed. Backend `https://tractive-be.vercel.app`; every
line below was re-run against it, and the frontend-visible ones were re-checked in Chrome
on the shared test account. Detail:
[`BACKEND-ISSUES-2026-08-07.md`](BACKEND-ISSUES-2026-08-07.md).

**Score after the 01 Sep retest: 16 fixed, 0 partly fixed, 0 still open, 1 deferred**
— plus 2 new smaller issues found while verifying, both recorded in
[`API-FIXES-SUMMARY.md`](API-FIXES-SUMMARY.md) as *Newly found*:
an unvalidated `status` filter on `GET /api/fleet-bookings`, and the lack of a
multi-status filter on `GET /api/transporters/fleet-trips`.

> **02 Sep 2026 — 6 new items (20–25) and item 9 re-opened.** A UI ↔ API parity run using
> self-created data found six defects, two of them serious enough to act on now: **item 20**,
> a product edit silently destroys the product's category and has already damaged live data;
> and **item 9b**, the signup mailer leaves every new account permanently locked out. Both are
> below, with the evidence in
> [`UI-API-PARITY-RESULTS-2026-09-02.md`](UI-API-PARITY-RESULTS-2026-09-02.md).

> **01 Sep 2026 — items 2, 3, 10 and 14 below are all confirmed FIXED.** The sections are
> kept for history; each carries a result note. See `API-FIXES-SUMMARY.md` for the
> evidence.

Each item below is written as **What is wrong → Where to see it → How to fix it**, so the
backend can reproduce it on the same screen we did.

---

## Was "partly fixed" — both closed on 01 Sep 2026

### 2. Fleet release on `delivered` ✅ FIXED (01 Sep 2026)

> **Result.** All 5 fleets now report `currentLoadKg: 0`; 4 `available`, 1
> `under_maintenance`. `69a67ace96f7df1573952158` is no longer stuck `on_transit` — the
> legacy rows were migrated. Confirmed in Transporter → Fleet List. (Its *capacity* is
> still unbounded — that is item 8, still open.) Original report follows.

**The problem.** Fleets *are* released now — three of the five sit at `available` with their
trips `delivered`. Two things are still wrong:

- **`currentLoadKg` is never reset.** Released fleets still read `19950`, `39995` and
  `399999999998900` kg. The fix put the status back to `available` but left the load on the
  vehicle, so an idle fleet looks permanently full.
- **One fleet was missed.** `69a67ace96f7df1573952158` is still `on_transit` although its
  trip `6a75e83f3d3be8eb954a63bf` is `delivered` — legacy rows look unmigrated.

**Where to see it.** Transporter → **Fleet List**,
[src/app/(main)/transporter/fleet-list/page.tsx](src/app/(main)/transporter/fleet-list/page.tsx).
The residual load also blocks the capacity check in **Create Trip**,
[CreateFleetTripModal.tsx](src/app/\(main\)/transporter/_components/CreateFleetTripModal.tsx),
because a fleet that reads as full cannot take a new load.

**Possible fix.** In the same transition that flips a fleet back to `available` on trip
`delivered`, also set `currentLoadKg = 0` (or subtract the delivered trip's weight if
several trips can share a fleet). Then run a one-off migration over existing rows: any fleet
whose every trip is `delivered` gets `status = available` and the load cleared.

---

### 3. `GET /api/transporters/fleet-trips?status=` — filter ignored ✅ FIXED (01 Sep 2026)

> **Result.** The param is validated. `?status=bogus_value` → **400**
> `Invalid trip status. Use pending, planned, picked, loaded, on_transit, arrived,
> delivered, or cancelled`. `pending` is a real state now (returns 0, not the whole list).
> The **New** tab shows "No trips in this status" in the UI.
>
> **But note:** that enum is wider than our four tabs, and the endpoint still takes only
> one status, so a tab's *secondary* status is dropped server-side — see *Newly found B*
> in `API-FIXES-SUMMARY.md`. The client-side re-filter in `BookingTripsView` stays.
> Original report follows.

**The problem.** The filter works for the values it recognises: `picked` → 0, `on_transit` →
0, `delivered` → 5, all correct. But **an unrecognised value is silently ignored and the
endpoint returns everything**: `?status=pending` → 5 delivered trips, and so does
`?status=bogus_value`. A typo therefore reads as "no filter" instead of an error.

**Where to see it.** Transporter → the trip tabs
[**New**](src/app/\(main\)/transporter/new/page.tsx),
[Picked](src/app/\(main\)/transporter/picked/page.tsx),
[On-transit](src/app/\(main\)/transporter/on-transit/page.tsx),
[Delivered](src/app/\(main\)/transporter/delivered/page.tsx), all rendered through
[BookingTripsView.tsx](src/app/\(main\)/transporter/_components/BookingTripsView.tsx). The
**New** tab asks for `status=pending`, so without the client-side guard it would list
finished trips as new work.

**Possible fix.** Either accept `pending` as a real trip state, or validate the parameter
against the allowed set and reject anything else with a `400` — anything but returning the
unfiltered list. The frontend keeps its client-side re-filter in `BookingTripsView` until
one of the two lands.

---

## Was "still open" — both closed on 01 Sep 2026

### 10. `GET /api/buyers/biddings/won/checkout` — consumed bids still returned ✅ FIXED (01 Sep 2026)

> **Result.** Exclusion is now by order reference rather than payment state. Cross-checking
> all 20 biddings against all 18 orders: 17 accepted bids, all 17 consumed, **0
> unconsumed** — so the empty basket is correct rather than a false empty. The two bids
> held by *unpaid* orders are excluded too — `6a79a1ac2a8944dd700ac02c`
> (order `payment_pending`) and `6a76dc3ea6133da574ba92d9` (order `pending`) — which was
> the double-charge hole. Buyer → My Biddings shows **Ready to checkout 0**.
> Original report follows.

**The problem.** Bid `6a76dc3ea6133da574ba92d9` is still offered for checkout although order
`6a76df00ceed3c17f3e6087d` has already consumed it. That order is `pending` (unpaid), so the
exclusion looks like it only considers *paid* orders — which means the same bid can be
ordered twice and the buyer can be charged twice for one win.

**Where to see it.** Buyer → **My Biddings**, the won/checkout basket,
[src/app/(main)/buyer/my-biddings/page.tsx](src/app/\(main\)/buyer/my-biddings/page.tsx)
(service call in [bidService.ts:332](src/services/bidService.ts#L332)).

**Possible fix.** Exclude any bid already attached to an order, whatever that order's status
— filter on "an order references this bid", not on the order's payment state. If unpaid
orders are meant to expire and free the bid again, then release it explicitly on expiry
rather than leaving it selectable in the meantime.

---

### 14. Bookings are never released ✅ FIXED (01 Sep 2026)

> **Result.** Nothing is stuck at `confirmed` any more. Of 10 bookings, 5 are `completed`
> (including `6a78810f381428c5e639f82d`, whose trip is delivered) and 5 are
> `pending_payment`. Create Trip opens and its fleet dropdown lists all 5 fleets, so the
> manual flow is reachable again; picking a fleet shows "No confirmed bookings on this
> fleet", which is now the correct empty state because nothing is currently
> paid-and-awaiting-a-trip. Still unproven: that a genuinely `confirmed` booking renders —
> that needs a paid fleet booking on the test account. Original report follows.

**The problem.** Unchanged since 10 Aug. Four bookings sit at `confirmed` against fleets
whose trips are `delivered` (e.g. booking `6a78810f381428c5e639f82d`, fleet
`6a786e7bd9239f0a4de4eb3c`). Nothing ever moves a booking to a completed state, so the pool
of "bookings still needing a trip" only ever grows.

**Where to see it.** Transporter → **Create Trip** (manual flow),
[CreateFleetTripModal.tsx](src/app/\(main\)/transporter/_components/CreateFleetTripModal.tsx)
opened from
[BookingTripsView.tsx:586](src/app/\(main\)/transporter/_components/BookingTripsView.tsx#L586).
The booking dropdown is empty — there is no selectable booking, so a trip cannot be created
by hand at all.

**Possible fix.** Close the loop the same way the fleet release was done: when a trip
reaches `delivered`, move its booking to `completed` (or `released`). And make the endpoint
that feeds the Create Trip dropdown return bookings that are genuinely awaiting a trip,
rather than every `confirmed` row ever created.

---

## Found 02 Sep 2026 — UI ↔ API parity run

Found by creating data through the API and checking it on the screen that renders it, so each
item below has a known-correct starting value. Full evidence and screenshots:
[`UI-API-PARITY-RESULTS-2026-09-02.md`](UI-API-PARITY-RESULTS-2026-09-02.md).

### 20. `PUT`/`PATCH /api/products/{id}` wipes the category when the body omits it — **critical**

**The problem.** A partial update that does not mention `categories` clears `category`,
`subcategory` **and** `categories`. Other omitted fields survive, so this is specific to the
category fields rather than a general full-replace. Both calls return **200** — nothing tells
the caller that data was destroyed.

```
after POST (all fields sent)   price=500 qty=9 cat="Vegetables" cats=["Vegetables","Tomato"]
after PUT {price:777} only     price=777 qty=9 cat=null         cats=[]
after PATCH {price:888} only   price=888 qty=9 cat=null         cats=[]
```

**Where to see it.** Agent → **Produce List** → open a product → Edit → change only the price →
Save. The modal reports "Product updated successfully" and the category is gone. Reproduced
end-to-end in Chrome. The **Restock** button on the agent dashboard does the same, because
`updateProductStatus` sends `{ status }` alone.

**This has already damaged live data.** 5 of 21 live products have no category — `QA AGENT4
White Maize`, `Cocoa`, `Corn`, `Beans` — and the agent dashboard's own chart reads
*Most Sold Categories — Grains 68%, Tubers 26%, **Uncategorized 6%***. Four of the five products
in the dashboard's "Out of Stock" panel sit behind a Restock button that triggers it.

**Possible fix.** Treat an omitted key as "leave unchanged" rather than "clear", the same way
`quantity` and `images` are already treated. A one-off migration cannot recover the lost values,
so this wants fixing before more edits happen. We will also send `categories` on both frontend
call sites as defence in depth.

### 21. `unit` is not stored as sent — **high**

**The problem.** `bags` is stored as `50kg_bag` and `packet` as `kg`, both on a `201`. The
substitution is not consistent between POST and PUT (`PUT {unit:"packet"}` stored `100kg_bag`
where POST stored `kg`). An unknown value such as `crate` is correctly rejected with a 400, so
these two are being rewritten deliberately.

The record ends up self-contradictory. An agent picks "Bag" and states 25 kg per bag:

```
SENT  : unit=bags     unitWeightKg=25 quantity=10
STORED: unit=50kg_bag unitWeightKg=25 quantity=10
```

The UI then labels it "10 50kg bags" while the stored weight is 25 kg each, and transport
pricing multiplies `unitWeightKg × quantity` — so the label and the freight cost disagree by 2×.

**Note this reverses a fix.** The 18 Aug entry below records that "`bags` and `packet` are
creatable again". They are accepted, but they are no longer *stored*.

**Possible fix.** Either store `unit` as sent, or reject the value with a 400 the way `crate` is
rejected. Silently substituting a different unit on a success response is the worst of the three.

### 22. `GET /api/transporters/{id}/reviews` 400s for every transporter — **high**

Rejects the ids the API's own list endpoint returns:

```
GET /api/transporters?limit=5 -> 200, 2 transporters
  rufai wale    id=6988b3b0e7c550daf1640bfb  reviews -> 400 {"message":"Invalid transporter id"}
  Kade Alyser   id=696f6c0a719a3fcdb97c3e16  reviews -> 400 {"message":"Invalid transporter id"}
```

The reviews section on **every** transporter profile is therefore permanently unreachable, while
the profile still advertises a star rating. Buyer → Transporters List → any transporter.

### 23. `PATCH /api/orders/{id}/status` 400s for every order — **high**

Same shape as item 22, and likely the same id-validation defect. Order ids taken straight from
`GET /api/orders` are rejected:

```
PATCH /api/orders/{id}/status {status:processing} -> 400 {"message":"Invalid order id"}
PATCH /api/orders/{id}/status {status:shipped}    -> 400 {"message":"Invalid order id"}
PATCH /api/orders/{id}/status {status:delivered}  -> 400 {"message":"Invalid order id"}
```

### 24. Malformed id returns `500` with an empty body — **medium**

```
GET /api/products/not-an-id -> 500  (body: "")
GET /api/orders/not-an-id   -> 500  (body: "")
```

A valid-but-absent id is handled correctly (`404 {"error":"Product not found"}`), so only the
id cast is unguarded. An empty body gives the client nothing to show. A `400 "Invalid product
id"` would match how the other endpoints already behave.

### 25. `POST /api/bids` returns `500` with an empty body on specific products — **medium**

Deterministic across repeated runs — the same 3 of 7 other-seller products always fail:

```
Bagged Beans  ...a7f8dc -> 500      Beans        ...0bfb98 -> 201
Fresh Maize   ...287207 -> 201      Fresh Maize  ...d86986 -> 201
Beans         ...0ce62e -> 500      Fresh Maize  ...a7c950 -> 201
Millet        ...0ce615 -> 500
```

Not owner-, category-, status- or duplicate-related: `Bagged Beans` and `Fresh Maize` share an
owner and a farmer, and re-bidding on a product already bid on returns 201.

---

## Item 9 re-opened, 02 Sep 2026 — the signup mailer now blocks all new accounts

### 9b. `POST /api/auth/register` — verification email never sends — **critical**

Item 9 was recorded and deferred as "no action expected". Its impact is larger than that note
suggests, so it is being raised again with the full chain measured.

**Endpoint.** `POST https://tractive-be.vercel.app/api/auth/register`
(client: [`src/utils/signupAuth.ts:49`](../src/utils/signupAuth.ts#L49))

**The problem.** Registration succeeds but the verification email never leaves, and **there is
no way for the user to recover**. All three steps measured on 02 Sep 2026:

```
POST /api/auth/register            -> 201 {"message":"User registered. Verification email could not be sent right now.",
                                            "emailVerificationSent": false}
POST /api/auth/resend-verification -> 200 {"ok":true,"resent":true,"emailSent":false,
                                            "message":"Verification code was refreshed, but the email could not be sent right now."}
POST /api/auth/login               -> 403 {"error":"Please verify your email before logging in."}
```

Reported independently by the product owner for `lapatkolin@gmail.com` (id
`6a97f865b284debd07535942`), and reproduced here on a fresh address.

**Why it is worse than "deferred".** The user cannot verify (no email), cannot resend (that
mailer is down too), and cannot log in (403). **Every account created since the mailer broke is
permanently locked out, and no new user can onboard at all.** The account rows are being created,
so the database is accumulating unusable accounts.

**Likely the same root cause as the password-reset complaint** (item 9c) — both go through the
same transport.

**Possible fix.** Restore the mail transport (credentials/quota/sender-domain verification are
the usual causes of a send that fails without failing the request). Two things worth adding
regardless: surface `emailVerificationSent: false` to the user at signup instead of a plain
success, and provide an admin-side verify or a verification link the support team can hand out
so the accounts already stranded can be recovered.

### 9c. `POST /api/auth/forgot-password` — reset email presumed undelivered

**Endpoint.** `POST /api/auth/forgot-password`
(client: [`src/utils/foegetPasswordAuth.ts:13`](../src/utils/foegetPasswordAuth.ts#L13))

The endpoint itself behaves correctly and **does not need changing**: it returns the same
`200 {"message":"If your email exists, you will receive a reset link."}` for a real address, the
product owner's address, and an address that does not exist — which is the right anti-enumeration
behaviour.

That also means the response cannot tell us whether the mail was sent. Given that `register` and
`resend-verification` both explicitly report the mailer is down, the reported "forget password is
not working" is almost certainly the same failure: the API accepts the request, the email never
arrives. **Confirming this needs a mail-server log**, which is why it is filed here rather than as
a separate defect.

One thing that would help either way: `forgot-password` could log the send result server-side so
a failed send is visible without changing the user-facing response.

> **Frontend side of the same complaint — already fixed here, no backend action needed.**
> `POST /api/auth/reset-password` requires `confirmPassword`, and the client was sending only
> `{ token, password }`, so the reset failed with
> `400 "Token, password, and confirm password are required"` *before the token was checked* —
> the reset page could never have worked even with a valid emailed link. The form already
> collected and matched the field; only the request body dropped it. Fixed in
> [`src/utils/resetPasswordAuthApi.tsx`](../src/utils/resetPasswordAuthApi.tsx). Verified: with
> `confirmPassword` present the request reaches the token check
> (`400 "Invalid or expired reset token"` for a bogus token, as expected).

---

## Not retested

### 4. Two disagreeing status fields — looks fixed

Every trip now reports `status` and `transportStatus` in agreement
(`delivered`/`delivered`). No trip is mid-lifecycle on the test account, so the `picked`
transition itself is still untested — the transporter tabs are where a disagreement would
show up again.

### 8. `POST /api/transporters/fleets` — no capacity or price validation

Not retested; it needs a fleet created against live data. Screen:
[Fleet List](src/app/\(main\)/transporter/fleet-list/page.tsx) → Add Fleet. Expected fix is
server-side bounds on capacity and price so values like `399999999998900` kg cannot be
stored.

### 17. `GET /api/buyers/biddings/won/checkout` — intermittent 500

Not reproduced in this pass. Intermittent by nature; leave on watch. Same screen as item 10,
Buyer → My Biddings.

### 9. Signup mailer — **deferred by the product owner**

Recorded only; no action expected.

---

## Frontend integration done off the back of this (18 Aug 2026)

- **`refreshToken` now reaches the browser**
  ([src/lib/auth.ts](src/lib/auth.ts), [src/lib/axios.ts](src/lib/axios.ts),
  [src/types/next-auth.d.ts](src/types/next-auth.d.ts)). Item 13 was only half the fix: the
  backend sets the refresh token as an httpOnly, `SameSite=Lax` cookie on its own origin,
  and our login runs server-side inside NextAuth's `authorize`, so that cookie never reaches
  the browser and could never be sent cross-site anyway. `POST /api/auth/refresh` with an
  empty body still returns `400 "Refresh token required"` from the browser — verified in
  Chrome. The token from the login response body is now carried through the NextAuth JWT and
  session and sent in the request body; the same call then returns `200` with a fresh token.
- **Negotiations fetch simplified**
  ([src/services/negotiationService.ts](src/services/negotiationService.ts)). The per-fleet
  fan-out that worked around item 19 is gone; one request to
  `GET /api/transporters/negotiations` now serves the screen.
- **Unit labels** ([src/utils/productUnits.ts](src/utils/productUnits.ts) and the My Orders
  card and detail modal). `bags` and `packet` are creatable again, and a quantity now reads
  "50 100kg bags" rather than the raw `50 100kg_bag`.
- **Kept as workarounds:** the client-side status re-filter in `BookingTripsView` (item 3
  above), and the derived notification links in
  [Notifications.tsx](src/components/Notifications.tsx) — the API still sends no `link`
  field.
