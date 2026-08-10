# Backend API Issues

Endpoints the frontend calls that are broken, missing, or behave differently from
`https://tractive-be.vercel.app/api-docs` (spec source: `/docs/openapi.yaml`).

**Verified:** 2026-08-06, against production, with a test account holding all three
roles (`buyer`, `agent`, `transporter`). Every status code below came from a live
request, not from reading the spec.

Legend — 🔴 broken (blocks a user flow) · 🟠 missing (no endpoint exists) ·
🟡 spec mismatch (works, but not as documented) · 🟢 verified working

---

## Reviews

### 🔴 `POST /api/reviews/{id}/reply` — always 400 "Invalid review id"

**Problem.** The handler never reads the `id` path segment. Every id returns the
same 400:

| Id sent | Result |
|---|---|
| `6a74431d867a35ebb4f5daf0` (valid, exists) | 400 Invalid review id |
| `000000000000000000000000` (valid ObjectId, no such review) | 400 Invalid review id |
| `notanid` (garbage) | 400 Invalid review id |

A real id and garbage failing identically means validation runs on an
`undefined` param — the request body and auth are fine. The role gate passes
first (an agent gets to the 400; a buyer stops at 403), so this is purely param
extraction.

**Possible cause.** In Next.js 15 App Router, `params` is a Promise. A handler
written as `{ params }: { params: { id: string } }` and read synchronously yields
`undefined`. Alternatively the folder is `[reviewId]` while the code reads
`params.id` (or vice versa).

**Possible solutions.**
- `export async function POST(req, { params }) { const { id } = await params; … }`
- Confirm the dynamic folder name matches the destructured key exactly.
- Add a regression test asserting a valid id returns 200 and a bogus id returns
  400 — today both return 400, so the validation looks like it works.

**Frontend impact.** No agent can respond to any review. The composer is built
and wired ([agent/reviews/page.tsx](../src/app/(main)/agent/reviews/page.tsx));
it will work the moment this returns 200.

---

### 🔴 `POST /api/reviews/{id}/like` — always 400 "Invalid review id"

**Problem.** Identical failure and identical cause to `/reply` above — same
route shape, same param bug. Confirmed with `activeRole=buyer` (the role this
endpoint requires), so the 400 is not a permissions artefact.

**Possible solution.** Same fix as `/reply`; they are almost certainly the same
bug in two files.

**Frontend impact.** Like is a no-op everywhere. It is wired on the buyer-facing
reviews modal ([Reviews.tsx](../src/components/Reviews.tsx)) and will work once
the id is read.

---

### 🔴 `GET /api/transporters/{id}/reviews` — always 400 "Invalid transporter id"

**Problem.** Same param-extraction signature. Fails for ids that work fine on
sibling routes:

| Request | Result |
|---|---|
| `GET /api/transporters/{id}` | 200 ✅ |
| `GET /api/transporters/{id}/reviews` | 400 ❌ |

Fails identically with `activeRole` = `buyer` **and** `transporter`, so it is not
a role gate.

**Possible solution.** Same fix as above. Note the sibling `/api/transporters/{id}`
works, so the correct pattern already exists in the codebase to copy.

**Frontend impact.** The transporter profile's review list can never load. The
modal now shows an explicit error instead of an empty state, so this does not
silently read as "0 reviews".

---

### 🟠 Transporters cannot reply to reviews at all — no endpoint exists

**Problem.** `POST /api/reviews/{id}/reply` is hard-gated on `activeRole === "agent"`.
A transporter hitting it gets 403 "Agent access required" — verified by switching
the test account to `transporter` and retrying. There is no transporter
equivalent anywhere in the spec (`/api/transporters/reviews` is GET-only).

So a transporter can *read* reviews written about them but has no way to respond.

**Possible solutions.**
- Widen the existing gate to accept `agent` **or** `transporter`, and authorise on
  ownership instead of role — i.e. allow the reply when `review.agent === req.user.id`.
  This is the better fix: it is the same rule for both roles and closes the
  "reply to someone else's review" hole at the same time.
- Or add `POST /api/transporters/reviews/{id}/reply` as a parallel route.

**Frontend impact.** No reply control is rendered on the transporter reviews page —
deliberately, since it could only ever 403. Add one when this ships.

---

### 🔴 Self-review is permitted and counts toward the public rating

**Problem.** A user can review their own account. Verified: posting
`{ agent: <own id>, rating: 5 }` returned **201**, and that 5★ now shows on the
account's seller rating, transporter listing rating and review summary.

Any seller or transporter can inflate their own rating to 5.0 with one request.
The duplicate guard (409) limits it to one self-review per account, but on a new
account one 5★ review *is* the entire rating.

**Possible solution.** Reject when `review.agent === req.user.id` with 400 (or 403).
One line, next to the existing duplicate check that already compares the same two ids.

**Cleanup needed.** Test review `6a74431d867a35ebb4f5daf0` ("self review probe") is
live on `i59mv8titr@lnovic.com` and counting toward that account's rating. There is
no `DELETE /api/reviews/{id}` in the spec, so it has to be removed server-side.

---

### 🟡 `GET /api/sellers/{id}/reviews` returns a summary, not reviews

**Problem.** The spec calls it "Seller reviews and ratings summary", but the
response contains no review objects at all:

```json
{ "success": true,
  "data": { "averageRating": 5, "totalReviews": 1,
            "ratingDistribution": { "5_star": 1, "4_star": 0, … } } }
```

There is no way to render review text or reviewer names on a seller's store page.

**Possible solution.** Include a `reviews` array (same shape as `GET /api/reviews`
returns), ideally paginated.

**Frontend impact.** The store modal shows rating bars and totals but an empty
review list. That is the API's actual content, not a frontend bug.

---

### 🟡 `ratingDistribution` has two different shapes

**Problem.** The same field is an object on one endpoint and an array on another:

| Endpoint | Shape |
|---|---|
| `GET /api/sellers/{id}/reviews` | `{ "5_star": 1, "4_star": 0, … }` |
| `GET /api/reviews/summary` | `[{ "rating": 5, "count": 1, "percentage": 100 }, …]` |

The object form also carries no `percentage`.

**Possible solution.** Standardise on the array form — it is self-describing and
already includes percentages.

**Frontend impact.** Handled: both mappers accept either shape and derive
percentages when only counts arrive. Before this, the seller rating bars rendered
empty despite a 5.0 average.

---

### 🟡 Create-review body key is undocumented

**Problem.** Swagger documents the body as `{ agent, rating, comment }`, but the
deployed handler reads `agentId`. Sending only `agent` is untested against the
live route; sending only `agentId` returns 201.

**Possible solution.** Accept both, and correct the spec example to match whichever
becomes canonical.

**Frontend impact.** Handled — the client sends both keys with the same value.

---

### 🟢 Verified working

| Endpoint | Notes |
|---|---|
| `POST /api/reviews` | 201; duplicate returns 409 + `hasReviewed`, handled as an already-reviewed state |
| `GET /api/reviews` | Agent's own inbox, with populated `buyer` |
| `GET /api/reviews/summary` | Correct array-shaped distribution |
| `GET /api/sellers/{id}/reviews` | Summary fields only — see mismatch above |
| `GET /api/transporters/reviews` | Self/admin list; requires `activeRole=transporter` |

**Role gates (confirmed, correct):** create → `buyer` · reply → `agent` ·
like → `buyer` · `/api/transporters/reviews` → `transporter` or `admin`.
Switch roles with `PATCH /api/profile/switch-role { "activeRole": "agent" }`;
it persists server-side and the existing JWT stays valid.

---

## Wishlist

### 🟢 Verified working

| Endpoint | Result |
|---|---|
| `GET /api/wishlist` | 200 |
| `GET /api/buyers/wishlist` | 200 — same payload as above |

Both aliases return identical data. No issues found. Not yet exercised:
`POST` / `DELETE /api/buyers/wishlist/{productId}`.

---

## Fleet / Trucks

### 🟢 Verified working

| Endpoint | Result |
|---|---|
| `GET /api/transporters/trucks` | 200 |
| `GET /api/fleet-bookings` | 200 |
| `GET /api/trucks` | 403 "Only transporters can view trucks" — correct gate |
| `GET /api/transporters/fleets` | 403 "Transporter access required" — correct gate |

The 403s are correct behaviour for a buyer-role token, not defects.

**Note.** `fleet` and `fleets` exist as parallel route families
(`/api/transporters/fleet/{id}` and `/api/transporters/fleets/{id}`, each with
`/bids`, `/status`, `/payments`, `/bookings`). The spec labels some as aliases.
Worth confirming which is canonical before new frontend code picks one.

---

## Bids

### 🟢 Verified working

| Endpoint | Result |
|---|---|
| `GET /api/bids` | 200 |
| `GET /api/buyers/biddings` | 200 |
| `GET /api/buyers/biddings/won` | 200 |
| `GET /api/buyers/fleet-bids` | 200 |

No issues found.

---

## Summary

| # | Endpoint | Type | Blocks |
|---|---|---|---|
| 1 | `POST /api/reviews/{id}/reply` | 🔴 400 param bug | Agents cannot reply to any review |
| 2 | `POST /api/reviews/{id}/like` | 🔴 400 param bug | Likes are a no-op |
| 3 | `GET /api/transporters/{id}/reviews` | 🔴 400 param bug | Transporter review list never loads |
| 4 | Transporter reply | 🟠 missing | Transporters cannot respond to reviews |
| 5 | Self-review allowed | 🔴 logic | Anyone can set their own rating to 5.0 |
| 6 | `GET /api/sellers/{id}/reviews` | 🟡 no `reviews` array | Store page cannot show review text |
| 7 | `ratingDistribution` shape | 🟡 inconsistent | Handled client-side |
| 8 | Create body `agent` vs `agentId` | 🟡 spec drift | Handled client-side |

Items 1–3 are very likely **one fix**: read the dynamic route param correctly
(`await params` in Next 15). That alone unblocks reply, like, and the transporter
review list.
