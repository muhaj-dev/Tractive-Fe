# Backend re-test — 29 Jul 2026

Tested live against `https://tractive-be.vercel.app` with two accounts:
`i59mv8titr@lnovic.com` (buyer / agent / transporter, switched via
`PATCH /api/profile/switch-role`) and `ibrahim.saliman.zainab@gmail.com` (admin).
**All 34 items tested — nothing blocked.**

**Score: 11 of 26 fixed, 1 partial, 15 unchanged. 1 regression. 3 new security leaks.**
All 8 open questions in section 4 are now answered.

---

## ✅ Fixed — confirmed working

| # | Endpoint | Verified |
|---|----------|----------|
| 1 | `GET /api/bids` | Agent object is now exactly `_id, email, name, phone, state`. Swept 12 routes for `password` / `refreshToken` / `tokenVersion` / `verificationToken` — all clean except `/api/profile` (see NEW-1). |
| 3 | `POST /api/customers/{id}/chat` | Valid id → `200 {conversationId}`. Garbage id → `400` (correct). |
| 5 | `GET /api/orders/{id}/tracking` | `200` with `currentLocation: {lat:null,lng:null}` and empty `timeline`. No more 500. |
| 6 | `GET /api/products/out-of-stock` | Filters on `status` alone. Three products with `quantity: 0` but `status: available` correctly excluded. |
| 8 | `GET /api/customers` | Single shape: `{success, data: [...], pagination}`. No duplication. |
| 9 | `GET /api/customers` + `/{id}` | `state` and `image` both present. |
| 13 | `PATCH` / `GET /api/profile` | `image` accepted, persisted, returned. Round-trip verified. |
| 19 | `GET /api/notifications/unread/count` | `200 {count: 0}`. (Returns `count`, `unreadCount` **and** `data.count` — three copies. Works, but pick one.) |
| 20 | `GET /api/customers/{id}` | All requested fields present, with both alias sets (`id`/`_id`, `mobile`/`phone`, `revenue`/`totalSpent`). |
| 4 | `PATCH /api/admin/users/{id}/status` | **Fixed** — valid id now works. Suspended and restored `Agent 2` successfully. ⚠️ But it leaks the password hash, see NEW-2. |
| 25 (partial) | Rating aggregation | Posting reviews **does** correctly recompute `rating`, `totalReviews` and `ratingDistribution` on the reviewee. |

### ⚠️ Partial

**16 — fleet-trip feed.** `GET /api/transporters/fleet-trips` → `packages[]` now carries
`productId, name, image, quantity, unit, unitWeightKg, loadWeightKg`. Good.
Still missing: **`description`** and **`category`**. Also it's `image` (single string)
rather than `images[]`, and `productId` rather than a nested `product` object — fine
by us, just confirm it's intentional so we can type it.

**The admin half is NOT fixed at all.** `GET /api/admin/orders/track/agent` returns rows
shaped `{_id, status, transportStatus, totalAmount, createdAt, buyer, sellers}`. There is
**no product array whatsoever** — just a `sellers[]` with `{_id, name, phone, state, image}`.
Every field we asked for (`product._id`, `name`, `images[]`, `description`, `category`,
`quantity`, `unit`) is absent. The `.populate()` is still missing on this route.

---

## 🚨 Regression

**2 — `GET /api/buyers/fleet-bids` is now broken 100% of the time.**
It used to fail roughly 1 in 3. I called it 15 times consecutively: **15× HTTP 500**,
empty body every time. This got worse, not better. Highest priority.

---

## 🔴 New security issues found during this pass

Item 1 asked you to *"audit other routes using the same populate helper."* That audit
missed three routes. I swept 23 endpoints across buyer, agent, transporter and admin;
these are the three that still leak, and **two of them leak the bcrypt password hash**:

**NEW-2 — `PATCH /api/admin/users/{id}/status` returns the full user document, password included.**
This is the worst one — it's the *same bug you just fixed on `/api/bids`*, on the route you
fixed in the same pass. Actual response body:

```json
{"success":true,"data":{
  "_id":"69984089851c03caeebc2d7a",
  "email":"c7yj8734ip@wnbaldwy.com",
  "password":"$2b$10$H3QwxN7AflPLObTXMuS86.ijGWEKyRj66NSeL4tBGbYZVbsvMW3le",
  "tokenVersion":0, "verificationTokenExpiry":null, ...}}
```

The sibling route `PATCH /api/admin/users/{id}` returns a clean projection
(`_id, name, email, roles, activeRole, status, updatedAt`) — copy that.

**NEW-3 — `GET /api/admin/users/removed` leaks `password`, `tokenVersion`, `verificationTokenExpiry`**
for every removed user. Note `GET /api/admin/users` is clean, so it's just this variant.

**NEW-1 — `GET /api/profile` leaks `refreshToken`, `refreshTokenExpiry`, `tokenVersion`.**
The refresh token should never reach a client response body.

Everything else I swept is clean: `/api/bids`, `/api/orders`, `/api/customers`,
`/api/transactions`, `/api/reviews`, `/api/sellers/{id}`, `/api/transporters/{id}`,
`/api/transporters`, `/api/transporters/fleet-trips`, `/api/farmers`, `/api/products`,
`/api/admin/users`, `/api/admin/users/stats`, `/api/admin/approvals/*`,
`/api/admin/orders/track/agent`, `/api/admin/dashboard/*`.

---

## ❌ Not fixed — unchanged from the last report

| # | Endpoint | Current state |
|---|----------|---------------|
| 7 | `GET /api/products/pending` | Still **500**, empty body. `/api/farmers/products/pending` is **404**, so `/api/products/pending` is the only path and it's dead. |
| 10 | `GET /api/transporters/{id}` | All five fields still missing: `ratingDistribution`, `totalReviews`, `phoneNumbers`, `recentReviewers`, `recommendations`. For reference `GET /api/sellers/{id}` still returns 4 of the 5 (`recentReviewers` missing there too) — that's the implementation to port. |
| 11 | `GET /api/bids` | Agent object has no `rating` / `reviewsCount`. |
| 12 | `GET /api/reviews` | No `recentReviewers` key at all. **Good news:** `reviews[].buyer` is now populated with a real `image`, so we can build the avatar row ourselves — if you'd rather not add `recentReviewers`, say so and we'll derive it. |
| 14 | `POST` / `GET /api/farmers` | `image` is silently dropped. `POST` returns `201` but the field is absent from both the response and the list. (Note: `lga` and `villageOrLocalMarket` are required — undocumented, worth adding to the error contract.) |
| 15 | `GET /api/transactions/{id}` | Still no `commissionRate` / `commissionAmount`. The list route returns both. Detail also wraps in `{transaction}` while the list wraps in `{data}` — please align. |
| 17 | `GET /api/orders` | No `agent` field. Still deriving from `products[0].product.owner._id`. |
| 18 | `GET /api/transporters/trucks` | `?transporterId=` ignored. Unfiltered returns 5 trucks; filtered returns the same 5, spanning two different transporters. |
| 21 | `POST /api/agents/products/{id}/restock` | **404** — not added. |
| 22 | `GET /api/support/contacts` | **404** — not added. |
| 23 | `GET /api/transporters/fleet/{id}/similar` | **404** — not added. |
| 24 | Fleet wishlist | `POST /api/wishlist/fleets` → 404. `POST /api/wishlist {fleetId}` → 400 "Product ID is required". `POST /api/wishlist {productId: <fleetId>}` → 404 "Product not found". Unchanged. |
| 25 | Polymorphic reviews | `POST /api/reviews {revieweeId, revieweeType}` → 400 "Agent, rating (1-5) required". `POST /api/sellers/{id}/reviews` and `POST /api/transporters/{id}/reviews` → 405. Still agent-only. |
| 26 | Bid withdrawal | `DELETE /api/bids/{id}` → 405. `/api/transporters/fleet/bids/{id}` → 404. `/api/transporters/fleet/{fleetId}/bids/{id}` → 404. No route exists. |
| 34 | Test bids | Both still present on fleet `69fb76bbe9b0c1859d580c5d`: `6a5cd45c8e8a23204afc23fa`, `6a5cd45d8e8a23204afc2404`. |

---

## Answers we got by testing

**27 — CONFIRMED LIVE BILLING BUG. This is the one to fix first after #2.**

I got past the whole-truck block (three of the four fleets now validate), created a
payment, and the field is read as **kilograms, verbatim**. Product `Cocoa` has
`unit: "kg"` and `unitWeightKg: 100`. I sent `quantity: 3`:

```json
"loadWeightKg": 3,
"loadDisplay": "3 kg",
"equivalent100kgBags": 0.03
```

`unitWeightKg` is ignored entirely. 3 bags should be 300 kg, not 3 kg. So when we
send a unit count of 30 bags, you bill it as 30 kg — off by the unit weight, every time.
Either multiply by `unitWeightKg` server-side, or tell us to send kilograms and we'll
convert on our end. **Please confirm which**, because whichever we pick, the other
side has to match exactly.

**30 — Duplicates are allowed.** Two `POST /api/reviews` for the same agent from the
same buyer both returned `201` and created separate documents. Average went 4 → 3.
There's no `hasReviewed` flag and no distinguishable error code, so we can't gate the
button. Still need one of: reject with a specific code, upsert, or a `hasReviewed` flag on
the reviews response.

**31 — Reviews are not per-order.** No `orderId` is accepted or returned. Confirm this is
intended and we'll drop it from the payload.

**32 — No amount on a fleet trip.** Trip object has no `amount` / `totalAmount` / `price` /
`fare` / `agreedAmount`. We're dropping the Amount column unless you say otherwise.

**28 — Deltas ARE computed, not a stub. Answered — no action needed from you.**
The admin overview proves it:

```json
{"users":{"value":12,"deltaPercent":0},
 "payments":{"value":218636500,"deltaPercent":0},
 "orders":{"value":14,"deltaPercent":0},
 "visitors":{"value":8,"deltaPercent":100,"metricSource":"user_activity_proxy"}}
```

`visitors` comes back at `deltaPercent: 100`, so the computation is live — the zeros are
genuine (no activity in the comparison window). `users/stats` corroborates it:
`newUsersCurrentPeriod: 0, newUsersPreviousPeriod: 0`. **We'll keep the chips visible.**

One inconsistency to fix: admin returns a flat `deltaPercent` per metric, while the agent
and transporter dashboards return a separate `deltas: {}` object. Please align on one.

**29 — Answered. Our current format is correct: `?year=2026&month=3`.**
Measured against `/api/admin/users` (12 total) and `/api/admin/orders/track/agent` (14 total):

| Query | users | orders | Behaviour |
|---|---|---|---|
| *(none)* | 12 | 14 | baseline |
| `?year=2026` | 11 | 14 | ✅ works |
| `?year=2026&month=1` / `month=2` | 8 | 0 | ✅ works |
| `?year=2026&month=01` / `month=02` | 8 | 0 | ✅ identical — padding is fine |
| `?year=2026&month=Jan` / `month=Feb` | 11 | 14 | ⚠️ **silently ignored** |
| `?month=1` / `?month=2` *(no year)* | 12 | 14 | ⚠️ **silently ignored** |

So: month must be **numeric 1–12**, zero-padding optional, and **month without year does
nothing**. Two things worth hardening — both currently fail silently and return
confidently wrong data rather than an error: reject a non-numeric month with a 400, and
either support bare `month` (implying current year) or 400 on it.

**33 — Agent dashboard still returns `farmers: 3`** with no tile in the UI. Show it or drop it?
(Still unanswered — this one's a product decision, not a code question.)

---

## Please clean up after my test run

Test-account artifacts I created while verifying, which I could not delete myself
(there's no `DELETE /api/reviews/{id}` — it 404s):

- Reviews on agent `696f7f7ab3e9c64e9697d0b9`: `6a6a10e6ff99e6318ff5ab32`, `6a6a10e7ff99e6318ff5ab36`
- Farmer: `6a6a0f46a28ed8807cba847c` ("QA Image Test Farmer")
- Fleet payment `6a6a14512c7b744c296640da` + booking `6a6a14512c7b744c296640d7` on fleet `69c942bcf41a272cfa476795`
- Profile image on the test account set to a dummy Cloudinary URL

I also suspended and restored `Agent 2` (`69984089851c03caeebc2d7a`) while testing item 4 —
it's back to `active`, verified. The two accounts showing `suspended` (`Agent famer`,
`Admin farm`) were already that way before I started.

---

## Suggested order

1. **NEW-2 / NEW-3** — strip `password` from `PATCH /api/admin/users/{id}/status` and
   `GET /api/admin/users/removed`. Password hashes are going over the wire right now.
2. **#2** `/api/buyers/fleet-bids` — 100% down, blocks the whole buyer bids page
3. **#27** answer the kg question — live billing correctness
4. **NEW-1** strip `refreshToken` from `/api/profile`
5. **#7** `/api/products/pending` — still 500
6. Everything else

Nothing here is blocked on us — happy to re-test the moment you push.
