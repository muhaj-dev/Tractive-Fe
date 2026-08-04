# APIs to fix

Verified live 04 Aug 2026 on `https://tractive-be.vercel.app`.

## Bugs

| Endpoint | Problem | Cause |
|---|---|---|
| `GET /api/transporters/{id}/reviews` | `{"success":false,"message":"Invalid transporter id"}` on a valid id | id validation on the sub-route rejects ids that `GET /api/transporters/{id}` accepts |
| `GET /api/reviews?agent=<id>` | Returns `{reviews:[], totalReviews:0}` while the profile shows `totalReviews:1` | `agent` query param not applied as a filter |
| `DELETE /api/wishlist?fleetId=<id>` | `500` | query-param variant unhandled; only the JSON-body form is implemented |
| `POST /api/transporters/fleet/{id}/payments` | `400 Unsupported shipment unit for capacity check: packet` | unit allowlist is hardcoded; `packet` (and any new unit) missing despite `unitWeightKg: 150` being present |
| `GET /api/sellers/{id}` | No `recentReviewers` | field added to `/api/transporters/{id}` only, not ported to sellers |

## Missing routes

| Route | Status |
|---|---|
| `DELETE` fleet bid — all 4 variants (`/api/transporters/fleet-bids/{id}`, `/api/transporters/fleet/{fleetId}/bids/{id}`, `/api/transporters/fleets/{fleetId}/bids/{id}`, `/api/buyers/fleet-bids/{id}`) | `404` — no route exists |
| `DELETE /api/reviews/{id}` | `404` |

## Admin

Tested 04 Aug as `ibrahim.saliman.zainab@gmail.com`. Password-hash leaks are gone,
product populate is done. Two left:

| Endpoint | Problem |
|---|---|
| `GET /api/admin/dashboard/visitors` etc. | flat `deltaPercent` per metric vs `deltas:{}` on `/api/transporters/dashboard` — shapes differ |
| `GET /api/admin/users`, `GET /api/admin/orders/track/agent` | `?month=Jan` and bare `?month=1` return the full unfiltered set with `200` — no validation, wrong data instead of `400` |

## Inconsistencies

| Endpoint | Problem |
|---|---|
| `GET /api/bids` | `agent` is a full object for `activeRole: buyer`, a bare id string for `activeRole: agent` |
| `/api/transporters/fleet/*` vs `/api/transporters/fleets/*` | duplicate route trees, both documented |
| shipment units | swagger says `kg, ton/tons, bag`; `400` message says `kg, tonne, 50kg_bag, 100kg_bag`; `bags` works undocumented |
| `GET /api/notifications/unread/count` | same value in `count`, `unreadCount`, `data.count` |
| fleet trip object | no `amount`/`totalAmount`/`price`/`fare` |
| `POST /api/reviews` | no `orderId` accepted or returned |

## Rate limiting

No `RateLimit-*` / `Retry-After` headers on any response. If added: headers on every response (not only `429`), `429` body in `{success:false,message}` shape, and the per-bucket numbers sent to us first.

## Missing from swagger

`POST /api/agents/products/{id}/restock` · `GET /api/support/contacts` · `GET /api/transporters/fleet-trips` · `GET /api/transporters/fleet/{id}/similar` · `GET /api/orders/{id}/tracking` · `GET /api/notifications/unread/count` · `GET /api/products/pending` · `GET /api/products/out-of-stock` · `GET /api/admin/orders/track/agent`

Stale: `/api/bids/{id}` missing `delete` · `POST /api/reviews` example still agent-only, no `409 hasReviewed` · `DELETE /api/wishlist` missing `fleetId`.

## Test data to delete

Farmer `6a7217a4f930b0a36b8673e5` · review `6a72187df930b0a36b8674b4` · fleet payments `6a721945f930b0a36b86751c` (+booking `6a721945f930b0a36b867519`), `6a721962f930b0a36b86752f` · reviews `6a6a10e6ff99e6318ff5ab32`, `6a6a10e7ff99e6318ff5ab36` on agent `696f7f7ab3e9c64e9697d0b9` · fleet bids `6a5cd45c8e8a23204afc23fa`, `6a5cd45d8e8a23204afc2404` · `Cocoa` `69fb7579f61028b29328a389` quantity `+5`.
