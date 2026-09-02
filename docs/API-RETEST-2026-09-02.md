# API retest — 02 Sep 2026

Full head-to-toe sweep of `https://tractive-be.vercel.app`, driven directly against the
API (not through the UI), covering every endpoint the frontend calls — ~140 routes across
four authorisation contexts: buyer, agent, transporter (the shared test account, roles
switched via `PATCH /api/profile/switch-role`) and admin.

**Account state was restored:** `activeRole` back to `buyer`, the one probe fleet created
during testing deleted, the one follow created undone. 5 fleets, unchanged.

**Score: 2 endpoints dead · 3 routes 500 on bad input · 5 unvalidated filters · 2 prior
items still open · 5 minor.** Everything closed on 01 Sep stayed closed.

---

## A. Dead endpoints — these never succeed

### A1. `GET /api/transporters/{id}/reviews` → always `400 "Invalid transporter id"`

Every id is rejected, including ids the sibling route accepts in the same second:

```
200  GET /api/transporters/6988b3b0e7c550daf1640bfb          <- id is fine here
400  GET /api/transporters/6988b3b0e7c550daf1640bfb/reviews  <- "Invalid transporter id"
400  GET /api/transporters/696f6c0a719a3fcdb97c3e16/reviews  <- second transporter, same
200  GET /api/sellers/6988b3b0e7c550daf1640bfb/reviews       <- the seller equivalent works
```

The id validator on this one route is reading the wrong path segment — it is almost
certainly validating a param name the router never declared, so it always sees `undefined`.

**Caller:** [transporterService.ts:302](../src/services/transporterService.ts#L302).
**Workaround that already works:** `GET /api/reviews?transporterId={id}` returns the data
correctly (verified, 200, 1 review). The transporter profile can be pointed at that until
the route is fixed.

### A2. `PATCH /api/orders/{id}/status` → always `400 "Invalid order id"`

Same failure mode, on a write route. Tested with the buyer's **own** valid order:

```
400  PATCH /api/orders/6a79a66369acd8dadda5abb0/status  {"status":"bogus_status"}
400  PATCH /api/orders/6a79a66369acd8dadda5abb0/status  {}
```

The id is valid — `GET /api/orders/6a79a66369acd8dadda5abb0` returns 200. So no order
status can be changed through this route at all. Note `GET /api/orders/{id}/tracking`
validates the *same* id correctly, so the fix is local to this handler.

**Caller:** [OrderService.ts:550](../src/services/OrderService.ts#L550).

---

## B. `500` with an empty body on a malformed id

A non-ObjectId path segment throws an uncaught Mongoose `CastError`. The response has no
body at all, so the frontend's error handling has nothing to show, and `axios.ts` fires its
blanket "Server error. Please try again later." toast on every 500.

```
500  GET   /api/products/not-an-id      (empty body)
500  GET   /api/orders/not-an-id        (empty body)
500  PATCH /api/bids/not-an-id          (empty body)
```

**These three are the exception, not the rule** — 12 other routes handle it correctly and
return `400 "Invalid <thing> id"` (`/api/sellers/{id}`, `/api/transporters/{id}`,
`/api/chat/{id}`, `/api/orders/{id}/tracking`, `/api/notifications/{id}`,
`/api/transporters/fleet-trips/{id}`, …). **Fix:** apply the same `isValidObjectId` guard
these three are missing. A valid-but-absent id already behaves correctly (`404`).

---

## C. Filters accepted without validation — a bad value returns *everything*

An unrecognised filter value is silently dropped rather than rejected, so a typo reads as
"no filter". This is the same class as the trip-status bug closed on 01 Sep — the fix
landed on `fleet-trips` only and was not applied to its neighbours.

| Endpoint | Sent | Got | Should be |
|---|---|---|---|
| `GET /api/orders` | `?status=bogus_status` | 200, all 18 orders | `400` |
| `GET /api/fleet-bookings` | `?status=bogus_value` | 200, all 10 bookings | `400` |
| `GET /api/admin/users` | `?role=bogus` | 200, all 20 users | `400` |
| `GET /api/agents/dashboard/revenue` | `?period=bogus` | 200, same series as default | `400` |
| `GET /api/admin/dashboard/revenue` | `?period=bogus` | 200, same series as default | `400` |

`fleet-bookings` is the one that matters most — `?status=confirmed` correctly returns 0,
but any typo returns the full list, which would render finished bookings as open work.

### C2. Pagination bounds are not enforced either

```
GET /api/products?page=-1&limit=9999   -> 200, 22 products   (no page-size cap)
GET /api/products?page=abc             -> 200, 20 products   (non-numeric ignored)
GET /api/products?minPrice=abc         -> 200, unfiltered
GET /api/products?rating=99            -> 200, unfiltered
GET /api/notifications?page=0&limit=-5 -> 200, 5 notifications
```

A negative page and an unbounded `limit` are both accepted. Cap `limit` (50 or 100) and
reject non-numeric values.

---

## D. Previously reported, retested, still open

### D1. Item 8 — `POST /api/transporters/fleets` has no upper bound on capacity

Confirmed still open. The **lower** bound is now enforced, the upper one is not:

```
400  {capacityKg: -500}              -> "capacity must be a positive value in tonnes or kg"  OK
201  {capacityKg: 399999999998900}   -> created                                              BUG
```

That is the exact value that produced the absurd fleet in the earlier round. (The fleet
created by this probe was deleted; the list is back to 5.) Same for `price`: negative is
rejected, unbounded is not.

### D2. Newly-found B — `fleet-trips?status=` still takes one value only

```
400  GET /api/transporters/fleet-trips?status=picked,on_transit
     "Invalid trip status. Use pending, planned, picked, loaded, on_transit, arrived, delivered, or cancelled"
```

Validation now works (that half was fixed), but a tab covering two statuses still cannot be
served in one request, so the client-side re-filter in `BookingTripsView.tsx` has to stay.
Accepting a comma-separated list would remove it.

---

## E. Minor

1. **Notifications still carry no `link`.** Keys are
   `_id,user,type,title,message,metadata,isRead,createdAt,updatedAt,__v`. The target is
   derivable from `metadata` (`{orderId, totalAmount, buyerName}`), which is what
   [Notifications.tsx](../src/components/Notifications.tsx) does. A server-side `link` would
   drop that workaround.
2. **Inconsistent response envelope on admin lists.** `/api/admin/users` and
   `/api/admin/banners` return `data: [...]`, but `/api/admin/transactions` returns
   `data.transactions` and `/api/admin/fleet-payments` returns `data.fleetPayments`. Every
   other list route in the API uses the flat `data` array.
3. **Self-follow is allowed.** `POST /api/buyers/sellers/6988b3b0e7c550daf1640bfb/follow`
   as that same user returns `201 "Seller followed"`. Should be `400`. (Undone.)
4. **Admin dashboard is slow** — `overview`, `revenue`, `top-agents`, `top-buyers`,
   `top-transporters` and `users/stats` all take **2.8–2.9 s**, consistently, against
   ~700 ms for everything else. Six of them load on one screen.
5. **Unknown `/api/*` routes return a Next.js HTML 404 page**, not JSON — so does
   `GET /api/chat/{id}/messages`, which is only routed for `POST`. Any client parsing the
   body gets an HTML string.

---

## F. Verified working — no action needed

- **Everything closed on 01 Sep stayed closed.** Fleet `currentLoadKg` is 0 on all 5 fleets;
  trip-status validation rejects bad values; the won/checkout basket excludes consumed bids
  (0 returned, correctly); no booking is stuck at `confirmed` (5 completed, 5 pending_payment).
- **Item 18 (mark-one-read) is now fixed** — was blocked in the 10 Aug session.
  `PATCH /api/notifications/{id} {isRead:true}` → 200, and the row reads back `isRead:true`.
- **Authorisation is sound.** All 7 admin GETs and all 3 admin writes return `403 "Admin
  access required"` for a buyer. Role-scoped routes correctly reject the wrong `activeRole`
  (`agent` dashboards → 403 as buyer, and 200 after switching). No leakage found.
- **No IDOR.** Another user's order returns `404` on read, `403` on tracking; another
  user's admin record returns `403`.
- **Auth works.** Login 200; no token → 401; garbage token → 401;
  `POST /api/auth/refresh {refreshToken}` → 200 with a fresh pair; empty body → 400;
  wrong current password → 400.
- **Write validation is good on the paths that have it** — empty or malformed bodies return
  a `400` with a usable message on `/api/products`, `/api/orders`, `/api/help`, `/api/chat`,
  `/api/wishlist`, `/api/reviews`, `/api/transporters/fleets`, and every admin status route.
- Buyer, agent, transporter and admin list/detail surfaces all return 200 with populated
  data. The only role-gated 403s seen were correct ones.

---

## Scope note

This pass was run at the API layer, not through the browser. It covers status codes,
payload shapes, validation, filters and authorisation. It does **not** re-verify UI
rendering or the end-to-end trade loop — those were driven through Chrome in the 07–10 Aug
sessions and are recorded in `E2E-BUG-REPORT-2026-08-07.md`.

No destructive writes were made. Writes were limited to invalid payloads expected to be
rejected, plus two reversible actions that were reverted (one probe fleet, deleted; one
follow, unfollowed) and the role switches, restored to `buyer`.

---

## Fix order

1. **A1, A2** — two endpoints that cannot succeed at all. One-line param fixes.
2. **B** — three missing ObjectId guards; the pattern already exists in the codebase.
3. **C** — validate filter values and cap pagination; `fleet-bookings?status=` first.
4. **D1** — upper bound on fleet capacity and price.
5. **E4** — the six 2.9 s admin dashboard queries.
6. **D2, E1, E2, E3, E5** — cleanups.
