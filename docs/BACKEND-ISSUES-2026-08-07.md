# Backend issues — 07 Aug 2026

For the backend team. Every item below was reproduced live against
`https://tractive-be.vercel.app` and includes the exact request, the response we got,
and what we expected instead.

Accounts used: `i59mv8titr@lnovic.com` (buyer + agent + transporter),
`ibrahim.saliman.zainab@gmail.com` (admin).

Priority order:

| # | Issue | Severity |
|---|---|---|
| 1 | Order totals are wrong by a factor of `quantity` | **Critical — money** |
| 2 | A fleet is never released after delivery — bookable only once, ever | **Critical — blocks trade** |
| 3 | `fleet-trips?status=` filter returns the wrong trips | High |
| 4 | Marking a trip `picked` writes two disagreeing fields | High |
| 5 | An order never reflects that it was delivered | High |
| 6 | ~~Transporters cannot see their own fleet payments~~ — worked around on the frontend; an aggregate endpoint is still wanted | Low (was High) |
| 7 | A user can trade with themselves | Medium |
| 8 | No validation on fleet capacity or price | Medium |
| 9 | Signup mailer (deferred, but recorded) | Critical when resumed |
| 10 | `won/checkout` still returns a bid after an order was created from it | High — double-ordering |
| 11 | `POST`/`PATCH`/`PUT /api/products` reject `unit` values the products table already holds — three vocabularies disagree, incl. the spec | High — a whole category cannot be listed |
| 12 | `POST /api/products` accepts a product with no images | Medium |
| 13 | `POST /api/auth/refresh` always 400s — a session can never be refreshed | Medium |
| 14 | Fleet **bookings** are never released either, so manual Create Trip is permanently unreachable — the other half of item 2 | High |

---

## 1. Order totals are wrong by a factor of `quantity` — CRITICAL

### The problem in one line

A bid's `amount` is a **price per unit**, but the server treats it as **the total price
for the whole lot**.

### Reproduction — single accepted bid, nothing else in the cart

```http
GET /api/buyers/biddings/won/checkout
Authorization: Bearer <buyer token>
```

Bid in the response:

```json
{
  "product":  { "name": "Sweet Potatoes (Orange Flesh)", "price": 700 },
  "amount":   680,
  "quantity": 1000,
  "unit": "kg",
  "unitWeightKg": 1
}
```

Totals in the same response:

```json
{ "productsSubtotal": 680, "localTransportTotal": 0, "totalAmount": 680 }
```

**₦680 for one tonne of sweet potatoes.** Expected `680 × 1000 = ₦680,000`.

Confirmed again on a freshly created product with round numbers — list price ₦1,000/kg,
bid ₦1,000/kg, quantity 100 kg — checkout returned **₦1,000** instead of ₦100,000.

### The formula currently in use

```
unitPrice        = bid.amount / bid.quantity      // 680 / 1000 = 0.68
lineSubtotal     = bid.amount                     // 680
productsSubtotal = Σ bid.amount
totalAmount      = productsSubtotal + localTransportTotal
```

`unitPrice` therefore comes out as **₦0.68 per kilogram**, which is self-evidently wrong
and is the clearest signal the semantics are inverted.

### It is enforced, so a partial fix will break checkout

`POST /api/orders` validates the client's `totalAmount` against this same formula:

```http
POST /api/orders
{ "products":[{"product":"6a749ed8…","quantity":1000}],
  "bidIds":["6a749fc6…"], "totalAmount": <see below> }
```

| `totalAmount` sent | Response |
|---|---|
| `1` | `400 {"success":false,"message":"Total amount does not match accepted bids"}` |
| `680000` ← the correct figure | `400 {"success":false,"message":"Total amount does not match accepted bids"}` |
| `680` | `201 Created`, `unitPrice: 0.68`, `lineSubtotal: 680` |

Good news: **the client cannot tamper with the price** — that guard is sound. But it is
built on the wrong formula, so **the computation and the validation must change in the
same deploy** or every checkout will start returning 400.

### Why `amount` is per-unit and not a lot total

Four independent signals from the product itself:

1. The bid form labels the field **"Proposed Price (₦)"** and places it directly beside
   **"Quantity (kg)"**.
2. The product page shows the list price `₦1,150` and, on the same card,
   `Leading: ₦1,150`. A leading bid is only comparable to a list price if both are
   per-unit.
3. The agent's bids table has adjacent **Price** (`₦950`, the product's per-unit price)
   and **Leading** (`₦900`, the bid amount) columns.
4. The order line model already stores `quantity`, `unitPrice` **and** `lineSubtotal` as
   three separate fields. If `amount` were the lot total, `unitPrice` would be a
   meaningless derived fraction — which is exactly what it is today.

### Requested change

```
unitPrice           = bid.amount
lineSubtotal        = bid.amount * bid.quantity
productsSubtotal    = Σ lineSubtotal
localTransportTotal = Σ (product.localTransport.required ? product.localTransport.fee : 0)
totalAmount         = productsSubtotal + localTransportTotal
```

Apply in all three places together:

- `GET /api/buyers/biddings/won/checkout` — `productsSubtotal`, `totalAmount`
- `POST /api/orders` — `unitPrice`, `lineSubtotal`, `totalAmount`
- the `totalAmount` guard inside `POST /api/orders`

No frontend change is needed; the UI renders whatever the API returns.

### Knock-on effects to plan for

- **Existing orders are wrong in the database.** Legacy rows were placed with bid amounts
  that look like lot totals, so a blanket `× quantity` migration would inflate them. These
  need a manual pass or a write-off decision — please tell us which and we will adjust.
- **Commission is derived from the total** (`commissionRate: 0.1`), so every stored
  `commissionAmount` is wrong by the same factor.
- **Transport pricing is not affected** — the fleet payment computed ₦250,000 from
  5,000 kg correctly. That path uses `weight × pricePerKg` and is fine.

---

## 2. A fleet is never released after delivery — CRITICAL, blocks all further trade

### The problem

When a trip completes, the fleet carrying it is never returned to service. Its capacity
is not given back and its status is not reset, so **a whole-truck fleet can be booked
exactly once in its lifetime.**

This is not theoretical — it currently blocks every fleet on our test transporter. We
could not create a new trip at all.

### Evidence

All five trips on transporter `6988b3b0e7c550daf1640bfb` are `delivered`:

```http
GET /api/transporters/fleet-trips  ->  5 trips, every one "delivered"
```

Yet every one of that transporter's four fleets is unbookable:

```http
GET /api/transporters/trucks?transporterId=6988b3b0e7c550daf1640bfb

{ "_id": "69fb76bbe9b0c1859d580c5d", "status": "available",         "capacityKg": 40000 }
{ "_id": "69c942bcf41a272cfa476795", "status": "available",         "capacityKg": 4e14  }
{ "_id": "69a67ace96f7df1573952158", "status": "on_transit",        "capacityKg": 18000 }   ← trip delivered
{ "_id": "69a6762796d6912191ec3a66", "status": "under_maintenance", "capacityKg": 20000 }
```

Attempting to book each in turn, as a buyer, through the UI:

| Fleet | Result |
|---|---|
| North Route (Abia→Anambra) | `409 {"message":"This fleet only accepts whole-truck bookings and is already reserved or in use"}` |
| West Route (Oyo→Borno) | UI shows **Space Remaining: 0.01 tons** — Pay button not actionable |
| Olando (Kwara→Yobe) | `409 … already reserved or in use` — **despite `status: "available"`** |
| North Route (Kaduna→Lagos) | UI shows **Full Load: 0 tons** — Pay button not actionable |

Two distinct defects here:

1. **`status` is not reset.** Fleet `69a67ace` is still `on_transit` although its trip is
   `delivered`.
2. **The reservation/capacity is not released.** Fleet `69c942bc` reports
   `status: "available"` and still 409s as "already reserved or in use", so the 409 is
   driven by a booking record that outlives the delivered trip. Likewise the two fleets
   showing 0 / 0.01 tons remaining never got their capacity back.

### Requested change

When a trip transitions to `delivered` (or `cancelled`), in the same operation:

- release the booking/reservation that pins the fleet,
- restore `availableCapacityKg` to the fleet's full `capacityKg`,
- reset `status` from `on_transit` back to `available`.

Please confirm whether `status` and the reservation are meant to be two independent
things — if a fleet can be `available` and still reserved, we need to know which one the
booking check actually consults so the UI can show the truth.

---

## 3. `GET /api/transporters/fleet-trips?status=` returns the wrong trips — HIGH

At the time of testing **all four** of this transporter's trips were `delivered`:

```http
GET /api/transporters/fleet-trips                     -> 4 trips, all status "delivered"
GET /api/transporters/fleet-trips?status=picked       -> 4 trips, all status "delivered"   ← wrong
GET /api/transporters/fleet-trips?status=delivered    -> 4 trips                            ← correct
GET /api/transporters/fleet-trips?status=planned      -> 0
GET /api/transporters/fleet-trips?status=on_transit   -> 0
GET /api/transporters/fleet-trips?status=loaded       -> 0
```

The transporter's **Picked** tab was therefore listing four already-delivered trips.

It is not "at least this stage" semantics either — if it were, `?status=on_transit` would
also have returned 4, and it returned 0.

**Expected:** `?status=X` returns only trips currently in state `X`.

We have added a client-side re-filter as a stopgap, but the API should be the source of
truth here.

---

## 4. Marking a trip `picked` writes two disagreeing fields — HIGH

```http
PATCH /api/transporters/fleet-trips/{tripId}/status
{ "status": "picked" }
-> 200 { "status": "loaded",     "transportStatus": "picked" }        ← disagree

PATCH … { "status": "on_transit" }
-> 200 { "status": "on_transit", "transportStatus": "on_transit" }    ← consistent

PATCH … { "status": "delivered" }
-> 200 { "status": "delivered",  "transportStatus": "delivered" }     ← consistent
```

Only `picked` fails to update `status`, and it writes `"loaded"`, a value that is not in
the documented status set. A trip in this state matched no tab in our UI until we special-cased it.

**Expected:** either `status` and `transportStatus` always agree, or **tell us which one
is canonical** and we will read only that. We would prefer a single field.

---

## 5. An order never reflects that it was delivered — HIGH

After a trip carrying an order reached `delivered`:

```json
{
  "_id": "6a75d7825c88e28a8551fe6c",
  "status": "paid",                 ← unchanged
  "transportStatus": "delivered",
  "deliveredAt": "2026-08-07T…"
}
```

`OrderStatus` already includes `delivered` in the type, but nothing ever sets it from the
transport flow. The consequence was that the agent's "Delivered" tab
(`GET /api/orders?status=delivered`) returned nothing forever and delivered orders stayed
under "Packed" (`status=paid`).

**Question we need answered:** is `order.status` meant to advance to `delivered` when the
trip completes, or is `transportStatus` the only place delivery lives? We have made the
frontend accept either, but the two fields should not silently disagree.

If `order.status` should advance, please also make `GET /api/orders?status=delivered`
return those orders.

---

## 6. Transporters cannot see their own fleet payments — ~~HIGH~~ → LOW (see correction)

```http
GET /api/transporters/transactions
Authorization: Bearer <transporter token>
-> 200, 4 rows:
   { "status": "approved", "amount": 1680,    "createdAt": "2026-08-07" }
   { "status": "approved", "amount": 2000,    "createdAt": "2026-08-07" }
   { "status": "approved", "amount": 304000,  "createdAt": "2026-05-06" }
   { "status": "approved", "amount": 3610000, "createdAt": "2026-04-02" }
```

These are **product-order transactions**, not fleet payments. The transporter's own fleet
payments — ₦250,000 and ₦4,000,000, both created and then approved during this run — do
not appear here at all, and `GET /api/admin/fleet-payments` is admin-only:

```http
GET /api/admin/fleet-payments   (transporter token)
-> 403 {"success":false,"message":"Admin access required"}
```

Their Transactions → Pending tab was permanently empty as a result.

### Correction — 08 Aug 2026

The original wording said there was **no** endpoint. That is too strong. There is no
*aggregate* one, but the **per-fleet** endpoint is transporter-scoped and works:

```http
GET /api/transporters/fleet/69a67ace96f7df1573952158/payments   (transporter token)
-> 200 { "success": true, "data": [ { "amount": 250000, "loadWeightKg": 5000,
                                      "status": "approved", "buyer": {...} } ] }
GET /api/transporters/fleet/69bfd5b5eb7e03e198614c08/payments
-> 403 {"success":false,"message":"Not authorized for this fleet"}   ← not their fleet
```

The frontend now lists the transporter's fleets and fans out over that endpoint, so the
Pending/Approved tabs are populated (0 → 5 pending, 4 → 8 approved). **The bug is no
longer user-visible.**

**Request (still worth doing, re-scoped):** an aggregate transporter-scoped endpoint, e.g.
`GET /api/transporters/fleet-payments?status=pending|approved`. The current workaround
costs one request per fleet, which will not hold up for a transporter with a real fleet
count.

---

## 7. A user can trade with themselves — MEDIUM

One account holding `["buyer","agent","transporter"]` was able to bid on its own product,
counter its own bid, accept it, order from itself and transport it. Every bid created in
this run has an identical buyer and agent:

```json
{ "buyer": "6988b3b0e7c550daf1640bfb", "agent": "6988b3b0e7c550daf1640bfb", "amount": 1000 }
```

**Expected:** `POST /api/bids` should reject a bid where the bidder owns the product.
Useful for us in testing, but it should not be possible in production.

---

## 8. No validation on fleet capacity or price — MEDIUM

```json
{ "_id": "69c942bcf41a272cfa476795",
  "pricingModel": "flat_rate_whole_truck",
  "capacityKg": 400000000000000,     ← 400 billion tonnes
  "pricePerKg": 0 }
```

This renders in the UI as *"Full Load: 400,000,000,000 tons"* and *"Per Kg: ₦0"*. Please
bound `capacityKg` to something physical and reject `pricePerKg <= 0` on create/update.

Related note, not a bug: all four fleets on this transporter are
`flat_rate_whole_truck`, so booking a 100 kg order onto one charged the full ₦4,000,000
flat rate. Expected given the pricing model, but worth confirming that is intended.

---

## 9. Signup mailer — DEFERRED by the product owner, recorded here

Not being worked on right now, but it is a production-blocking defect and should not get
lost.

```http
POST /api/auth/register           -> 500, and the user row is created anyway
POST /api/auth/register (again)   -> 409 {"error":"User already exists"}
POST /api/auth/login              -> 403 {"error":"Please verify your email before logging in."}
POST /api/auth/resend-verification-> 500
POST /api/auth/request-verification -> 200 {"message":"Verification code sent"}   ← works
```

Net effect: a new user gets a server error, no email arrives, they cannot re-register and
cannot log in. **Every new signup is permanently bricked.**

Timings suggest a mailer exception on two of the three paths — `register` fails after
~2.4s and `resend-verification` after ~1.8s, while `request-verification` succeeds in
~1.9s. Three code paths, one working.

Two asks when this is picked up:

1. Find why the mailer throws on `register` and `resend-verification` but succeeds on
   `request-verification`.
2. Do not return 500 after the user row has been committed — either roll back, or return
   201 and surface the mail failure separately, so the account is not left unreachable.

Accounts currently stuck unverified from our testing:
`muhajdev@gmail.com`, `muhajdev+buyer@`, `muhajdev+agent@`, `muhajdev+transporter@`,
`probe.tractive.qa1@mail.tm`, `muhaj.dev.qa1@gmail.com`, `timing.probe.9931@gmail.com`,
`qa.flow.probe.8821@example.invalid`.

---

## 10. `won/checkout` keeps returning a bid after an order was created from it — HIGH

Added 08 Aug 2026.

### The problem in one line

`GET /api/buyers/biddings/won/checkout` still lists a won bid after `POST /api/orders`
has consumed it, so the same bid can be checked out again and again.

### Reproduction — a single bid, start to finish, 08 Aug 2026

```http
POST /api/bids                       -> 201  bid 6a76dc3ea6133da574ba92d9
                                             amount 1050, quantity 10, status "pending"
PATCH /api/bids/6a76dc3ea6133da574ba92d9  -> 200  status "countered", counterOffer 1100
   (buyer accepts the counter)            -> 200  status "accepted"

GET  /api/buyers/biddings/won/checkout -> 200  bids: [6a76dc3ea6133da574ba92d9]   ← correct

POST /api/orders                       -> 201  order 6a76df00…, "bidIds": ["6a76dc3ea6133da574ba92d9"]

GET  /api/buyers/biddings/won/checkout -> 200  bids: [6a76dc3ea6133da574ba92d9]   ← STILL THERE
                                             { amount: 1050, quantity: 10, status: "accepted" }
```

The order itself is created correctly and shows up under the buyer's unpaid orders. Only
the won-bids list fails to drop the bid.

### What the user sees

The **Ready to checkout** tab keeps its count after checkout — it read `1` before the
order and `1` after. Nothing stops the buyer pressing Checkout again and creating a
second order for a bid they have already ordered.

We confirmed this is not a client cache: the frontend now invalidates and refetches
`won/checkout` immediately after `POST /api/orders` (previously it invalidated nothing —
that was our bug and it is fixed). The refetch is a fresh `200` and the bid is still in
the response body.

### Requested change

Exclude bids that already appear in some order's `bidIds` from
`GET /api/buyers/biddings/won/checkout` — or give the bid a terminal state
(`ordered` / `fulfilled`) when an order consumes it, and filter on that.

Please also make `POST /api/orders` reject a `bidIds` entry that is already attached to
an existing order, so a double submission cannot create a duplicate order for the same
bid.

---

## 11. `POST /api/products` rejects units that exist in the products table — HIGH

Found 08 Aug 2026 while listing a product through the agent UI for the first time.

### The problem in one line

The create endpoint validates `unit` against a vocabulary that **disagrees with the data
the database already holds**, so 32% of existing products could not be re-created through
the API that serves them.

### Reproduction

```http
POST /api/products
{ "name": "QA AGENT2 Sorghum", "unit": "bags", "quantity": 40, "unitWeightKg": 75, ... }

-> 400
{"error":"Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"}
```

`bags` is not an invented value — six live products use it.

### The mismatch, measured

`GET /api/products?page=1&limit=200` on 08 Aug 2026 returned 22 products:

| unit | products using it | accepted by `POST /api/products` |
|---|---|---|
| `kg` | 13 | ✅ |
| `bags` | **6** | ❌ **rejected** |
| `100kg_bag` | 2 | ✅ |
| `packet` | **1** | ❌ **rejected** |
| `50kg_bag` | 0 | ✅ accepted, used by nothing |
| `tonne` | 0 | ✅ accepted, used by nothing |

**7 of 22 products (32%)** hold a unit the create validator rejects. The seven:

```
bags     millet          69ce7729e6b492b3124f2b99
bags     Beans           69ce6de207ef993643990309
bags     Bagged Beans    69ce53c9f0d189f83ba7f8dc
bags     Garri           69c0b72bc11cf3d869dcb93c
bags     Beans           69984a674e9fb165710ce62e
bags     Millet          699847474e9fb165710ce615
packet   spageetii       69cc956b8d1849159d6f0e49
```

Meanwhile `50kg_bag` — which the validator accepts — appears in no product and, until
this was found, in no frontend dropdown either.

### What the user saw

An agent picking **Bag** — the natural unit for beans, millet or garri, and the unit six
existing listings already use — filled in the whole two-step form, attached an image, and
got a 400 on submit. There is no way to list a bagged product at all.

### Requested change

Decide which vocabulary is canonical and make the create validator and the stored data
agree. Either:

1. **Accept what you store** — add `bags` and `packet` to the accepted set. Smallest
   change, no migration, matches how agents actually describe goods; or
2. **Migrate and narrow** — map `bags` → `50kg_bag`/`100kg_bag` and `packet` → a kept
   value, migrate the 7 rows, then keep the strict validator.

Option 1 unless there is a reason the enum was narrowed deliberately. If it was
deliberate, the 7 existing rows are already invalid and need the migration in option 2 —
they cannot just be left.

### Answered 09 Aug: yes, `PATCH` and `PUT` share the validator

Tested directly against the API, on a product this testing effort created
(`6a7788c8ba0438019d691431`, `unit: 100kg_bag`):

```http
PATCH /api/products/6a7788c8ba0438019d691431   {"price":2500}
-> 200                                          ← no unit in the body: fine

PATCH /api/products/6a7788c8ba0438019d691431   {"unit":"bags","unitWeightKg":75}
-> 400 {"error":"Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"}

PUT   /api/products/6a7788c8ba0438019d691431   {"unit":"bags","unitWeightKg":75}
-> 400 {"error":"Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"}
```

So the practical position for the 7 legacy `bags`/`packet` products:

- They **can** be edited today, but only because the frontend's edit payload
  (`UpdateProductData`) happens to omit `unit` entirely — it sends only name,
  description, price, quantity, images, videos.
- They **cannot have their unit corrected**, even to a value the validator accepts.
- **Any client that follows your own spec will break on them.** `PUT /api/products/{id}`
  is documented as *"Replace/update product"* and its request body is the **full
  `Product` schema**. A client doing a read-modify-write — fetch the product, change the
  price, send it back — includes `unit: "bags"` and gets a 400. That is the natural way to
  use a PUT, and it fails on 32% of the catalogue.

This is why we would push for option 1 (accept what you store).

### The spec documents a *third* vocabulary

`/docs/openapi.yaml`, `Product` schema:

```yaml
unit:
  type: string
  description: Measurement unit for the quantity, for example `kg`, `ton`, or `bag`.
unitWeightKg:
  type: number
  nullable: true
  description: Required when `unit` is `bag`. Defines how many kilograms one bag represents.
```

So there are now **three disagreeing vocabularies** for one field:

| Source | Values |
|---|---|
| `openapi.yaml` (documented) | `kg`, `ton`, `bag` |
| create/update validator (enforced) | `kg`, `tonne`, `50kg_bag`, `100kg_bag` |
| the products table (stored) | `kg`, `bags`, `100kg_bag`, `packet` |

Not one value except `kg` appears in all three. `ton` vs `tonne`, `bag` vs `bags` vs
`50kg_bag`/`100kg_bag` — these are three different singular/plural and granularity
conventions.

Note also that `unit` is declared as a plain `type: string` with **no `enum`** anywhere in
the spec, so nothing generated from it could know the real constraint. Whatever set you
settle on, please add it as a proper `enum` on the `Product` schema — then this class of
mismatch becomes impossible to reintroduce, and the fleet-payment endpoint's separate
"supported shipment units" prose (`kg`, `ton/tons`, `bag`) can reference the same list.

### Frontend position in the meantime

The Add-to-store picker now offers only units the API accepts (`kg`, `50kg_bag`,
`100kg_bag`, `tonne`), because offering "Bag" and letting every submission 400 is worse
than not offering it. `bags` and `packet` are retained in
`src/utils/productUnits.ts` behind an `acceptedByCreateApi: false` flag — flipping those
two flags restores them to the dropdown as soon as the backend accepts them.

### Related, minor

`GET /api/products/{id}` took **9 seconds** for a single product by id (measured twice,
warm frontend). It blocks the agent's Edit modal on every open. Worth a look at the query.

---

## 12. `POST /api/products` accepts a product with no images — MEDIUM

### The problem

The create endpoint accepts `images: []` and stores the product as `available`. A
marketplace listing with no photograph goes live, and buyer cards render a generic
placeholder — so the listing looks broken rather than merely incomplete.

Reproduced 08 Aug 2026 simply by not attaching a file: the frontend sent `images: []` and
the API returned **201**.

### Requested change

Reject `POST /api/products` when `images` is missing or empty:

```json
400 { "error": "At least one product image is required" }
```

Please apply the same rule to `PUT /api/products/{id}` so an edit cannot empty the array
either, and consider whether existing image-less products should be flagged or hidden
rather than shown as `available`.

### The frontend already enforces this — 09 Aug 2026

At the product owner's instruction, step 1 of Add-to-store now refuses to advance without
at least one image ("Please add at least one image of the product", `role="alert"`, and the
section label is marked `*`). Verified in the live UI.

**This is a client-side guard only and must not be relied on.** It stops the app's own
form; it does nothing about direct API calls, other clients, or a future screen that
forgets the check. The server-side rule is still needed — that is why this item is here.

---

## 13. `POST /api/auth/refresh` always fails — a session can never be refreshed — MEDIUM

### The problem

When the access token ages out, the frontend calls the refresh endpoint and it always
fails, so the session cannot recover and the user is silently logged out mid-task.

Seen repeatedly on 08–09 Aug, including immediately after a successful fleet creation:

```http
GET  /api/profile          -> 401
POST /api/auth/refresh     -> 400 {"error":"Refresh token required"}
```

### What we need to know

The request goes out with an empty body (`{}`) and no refresh token. We cannot tell from
here whether:

1. the endpoint expects the refresh token in the **body** and the frontend is not sending
   it (a frontend bug we will fix), or
2. it expects an **httpOnly cookie** that login never sets (a backend bug), or
3. login is supposed to return a `refreshToken` in its response and does not.

`POST /api/auth/login` returns a `token`; we did not observe a separate `refreshToken`.
**Please confirm the intended contract** — where the refresh token comes from and where it
should be sent — and we will match it on the client. If login is meant to issue one, that
is the missing piece.

`/docs/openapi.yaml` does not document the refresh flow, so there was nothing to check
against. Please add it.

### Impact

An expired session currently surfaces as an empty screen rather than a re-login prompt: a
transporter's 5-row fleet list rendered as 0 rows with no message. We will fix the
frontend's half (treat 401 as an error state, not as "no data"), but the refresh path
itself needs the contract settled first.

---

## 14. Fleet bookings are never released either — HIGH (the other half of item 2)

Item 2 covers fleets never being released after delivery. The same is true of **bookings**,
and it has a separate consequence: **manual trip creation is permanently unreachable.**

Probed every fleet on transporter `6988b3b0e7c550daf1640bfb` on 09 Aug through the Create
Trip UI, which lists `GET /api/transporters/fleet/{id}/bookings?status=confirmed`:

```
West Route Fleet  69fb76bbe9b0c1859d580c5d  "claister • 5kg • already on a trip"
Olando            69c942bcf41a272cfa476795  "Sweet Potatoes…, QA CLEAN1… • 1100kg • already on a trip"
North Route Fleet 69a67ace96f7df1573952158  "Premium White Maize… • 5000kg • already on a trip"
North Route Fleet 69a6762796d6912191ec3a66  "Beans • 3000kg • already on a trip"
```

Every confirmed booking still carries a `fleetTripId` pointing at a trip that was delivered
weeks ago. The frontend correctly refuses to bundle them again (it would double-dispatch), so
the transporter can never create a trip by hand — only the automatic one that fleet-payment
approval produces.

### Requested change

When a trip reaches `delivered` or `cancelled`, clear the association on its bookings (or
give the booking a terminal state such as `completed` and exclude those from
`?status=confirmed`), in the same operation that releases the fleet under item 2.

### Related, confirmed working

`POST /api/transporters/fleet/{id}/payments` → admin
`PATCH /api/admin/fleet-payments/{id}/status = approved` **does** auto-create the trip and
returns `fleetTripId` on the payment. Verified end to end 09 Aug: payment
`6a78810f381428c5e639f830` → trip `6a788319714655ab6300d880`, then driven
`picked → on_transit → delivered`, every `PATCH` 200. That path is sound.

Worth noting from the same run: marking a trip `picked` returns
`status: "loaded", transportStatus: "picked"` — the two fields disagreeing, which is item 4.

---

## 15. Every `{id}` route on the support APIs rejects its own ids — HIGH

Found 10 Aug 2026 while building the Chat and Help pages (frontend 14c / D4).

### The problem in one line

`GET /api/chat/{conversationId}` and `DELETE /api/help/{id}` answer **400 for
every id they are given**, including well-formed 24-character ObjectIds that
the sibling *list* endpoints returned moments earlier.

### Reproduction — chat

```
GET /api/chat
  200  [ { "_id": "6a5cad717413ba6b9be0455a", ... },
         { "_id": "6a526f6d5d835594467da5fe", ... } ]

GET /api/chat/6a5cad717413ba6b9be0455a   400  "Invalid conversation ID format"
GET /api/chat/6a526f6d5d835594467da5fe   400  "Invalid conversation ID format"
```

Both ids are 24 lowercase hex characters — valid ObjectIds by any reading.
Controls:

```
GET /api/chat/000000000000000000000000   400  "Invalid conversation ID format"   <- should be 404
GET /api/chat/not-an-id                  400  "Invalid conversation ID format"   <- correct
```

So the route answers identically whether the id is valid-and-real,
valid-and-absent, or plainly malformed. It never succeeds.

There is no second way in: `GET /api/chat/{id}/messages` is not implemented at
all (it falls through to the platform's HTML 404 page), and the spec agrees —
it documents only `PATCH /api/chat/{conversationId}/messages/{messageId}`.
`GET /api/chat/{conversationId}` is the *only* route that can return a
conversation's messages.

### Reproduction — help

Identical signature, different wording:

```
POST /api/help  {subject, message, priority}   201   ticket created, id 6a7956050a2280f3467d2b58
GET  /api/help                                 200   [ { "_id": "6a7956050a2280f3467d2b58", "status": "open", ... } ]

DELETE /api/help/6a7956050a2280f3467d2b58      400   "Invalid ticket id"
DELETE /api/help/000000000000000000000000      400   "Invalid ticket id"
DELETE /api/help/not-an-id                     400   "Invalid ticket id"
DELETE /api/help                               400   "Ticket ID is required"
PATCH  /api/help/6a7956050a2280f3467d2b58      405   (not an alternative)
```

### Impact

- **A conversation can be listed but never opened.** The chat list renders real
  data — participants, last message, timestamps — and clicking any row cannot
  load the thread. Chat is effectively read-only-at-a-glance.
- **A support ticket can be raised but never closed.** `POST` works and returns
  201; nothing can then move the ticket out of `open`, from the user side or
  (as far as these routes go) at all.
- One ticket is currently stuck open in the live data because of this —
  `6a7956050a2280f3467d2b58`, subject *"QA sweep — Help page smoke test"*,
  raised by the shared test account. It is safe to delete server-side.

### Likely cause

Two different resources, two different error strings, one identical behaviour:
valid input rejected, invalid input rejected, no input path succeeding. That
points at a shared id-validation helper or middleware used by both routers
rather than two coincidental bugs. Worth checking whether the validator is
being handed the whole `req.params` object, or a differently-named param than
the route declares (`conversationId` vs `id` is a plausible mismatch — the chat
route declares `{conversationId}` while the help route declares `{id}`, and
both fail the same way).

### Requested change

1. Make `GET /api/chat/{conversationId}` accept the ids that `GET /api/chat`
   returns, and return the conversation with its `messages` array.
2. Make `DELETE /api/help/{id}` accept the ids that `GET /api/help` returns.
3. Return **404**, not 400, for a well-formed id that does not exist — the
   current behaviour makes "wrong id" and "no such thing" indistinguishable.
4. Confirm whether `POST /api/chat/{conversationId}` (send a message) suffers
   the same validation problem. It was not exercised, deliberately: the only
   conversations available belong to real users and sending them test messages
   was not appropriate.

### Frontend position in the meantime

Both pages are built and shipped against the documented contract, so they will
start working the moment these routes are fixed, with no frontend change:

- the Chat thread pane renders an explicit *"This conversation cannot be opened
  yet"* error rather than an empty thread — a blank pane would repeat frontend
  bug 13d, where a failed load was indistinguishable from "no data"
- the *Close ticket* button stays wired and surfaces the server's own message
  on failure

---

## Test data created during this run

| Kind | Id |
|---|---|
| 08 Aug agent product | `6a7788c8ba0438019d691431` — QA AGENT4 White Maize, first product ever listed through the UI |
| 08 Aug agent product | QA AGENT3 Yellow Sorghum |
| 08 Aug farmer | QA Sweep Farmer 08Aug (`+2348033344455`) |
| 08 Aug fleet bid | ₦137,500 on North Route Fleet `69a67ace96f7df1573952158` |
| Clean-run product | `6a762614bc8b24630d48e129` (`QA CLEAN1 Yellow Maize`) |
| Clean-run order | `6a7627100a1730442be69616` (₦1,680 — should be ₦100,680) |
| Clean-run trip | `6a763121255839d6602fac52` (delivered) |
| Earlier order | `6a75d7825c88e28a8551fe6c` (₦2,000 — should be ₦5,100,000) |
| Fleet payments | `6a75e7b5b9a3d4c579fe2ada`, plus one at ₦4,000,000 |
| Pre-existing trip we advanced | `69ff4a66099795cd39d47d12` — was `loaded`, now `delivered` |
| 08 Aug bid (item 10 above) | `6a76dc3ea6133da574ba92d9` — countered ₦1,100, accepted |
| 08 Aug order (item 10 above) | `6a76df00…` / `#F3E6087D` — ₦1,050, unpaid. Server wrote `unitPrice 105`, `lineSubtotal 1050`; correct is `unitPrice 1050`, `lineSubtotal 10,500` — item 1 again |

Happy to re-run any of the above on request, or to hand over the exact request/response
captures.
