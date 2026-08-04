# API Checklist

Simple list: the endpoint, what needs to change, and the page it affects.
Order: **Agent → Buyer → Transporter → Admin → Shared.**

---

## 1. Agent

| # | Endpoint | What to do | Page |
|---|----------|------------|------|
| A1 🚨 | `GET /api/agents/dashboard/out-of-stock` + `GET /api/products/out-of-stock` | Make them agree. Best fix: flip `status` to `out_of_stock` automatically when `quantity` hits 0 | `/agent` (Out of Stock panel) vs `/agent/produce-list` → Out of Stock tab |
| A2 🚨 | `GET /api/orders` | Populate `buyer` as `{_id, name, businessName, phone, state, address}` — currently a bare id | `/agent/new`, `/agent/packed`, `/agent/delivered` (Buyer + Location columns) |
| A3 | `POST /api/customers/{id}/chat` | Fix `400 Invalid customer id` — valid ids are rejected before lookup | `/agent/customers` → row menu → Support → Start Chat |
| A4 | `GET /api/products/pending` | Fix the 500 (empty body). Confirm the real path: this one or `/api/farmers/products/pending` (404) | none yet — direct API check |
| A5 | `GET /api/transactions/{id}` | Returns `403 Buyer access required` for agents who own the sale. Either allow it, or stop listing those rows | `/agent/received` → row → details modal |
| A6 | `POST` / `PUT /api/farmers` + `GET /api/farmers` | Accept and return `image?: string` | `/agent/farmers` → Onboard Farmer → Change Image |
| A7 | `GET /api/customers/{id}` — **new** | Add it: `{ id, name, state, revenue, orders, mobile, date, image?, email?, address?, lastOrderAt? }`. Copy `GET /api/transporters/customers/{id}` | `/agent/customers` → click row → Customer Info modal |
| A8 | `POST /api/agents/products/{productId}/restock` — **new** | Body `{ quantity, restockDate? }`. Return updated product; must flip `status` | `/agent` → Out of Stock → Restock → Submit |
| A9 ❓ | Agent dashboard | It returns a `farmers` count we don't display — should we show it? | `/agent` |

---

## 2. Buyer

| # | Endpoint | What to do | Page |
|---|----------|------------|------|
| B1 🚨 | `POST /api/transporters/fleet/{id}/payments` | **Answer needed:** is `quantityToShip` read as kilograms? Bids treat quantity as kg — if payments do too, buyers are billed wrong | `/buyer/transporter-list/booking-transporter/[id]` → direct payment |
| B2 🚨 | Delete test bids | On fleet `69fb76bbe9b0c1859d580c5d`: `6a5cd45c8e8a23204afc23fa`, `6a5cd45d8e8a23204afc2404`. Do this first — likely fixes B3 | `/buyer/my-biddings` → Fleet Bids tab |
| B3 🚨 | `GET /api/buyers/fleet-bids` | Fix the 500 (empty body, 8/8 calls). Always return a real error message. Runs on every buyer page via the navbar | `/buyer/my-biddings` → Fleet Bids tab |
| B4 | `GET /api/orders?paidForTransport=true` | Honour the filter: `status = "paid"` AND (`fleetTripId` set OR `transportStatus != "pending"`). Currently ignored — returns all 11 | `/buyer/my-orders` → "Shipping & Delivered" tab |
| B5 | `GET /api/transporters/{id}` | Add `ratingDistribution[]`, `totalReviews`, `phoneNumbers[]`, `recentReviewers[]`, `recommendations[]`. Port from `GET /api/sellers/{id}` | `/buyer/transporter-list/[id]` |
| B6 | `GET /api/buyers/biddings` + `GET /api/bids` | Add `rating` + `reviewsCount` to the seller/agent object. On `/api/bids`, `agent` is a bare id — populate it | `/buyer/my-biddings` |
| B7 | `GET /api/buyers/biddings?status=pending` | Add `quantity` + `unit` — rejected bids have them, pending ones don't | `/buyer/my-biddings` → Waiting tab |
| B8 | `GET /api/orders` | Add an explicit `agent` field (we currently dig it out of `products[0].product.owner._id`) | `/buyer/my-orders` — review button |
| B9 | `GET /api/orders` | Populate `transporter` (`_id, name, businessName, image, rating, location`) once a trip is assigned | `/buyer/track-orders` |
| B10 | `GET /api/products/{id}` → `owner` | Add `rating` / `totalReviews` (same values `GET /api/sellers/{id}` computes) | `/buyer/product-details/[id]` |
| B11 | `GET /api/transporters/trucks` | Accept the `transporterId` filter — currently ignored, returns everyone's trucks | `/buyer/transporter-list/[id]` |
| B12 | `GET /api/transporters/fleet/{fleetId}/similar` — **new** | `{ id, image, truckName, rating, amountPerKg, fullLoad, spaceRemaining, locationFrom, locationTo }[]` | `/buyer/transporter-list/booking-transporter/[id]` — Similar Fleet |
| B13 | Fleet wishlist — **new** | `POST /api/wishlist/fleets`, or accept `fleetId` on `POST /api/wishlist`. Currently 404s. Or tell us to remove the heart | `/buyer/transporter-list/booking-transporter/[id]` → `/buyer/wish-list` |
| B14 | `POST /api/reviews` — **new/extend** | Make it polymorphic: `{ revieweeId, revieweeType: "agent" \| "seller" \| "transporter", rating, comment }`. Must recompute rating + distribution. Pairs with B5 | `/buyer/my-orders` → `/buyer/sellers-list/[id]`, `/buyer/transporter-list/[id]` |
| B15 | Bid withdrawal — **new** | No route exists (`DELETE /api/bids/{id}` → 405). Let a buyer withdraw a pending bid | `/buyer/my-biddings` |
| B16 ❓ | `POST /api/reviews` | **Answer needed:** duplicate review — rejected, overwritten, or both kept? We need a `hasReviewed` flag to hide the button | `/buyer/my-orders` |
| B17 ❓ | `POST /api/reviews` | **Answer needed:** is a review per-order or per-agent? If per-order the payload needs `orderId` | `/buyer/my-orders` |

---

## 3. Transporter

Nothing transporter-only logged yet — **this role hasn't been tested end-to-end.**
The shared items below all apply to it: S1, S2, S3, S4, S5, S6, S7.

---

## 4. Admin

| # | Endpoint | What to do | Page |
|---|----------|------------|------|
| D1 | `PATCH /api/admin/users/{id}/status` | Fix `400 Invalid user ID` on every id. Or confirm it's retired and we'll use `PATCH /api/admin/users/{id}` | `/admin/active`, `/admin/suspended`, `/admin/removed` |
| D2 | `GET /api/transactions/{id}` | Add `commissionRate` + `commissionAmount` — the list route has both, detail has neither | `/admin/transactions` → row → details modal |
| D3 | `GET /api/admin/orders/track/agent` + fleet-trip feed | Per line add `product._id`, `name`, `images[]`, `description`, `category`, `quantity`, `unit`. Return **all** products, not just `products[0]` | `/admin/track-orders/track-agent`, `/admin/track-orders/track-transporter` |
| D4 ❓ | Fleet trip | **Answer needed:** does a trip have an `amount`? If not we drop the column | `/admin/track-orders/track-transporter` |

---

## 5. Shared (all roles)

| # | Endpoint | What to do | Page |
|---|----------|------------|------|
| S1 🚨 | `GET /api/profile` | Strip `refreshToken`, `refreshTokenExpiry`, `tokenVersion` from the response — it's a live 30-day credential and the app never reads it | any profile page |
| S2 | `GET /api/orders?status=…` | Unknown status values return the whole collection. Reject with 400 or return empty | direct API check |
| S3 | `GET /api/reviews` → `recentReviewers` | Return `{ id, name, avatar }[]` with real avatar URLs — names only today | `/agent/reviews`, `/transporter/reviews` |
| S4 | `PATCH /api/profile` + `GET /api/profile` | Accept and return `image?: string` (we send a Cloudinary URL) | `/buyer-profile`, `/agent-profile`, `/transporter-profile` |
| S5 | `GET /api/support/contacts` — **new** | `{ id, label, number }[]` | `/agent/pending`, `/agent/received`, `/transporter/pending`, `/buyer/transactions` |
| S6 ❓ | Dashboard `deltas` | **Answer needed:** real or stub? All zero on every role while the metrics are large. If stub we hide the chips | `/agent`, `/transporter`, `/admin`, `/buyer` |
| S7 ❓ | `month` / `year` filters | **Answer needed:** is month `3`, `"03"` or `"Mar"`? Does month work without year? | `/admin/*`, `/transporter/negotiations` |

---

## Do these first

1. **S1** — refresh token in the response
2. **B1** — possible billing bug
3. **B2 → B3** — Fleet Bids tab is down; delete the test bids first
4. **A1** — buyers can order out-of-stock items
5. **B4, A3, A4, A5, A7, A8** — pages blocked until these work
6. Everything else
