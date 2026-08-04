# Backend re-test — 04 Aug 2026

Re-tested live against `https://tractive-be.vercel.app` with `i59mv8titr@lnovic.com`,
switching roles via `PATCH /api/profile/switch-role {"activeRole": …}`.
Order of passes: **agent → transporter → buyer**.
Swagger cross-checked against `https://tractive-be.vercel.app/docs/openapi.yaml` (169 paths).

**Score: 22 of 27 open items fixed. 5 unchanged. 5 new issues found.**

Great pass — everything we flagged as high priority (`fleet-bids`, the kg billing bug,
the `/api/profile` token leak) is confirmed working.

---

## ✅ Fixed — verified live

| # | Endpoint | Verified |
|---|----------|----------|
| **2** | `GET /api/buyers/fleet-bids` | **Regression gone.** Called 10× consecutively: 10× `200`. Was 15/15 failing. |
| **27** | Weight conversion | **Confirmed correct — server multiplies by `unitWeightKg`.** `millet` (`unit: bags`, `unitWeightKg: 40`), `quantity: 10` → `loadWeightKg: 400`, `loadWeightTonnes: 0.4`, `equivalent50kgBags: 8`, `equivalent100kgBags: 4`. `Cocoa` (`unitWeightKg: 100`), `quantity: 30` → `loadWeightKg: 3000`. **Answer: we send unit counts, backend converts.** See NEW-4 for the unit-vocabulary caveat. |
| **NEW-1** | `GET /api/profile` | `refreshToken`, `refreshTokenExpiry`, `tokenVersion` all gone. Clean. |
| **7** | `GET /api/products/pending` | `200 {success, data: [], message: "Products currently support available, out_of_stock and discontinued states…"}`. No more 500 — answered rather than implemented, which works for us; we'll drop the pending tab. |
| **10** | `GET /api/transporters/{id}` | **All five present**: `ratingDistribution` (full 5→1 buckets with `count`/`percentage`), `totalReviews`, `phoneNumbers`, `recentReviewers` (`{id, name, avatar}`), `recommendations`. Plus `reviewsCount`, `totalSales`, `deliveriesCount`, `driversCount`, `fleetCount`, `fleetFilters`. |
| **11** | `GET /api/bids` | Agent object now `{_id, email, name, phone, state, rating, reviewsCount}`. See NEW-5 for a population inconsistency. |
| **12** | `GET /api/reviews` | `recentReviewers` key now present on the response. |
| **14** | `POST` / `GET /api/farmers` | `image` accepted, returned on `201`, and present in the list. Round-trip verified. |
| **15** | `GET /api/transactions/{id}` | `commissionRate: 0.1` and `commissionAmount: 5300` both present, **and** it now wraps in `{success, data}` matching the list route. Both asks done. |
| **16** (transporter half) | `GET /api/transporters/fleet-trips` | `packages[]` now carries `description`, `category` **and** `images[]` alongside `image`. Nothing missing. |
| **17** | `GET /api/orders` | `agent` present and populated: `{_id, name, businessName, image}`. |
| **18** | `GET /api/transporters/trucks` | `?transporterId=` now filters. Unfiltered 5 trucks across 2 transporters; `?transporterId=6988b3…` → 4 (all that transporter), `?transporterId=696f6c…` → 1, bogus id → 0. |
| **21** | `POST /api/agents/products/{id}/restock` | `200`, quantity incremented. |
| **22** | `GET /api/support/contacts` | `200 {hotline, whatsapp, email}`. |
| **23** | `GET /api/transporters/fleet/{id}/similar` | `200` with a populated fleet array. |
| **24** | Fleet wishlist | `POST /api/wishlist {fleetId}` → `201`, `fleet` populated on the response. See NEW-3 for the delete side. |
| **25** | Polymorphic reviews | `POST /api/reviews {revieweeId, revieweeType: "transporter", rating, comment}` → `201`, and the transporter's `rating`, `totalReviews` and `recentReviewers` all recomputed correctly. |
| **26** | Bid withdrawal | `DELETE /api/bids/{id}` → `200 {success, message: "Bid withdrawn successfully"}`. Created and withdrew a bid end-to-end. **Product bids only** — fleet bids still have no withdraw route, see below. |
| **30** | Duplicate reviews | Second review from the same buyer → `409 {success: false, message: "You have already reviewed this user", hasReviewed: true, data: <existing review>}`. Exactly what we needed to gate the button. |
| **3** | `POST /api/customers/{id}/chat` | Still `200 {conversationId}`. |

---

## ❌ Still open

| # | Item | State |
|---|------|-------|
| **26b** | Fleet-bid withdrawal | Product bids withdraw fine now, fleet bids have no route. All four candidates `404`: `DELETE /api/transporters/fleet-bids/{id}`, `/api/transporters/fleet/{fleetId}/bids/{id}`, `/api/transporters/fleets/{fleetId}/bids/{id}`, `/api/buyers/fleet-bids/{id}`. Please add one — the buyer needs to cancel a fleet bid. |
| **32** | Amount on a fleet trip | Still no `amount` / `totalAmount` / `price` / `fare` / `agreedAmount` on the trip object. Unless you tell us otherwise we're dropping the Amount column. |
| **34** | Test bids | Both still on fleet `69fb76bbe9b0c1859d580c5d`: `6a5cd45c8e8a23204afc23fa`, `6a5cd45d8e8a23204afc2404`, still `pending`. We can't delete them (no fleet-bid delete route — see 26b). |
| **19** | `GET /api/notifications/unread/count` | Works, still returns three copies: `count`, `unreadCount` and `data.count`. Cosmetic; pick one when convenient. |
| **33** | Agent dashboard `farmers` | Product decision on our side, not yours. |

---

## 🆕 New issues found this pass

**NEW-1 — `GET /api/transporters/{id}/reviews` rejects a valid transporter id.**
`GET /api/transporters/696f6c0a719a3fcdb97c3e16/reviews` → `{"success": false, "message": "Invalid transporter id"}`.
The exact same id works on `GET /api/transporters/696f6c0a719a3fcdb97c3e16` (returns the
full profile) and the review we posted against it did aggregate onto that profile.
So the id is fine and the sub-route's validation is broken. This blocks the reviews tab
on the transporter detail page.

**NEW-2 — `GET /api/reviews?agent=<id>` returns an empty list even when reviews exist.**
A review exists on agent `696f6c0a719a3fcdb97c3e16` (`totalReviews: 1` on their profile,
and the duplicate-guard 409 returns the document), but the filtered list comes back
`{reviews: [], totalReviews: 0}`. Either the `agent` query param is ignored and the route
only ever returns reviews *about the caller*, or the filter is broken. If it's the former,
tell us the right param and we'll switch.

**NEW-3 — `DELETE /api/wishlist?fleetId=<id>` → `500`.**
The body form works (`DELETE /api/wishlist` with `{"fleetId": …}` → `200`), so this is only
the query-param variant. Worth a `400` instead of an unhandled `500`.

**NEW-4 — Shipment unit vocabulary is inconsistent across three places.**
The conversion itself is correct, but the accepted-unit list disagrees with itself:

- Swagger says: *"Supported shipment units … are `kg`, `ton/tons`, and `bag`"*
- The live 400 says: *"Use `kg`, `tonne`, `50kg_bag`, or `100kg_bag`"*
- What actually works: `bags` (plural) — documented nowhere, but it converted fine

And the live product data uses `bags`, `packet`, `100kg_bag` and `kg`. Concretely:
`POST /api/transporters/fleet/{id}/payments` with product `spageetii` (`unit: "packet"`,
`unitWeightKg: 150`) → `400 Unsupported shipment unit for capacity check: packet`.
That order can never be shipped. Please either (a) publish one canonical list and make
the swagger, the error message and the validator agree, or (b) fall back to
`quantity × unitWeightKg` for any unit that has a `unitWeightKg`, which would handle
`packet` and anything else added later without a code change. We'd prefer (b).

**NEW-5 — `/api/bids` populates `agent` only for buyers.**
As `activeRole: buyer` → `agent` is the full object. As `activeRole: agent` → `agent` is a
bare id string (`"6988b3b0e7c550daf1640bfb"`). Not blocking us, but if the shape is
role-dependent we'd rather know than special-case it. Confirm and we'll type it as a union.

---

## Swagger gaps

The swagger update is a big improvement — `shipmentItems`, fleet-bid filters,
`/api/negotiations`, `/api/drivers`, `/api/help`, `/api/admin/queries`, `/api/admin/live-chats`
and `/api/admin/fleet-payments` are all new and useful. Some live, working routes are
still missing from it, so we can't generate types for them:

- `POST /api/agents/products/{id}/restock`
- `GET /api/support/contacts`
- `GET /api/transporters/fleet-trips`
- `GET /api/transporters/fleet/{id}/similar`
- `GET /api/orders/{id}/tracking`
- `GET /api/notifications/unread/count`
- `GET /api/products/pending`
- `GET /api/products/out-of-stock`
- `GET /api/admin/orders/track/agent`
- `DELETE /api/bids/{id}` — `/api/bids/{id}` documents only `get` and `patch`
- `POST /api/reviews` — the example still shows the old agent-only body; please document
  `revieweeId` / `revieweeType` and the `409 hasReviewed` response
- `DELETE /api/wishlist` — documents `productId` only, not `fleetId`

Also note `/api/transporters/fleet/*` and `/api/transporters/fleets/*` are both documented
as full duplicate trees. Which is canonical? We'd like to standardise on one.

---

## Admin pass — 3 of 5 fixed

Tested as `ibrahim.saliman.zainab@gmail.com`.

| # | Endpoint | Result |
|---|----------|--------|
| **NEW-2 (prev)** | `PATCH /api/admin/users/{id}/status` | ✅ **Password leak gone.** Clean projection: `_id, email, roles, activeRole, isVerified, name, status, agentApprovalStatus, createdAt, updatedAt, phone`. Suspended and restored `Agent 2` (`69984089851c03caeebc2d7a`) — back to `active`, verified. |
| **NEW-3 (prev)** | `GET /api/admin/users/removed` | ✅ **Clean.** No `password`, `tokenVersion` or `verificationTokenExpiry`. |
| **16** (admin half) | `GET /api/admin/orders/track/agent` | ✅ **Populate added.** Rows now carry `products[]` with `product: {_id, name, images[], description, category}` plus `quantity` and `unit`. Everything we asked for. |
| **28** | Delta shape | ❌ Unchanged. `/api/admin/dashboard/visitors` → flat `deltaPercent: 100`; `/api/transporters/dashboard` → nested `deltas: {revenue, bookings, drivers, fleets}`. Still two shapes. |
| **29** | Month filter | ❌ Unchanged. `?year=2026&month=1` works (users 12→8, orders 14→3). `?year=2026&month=Jan` → `200` with the full unfiltered set. Bare `?month=1` → `200`, unfiltered. Both still fail silently and return confidently wrong data. |

---

## Cleanup — test artifacts from this run

Ours, created while verifying, that we could not delete ourselves:

- Farmer `6a7217a4f930b0a36b8673e5` ("QA Image Retest Farmer") — `DELETE /api/farmers/{id}` → `403`
- Review `6a72187df930b0a36b8674b4` on transporter `696f6c0a719a3fcdb97c3e16` — `DELETE /api/reviews/{id}` still `404`
- Fleet payment `6a721945f930b0a36b86751c` + booking `6a721945f930b0a36b867519` on fleet `69a6762796d6912191ec3a66`
- Fleet payment `6a721962f930b0a36b86752f` on fleet `69a67ace96f7df1573952158`
- Product `Cocoa` (`69fb7579f61028b29328a389`) quantity `+5` from the restock test

Cleaned up ourselves: the fleet wishlist entry, and the withdraw-test bid.

Still outstanding from **last** run (not cleaned): reviews `6a6a10e6ff99e6318ff5ab32`
and `6a6a10e7ff99e6318ff5ab36` on agent `696f7f7ab3e9c64e9697d0b9` — that agent still
shows `rating: 3, reviewsCount: 2` from them.

A `DELETE /api/reviews/{id}` (admin or author) would let us stop asking.
