# Frontend ↔ backend issues, paired

**As of 10 Aug 2026.** Each row is one defect seen from both sides: what the frontend does,
what the backend does, and which half fixes it. Ordered by severity.

Sources: [`API-FIXES-REQUIRED.md`](API-FIXES-REQUIRED.md) ·
[`E2E-BUG-REPORT-2026-08-07.md`](E2E-BUG-REPORT-2026-08-07.md) · [`STATUS.md`](STATUS.md)

---

## 1. Order totals — money is wrong

| | |
|---|---|
| **Backend** | 1 — `unitPrice = amount / quantity`, and the same wrong formula guards `POST /api/orders` |
| **Frontend** | Sends the correct total; the guard rejects or silently mis-prices it |
| **Connection** | The guard forces the client to submit the *wrong* number to succeed. Fixing one side alone breaks checkout |
| **Fix** | Backend: computation + guard in **one deploy**. Then migrate legacy orders and `commissionAmount`. Frontend: no change |
| **Status** | Open — needs decision **D3** on legacy rows |

## 2. Partial checkout — the buyer could not check out a subset

| | |
|---|---|
| **Backend** | Guard rejects with `400 "Total amount does not match accepted bids"` (correct behaviour) |
| **Frontend** | Sent the **whole-basket** totals from `won/checkout` with only the **selected** `bidIds` |
| **Connection** | Backend was right; the frontend lied about the total. Only visible when checking out *some* won bids — every earlier test ticked all of them |
| **Fix** | **Frontend, done.** Totals derived from the selection (`effectiveAmount` + local transport) |
| **Status** | ✅ Fixed and verified — one row ticked → ₦400 → `201` |

## 3. Fleet negotiation — the transporter never saw a bid

| | |
|---|---|
| **Backend** | 19 — `GET /api/transporters/negotiations` returns `[]`, while `/fleet/{id}/bids` returns the same bids correctly |
| **Frontend** | Rendered the empty list faithfully: *"No Negotiations Available"* |
| **Connection** | One blind endpoint killed the whole loop — no accept, so no counter, so no accepted bid, so fleet-bid payment was unreachable. Two bids sat pending **22 days** |
| **Fix** | **Backend** should populate the endpoint. **Frontend, done:** falls back to aggregating per fleet *only when the server list is empty*, so the backend fix silently takes over |
| **Status** | ✅ Frontend fixed — 0 → 5 rows, accept → `200`. Backend 19 open |

## 4. Fleet-bid payment — cannot be paid

| | |
|---|---|
| **Backend** | 20 — `POST /api/transporters/fleet/payments` → **405** (path resolves, verb not mounted) |
| **Frontend** | `FleetBidPaymentModal` is correct: amount, method gating, bank accounts, right payload |
| **Connection** | Blocked entirely by the backend. Note the *direct booking* path `/fleet/{fleetId}/payments` works — only the bid-based route is dead |
| **Fix** | **Backend only.** Mount POST, or publish the correct path |
| **Status** | Frontend complete and verified up to the call. Backend 20 open |

## 5. Notifications — cannot be marked read

| | |
|---|---|
| **Backend** | 18 — `PATCH /api/notifications/{id}` → `400 "Invalid notification ID format"` on an id its own list endpoint just returned |
| **Frontend** | Had **no `onError`** — the click did nothing and said nothing |
| **Connection** | A backend failure made invisible by a frontend omission, so it read as a dead button for months |
| **Fix** | **Backend:** accept its own ids (same validator as item 15). **Frontend, done:** the failure now toasts |
| **Status** | ✅ Frontend fixed. Backend 18 open — 49 unread, individually undismissable |

## 6. Support threads and tickets

| | |
|---|---|
| **Backend** | 15 — `GET /api/chat/{id}` and `DELETE /api/help/{id}` reject every id, including their own |
| **Frontend** | Chat and Help pages built 10 Aug and working; they just cannot open a thread or close a ticket |
| **Connection** | **Same shared validator as item 18** — three resources failing identically. Fix once, fix all three |
| **Fix** | **Backend only.** The pages will work unchanged |
| **Status** | Backend 15 open |

## 7. Expired sessions render as empty pages

| | |
|---|---|
| **Backend** | 13 — `POST /api/auth/refresh` always 400s, so a session can never be refreshed |
| **Frontend** | 13d — treats a 401 as "no data": a 5-row fleet list silently became 0 rows |
| **Connection** | Both halves needed. The backend makes expiry inevitable; the frontend makes it invisible |
| **Fix** | **Backend:** accept the refresh token. **Frontend:** render 401 as an error state, not an empty one |
| **Status** | Both halves open. Hit again this session mid-run |

## 8. Password reset

| | |
|---|---|
| **Backend** | 16 — `POST /api/auth/forgot-password` returns 200 with no account, **500** when the account exists |
| **Frontend** | Complete — `/forget-password` + `/reset-password` exist and are wired |
| **Connection** | Earlier audit probed `/forgot-password` (American spelling) and filed it as a missing feature. **Withdrawn** — it was never missing |
| **Fix** | **Backend only.** Also stop leaking which accounts exist |
| **Status** | Backend 16 open. Frontend needs no work |

## 9. Product units — bagged goods cannot be listed

| | |
|---|---|
| **Backend** | 11 — three disagreeing vocabularies; **32% of products hold a unit their own API rejects** |
| **Frontend** | 10d/12a — unit picker and auto-fill built against the create/update enum |
| **Connection** | The frontend can only offer what create accepts, so bagged products are unlistable and uneditable regardless of UI work |
| **Fix** | **Backend:** one enum across create, update, spec and stored data. **Frontend:** re-point the picker once agreed |
| **Status** | Backend 11 open |

## 10. Product images

| | |
|---|---|
| **Backend** | 12 — `POST /api/products` accepts `images: []` |
| **Frontend** | 12h — image made required client-side |
| **Connection** | Client-side only; anything hitting the API directly still publishes a photoless listing |
| **Fix** | **Backend:** enforce server-side |
| **Status** | Frontend done, backend 12 open |

## 11. Duplicate ordering of one bid

| | |
|---|---|
| **Backend** | 10 — `won/checkout` still returns a bid after an order consumed it |
| **Frontend** | 10a — fixed client-side, but still shows whatever the endpoint returns |
| **Connection** | The frontend cannot tell a consumed bid from a live one; the list is the only source |
| **Fix** | **Backend:** exclude consumed bids |
| **Status** | Frontend done, backend 10 open |

## 12. Transport lifecycle

| | |
|---|---|
| **Backend** | 2 + 14 — fleets and bookings never released after delivery; 3 — `?status=` filter ignored; 4 — `picked` writes two disagreeing fields; 5 — orders never reflect delivery |
| **Frontend** | Fix 5 (trip status tabs) and fix 7 (status dropdown) work around 3 and 4 |
| **Connection** | Compounding: no fleet is bookable twice, so further transport testing needs a **new fleet each time** — and each is a permanent row |
| **Fix** | **Backend.** Release fleet + bookings on `delivered`, apply the filter, pick one status field |
| **Status** | All open. Currently **no bookable fleet remains** |

## 13. Reviews — once per seller, not once per order

| | |
|---|---|
| **Backend** | Uniqueness scoped to the user pair — second review 409s |
| **Frontend** | 11d — offers *Leave a review* on every delivered order; handles the 409 gracefully |
| **Connection** | Looks correct while being wrong. Which side fixes it depends on the product answer |
| **Fix** | **Per-order** = backend rescopes uniqueness. **Per-seller** = frontend hides the button once reviewed |
| **Status** | Blocked on decision **D2** |

## 14. Fleet-bid withdrawal

| | |
|---|---|
| **Backend** | No `DELETE` route for fleet bids (product bids have `DELETE /api/bids/{id}`) |
| **Frontend** | 11a — Fleet Bids tab has no actions at all |
| **Connection** | Cannot be built until the route exists |
| **Fix** | **Backend adds the route first**, then a small frontend change |
| **Status** | Blocked on decision **D1** |

---

## Frontend-only (no backend involvement)

| Issue | Problem | Fix | Status |
|---|---|---|---|
| Notification bell | Bare `div` in **all 11 navbars** — 60 Tab presses never reached it, so notifications could not be opened without a mouse | Real `<button>` + `aria-haspopup`/`aria-expanded`/counted label | ✅ Fixed |
| Notification links | API sends `metadata`, never `link`, so every row was a dead end | Derive the destination from `type`, scoped to the current role area; unmapped types stay unlinked | ✅ Fixed |
| Notification history | 8 navbars gated the panel on unread, hiding all read history at zero | Always render `Notifications` (it has its own empty state) | ✅ Fixed |
| `BankAccounts` rows | `role="radio"` on a `div` with no `tabIndex`/key handler, while confirm silently no-ops until a bank is picked | Focusable + Enter/Space, wrapped in a `radiogroup` | ✅ Fixed |
| Modal a11y | 15g, 17f, `FleetBidPaymentModal` had no dialog semantics | `role="dialog"` + `useModalA11y` | ✅ Fixed |
| Modal a11y (rest) | `EditProductModal`, `BiddersModal`, `CustomerInfoModal` ×2, `CustomerCareModal`s, `TripDetailsModal` | One line each | ☐ Open |
| 12b | Edit Product modal blocks its form behind a 9s refetch it does not need | Dirty-field check so a late fetch cannot clobber typed input | ☐ Open |
| 11c / 11e / 11g / 11i | Follower count stays 0; wishlist shows `Quantity: 0` as "Available"; confirmed orders vanish silently; *"Est date: N/A"* | Small display fixes | ☐ Open |
| 15b | A rejected transaction displays as **"Failed"**; no *Rejected* tab, though fleet-payments has one | Align naming across the two screens | ☐ Open |
| 14c | 1 dead link left: `/our-location` | Needs an address — content, not code | ☐ Open |

---

## Environment, not a defect

- `api.cloudinary.com` is DNS-blocked here — product images, receipts and banners are
  stubbed. **The only item that cannot be tested from this machine.**
