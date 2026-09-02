# UI ↔ API test with self-created data — plan

**Status: plan only, nothing implemented.** 02 Sep 2026. Follows
[`API-RETEST-2026-09-02.md`](API-RETEST-2026-09-02.md), which tested the API alone.

---

## 1. The approach

I build my own data with `POST`, then check it in the UI. Nothing existing is touched.

That solves the problem the earlier draft had. Comparing the UI against the API only tells
you the two agree — if the backend returns a wrong price, and the UI faithfully renders that
wrong price, both "pass". When **I** create the product, I know it costs ₦1,234, so there
are three things to compare, not two:

```
what I POSTed   →   what the API returns   →   what the UI renders
     ↑                                                  ↓
     └────────────────── must all match ────────────────┘
```

A break between column 1 and 2 is a backend bug. A break between 2 and 3 is a frontend bug.
That distinction is the whole point, and it is only possible with data I created.

It also removes the legacy-data problem. Decision **D3** (legacy mispriced orders) stops
mattering — I never assert on those rows.

### Feasibility is already proven

I ran the full round-trip against the live backend before writing this:

```
201  POST   /api/products            -> "Product created successfully"
200  GET    /api/products/{id}       -> name, price 1234, qty 7, unit kg, category Grains — all echoed back exactly
200  PUT    /api/products/{id}       -> price updated
200  DELETE /api/products/{id}       -> "Product deleted successfully"
404  GET    /api/products/{id}       -> gone
```

So create, verify, and **clean up** all work. Two useful facts fell out:

- The server's true minimum is **`name` + `price`** (`400 "Name and price required"`). The
  UI form enforces much more — farmer, category, image, quantity, unit, description. **That
  gap is itself a test:** the UI's validation is the only thing preventing a product with no
  category from existing.
- Images take a **URL**, so passing an existing Cloudinary URL sidesteps the
  `api.cloudinary.com` DNS block entirely. Real file upload stays untestable; everything
  downstream of it does not.

---

## 2. Accounts

| Role | Email | Password |
|---|---|---|
| buyer + agent + transporter | `i59mv8titr@lnovic.com` | `Testpassword` |
| admin | `ibrahim.saliman.zainab@gmail.com` | `test123` |

One shared account, three roles, user id `6988b3b0e7c550daf1640bfb`. Switch with
`PATCH /api/profile/switch-role` `{"activeRole":"agent"}` — note the field is `activeRole`,
not `role`. **Leave it on `buyer`** at the end; that is where it started.

Backend `https://tractive-be.vercel.app` · frontend `http://localhost:3000`.
Both accounts verified working today.

---

## 3. Everything I create is tagged

Every object gets a `PARITY-` prefix in its name. That makes it greppable, obvious in a
screenshot, and safe to bulk-clean at the end:

| Object | Name | Notes |
|---|---|---|
| Farmer | `PARITY-Farmer-01` | created first — products need one |
| Products | `PARITY-Rice-01` … `PARITY-Yam-05` | 5 across different categories, units and price scales |
| Bid | on `PARITY-Rice-01` | placed as buyer |
| Order | from the accepted bid | |
| Fleet | `PARITY-FL-01` | plate `PARITY-001` |
| Fleet bid / booking / trip | on `PARITY-FL-01` only | |

Prices are chosen to catch formatting bugs specifically: `1234` (comma rendering), `999999`
(large), `50.5` (decimal), `100` (round). Units cover `kg`, `100kg_bag`, `packet` — the ones
that rendered raw as `100kg_bag` before.

**Rules:** only `PARITY-*` objects are ever written to or deleted. Order
`69c1698467317734c348af91` (Garri, ₦5,000,000) stays on the hard FORBIDDEN list. Neither
account is ever suspended or removed.

---

## 4. The run

Each step is: **POST it → confirm the API echoes what I sent → open the UI → confirm the
screen shows the same thing.** Any of the three disagreeing is a finding.

### Step 1 — Agent creates the data
Switch to `agent`. Create the farmer, then the 5 products.
Check in UI: Agent → Produce List shows 5 new rows, right names, right prices, units read as
`100kg bags` not `100kg_bag`; the dashboard product count went up by exactly 5;
Buyer → catalogue shows them too.
**Also test the form itself** — submit it empty, and with a negative price, and confirm the
UI blocks what the API would have accepted.

### Step 2 — Buyer bids
Switch to `buyer`. Bid on `PARITY-Rice-01` through the UI.
Check: the bid appears in Buyer → My Biddings *and* Agent → Bids with the same amount on
both sides.

### Step 3 — Agent responds
Accept one bid, counter a second, reject a third. Check each status renders correctly on
both sides, and that the counter amount matches what was typed.

### Step 4 — Buyer checks out
Accept the counter, then check out **only some** of the won bids — partial checkout is where
§20a broke before (whole-basket totals sent with a partial selection → `400`).
Check: the order total equals the sum of the selected bids, not the basket.

### Step 5 — Admin approves the payment
Log in as admin. The new transaction should be `pending`. Approve it.
Check: buyer sees `paid`, agent sees the paid order, admin dashboard revenue moved by
exactly the order amount — not approximately.

### Step 6 — Transport
Switch to `transporter`. Create `PARITY-FL-01`. As buyer, bid on it and book it. As admin,
approve the fleet payment — a trip should be auto-created. Drive it
New → Picked → On Transit → Delivered.
Check at each hop: the status on the transporter tab, the buyer's tracking timeline, and the
API's `status`/`transportStatus` all agree. On delivery, confirm the fleet returns to
`available` with `currentLoadKg: 0` and the booking moves off `confirmed`.

### Step 7 — Confirm receipt and review
As buyer: confirm receipt, leave a review. Check the review appears on the store page with
the rating given, and the seller's average recalculates.

### Step 8 — The known-broken endpoints
Confirm what the 02 Sep API bugs do to a real screen:
- `GET /api/transporters/{id}/reviews` **always 400s** → is the reviews section on every
  transporter profile permanently empty?
- `PATCH /api/orders/{id}/status` **always 400s** → does a control fail silently, or show an
  optimistic update that reverts on reload?
- `/api/products/{id}` and `/api/orders/{id}` **500 on a malformed id** → what does the page
  do with an empty 500 body?

---

## 5. Setup

Two traps are live right now, both measured today:

1. **A `next dev` is already running on port 3000** (PID `10356`, 7 node processes).
   **Q1 below.**
2. **`.next` is 6.0 GB** — the `du` took over two minutes. Delete it before starting or
   Turbopack burns 30–90 s per request.

Also carried forward: **never assert on a fixed sleep** (a first-hit compile can exceed 10 s
and a 4 s wait already produced a withdrawn bug report — wait on a locator); log in fresh
each run because a stale session renders every screen as logged-out rather than erroring;
`npx tsc --noEmit` verifies, ESLint cannot run.

**The Playwright harness is gone** — the old `lib.js` and all ~22 scripts lived in
per-session scratchpad folders that are now empty. Playwright's `node_modules` and the
browser binaries survive, so it is a rebuild of the login/context helper, not a fresh setup.
Playwright is not a project dependency.

---

## 6. Cleanup — delete some, keep the rest for you

Not a full wipe. The run splits what it created in two, because deleting serves one purpose
and keeping serves another.

### Deleted — because deletion is itself a test

Delete is a write path with its own bugs: it can 200 and not delete, orphan the rows that
referenced it, or leave a count stale on a dashboard. So a slice gets deleted **on purpose**
and then verified:

| Deleted | What it proves |
|---|---|
| `PARITY-Yam-05` (untouched by any bid) | plain delete works, `GET` after → 404 |
| `PARITY-Maize-04` (**has a bid on it**) | the interesting one — does the orphaned bid still render in My Biddings, and does its card show a dead product? |
| A second fleet, `PARITY-FL-02`, created solely to be deleted | fleet delete works and the count drops |

Each deletion is checked three ways: API returns 404 after, the row disappears from the
list screen, and the dashboard count decrements. A 200 that leaves the row on screen is a
finding.

### Kept — for you to re-test by hand

Everything else stays live, so you can walk the same flow in the browser yourself:

| Kept | State left in |
|---|---|
| `PARITY-Rice-01` | has an **accepted** bid → a paid order → delivered |
| `PARITY-Beans-02` | has a **countered** bid awaiting your response |
| `PARITY-Tomato-03` | listed, **no bids** — clean slate to bid on yourself |
| `PARITY-Farmer-01` | the farmer behind all of them |
| `PARITY-FL-01` | fleet with a completed booking and a delivered trip |

That gives you one of each state without having to build anything: something finished,
something mid-negotiation waiting on a decision, and something untouched.

### What cannot be cleaned up either way

Orders and transactions have **no delete endpoint**, so the 3–5 created by the money path
are permanent on the shared account regardless. That is the honest cost of testing payments,
and it is why Q2 exists.

The report ends with a table of every `PARITY-` object still alive — id, name, state, and
the screen to find it on — plus a confirmation that `activeRole` is back to `buyer`.

---

## 7. Deliverable

`docs/UI-API-PARITY-RESULTS-2026-09-XX.md` — per step: what I sent, what the API returned,
what the screen showed, and a screenshot. Each finding labelled **backend** (columns 1→2) or
**frontend** (columns 2→3), because they go to different people.

---

## 8. Questions

- **Q1 — the dev server on port 3000.** Kill it and start clean, or is it yours? I will not
  kill a process you may be using.
- **Q2 — orders and transactions cannot be deleted.** Beyond the objects §6 deliberately
  keeps for you, this run permanently adds roughly 3–5 `PARITY-` orders and their
  transactions to the shared account — there is no endpoint to remove them. Fine to proceed?
- **Q3 — harness location.** Throwaway scratchpad again (lost next session) or a committed
  `e2e/` folder (survives, but adds a dev dependency and a repo change you have not asked
  for)?

Defaults if you would rather not answer: desktop 1600×1400; test the working tree as it
stands (~35 uncommitted files); skip signup/OTP and real image upload, both known blocked.
