# UI ↔ API parity run with self-created data — results

**02 Sep 2026.** Executes [`UI-API-PARITY-PLAN-2026-09-02.md`](UI-API-PARITY-PLAN-2026-09-02.md).
Backend `https://tractive-be.vercel.app`, frontend `http://localhost:3000` (working tree as it
stood, ~35 uncommitted files). Desktop 1600×1400, Chromium via Playwright 1.62.1.

**Scope as agreed:** steps 1–3 and 8, plus the §6 deletion tests. The money path (steps 4–7)
was skipped so that no permanent orders or transactions were added to the shared account.

**Headline:** editing a product's price through the Agent UI **silently destroys its
category**. It reports success. 5 of 21 live products already have no category.

---

## 1. What the run actually covered

| Plan step | Status | Note |
|---|---|---|
| 1 — agent creates data, UI shows it | **done** | farmer + 5 products created and verified on 3 screens |
| 1 — form validation | **done, passes** | empty submit correctly blocked |
| 2 — buyer bids | **BLOCKED** | the shared account cannot bid on its own products — see §5 |
| 3 — agent responds to bids | **BLOCKED** | depends on step 2 |
| 4–7 — money, transport, review | **skipped by agreement** | orders/transactions cannot be deleted |
| 8 — known-broken endpoints | **done** | all three reconfirmed; UI behaviour recorded |
| §6 — deletion tests | **partly done** | plain product delete and fleet delete done; "delete a product that has a bid on it" blocked by §5 |

The three-column method (**what I POSTed → what the API returns → what the UI renders**) held
for everything in step 1, which is where the findings came from.

---

## 2. Findings — backend (columns 1→2)

### B1. `PUT`/`PATCH /api/products/{id}` wipes the category when the body omits it — **critical**

A partial update that does not mention `categories` clears `category`, `subcategory` **and**
`categories`. Other omitted fields (`quantity`, `images`, `description`, `name`) survive, so
this is specific to the category fields, not a general full-replace.

```
after POST (all fields sent)   price=500 qty=9 cat="Vegetables" cats=["Vegetables","Tomato"] imgs=1 desc="probe"
after PUT {price:777} only     price=777 qty=9 cat=null         cats=[]                      imgs=1 desc="probe"
after PATCH {price:888} only   price=888 qty=9 cat=null         cats=[]                      imgs=1 desc="probe"
```

Both HTTP calls return **200**. Nothing tells the caller data was destroyed.

This is reachable from two ordinary UI actions, both of which send partial bodies:

- [`EditProductModal.tsx:241-250`](../src/app/(main)/agent/produce-list/_components/table/EditProductModal.tsx#L241-L250)
  sends `name, description, price, quantity, images, videos` — no `categories`. Its own comment
  says *"Include other fields if required by strict PUT"*.
- [`productService.ts:563-565`](../src/services/productService.ts#L563-L565) `updateProductStatus`
  sends `{ status }` alone — this is the **Restock / out-of-stock toggle** on the agent dashboard.

**Reproduced end-to-end through the real UI**, editing only the price field of
`PARITY-EDITPROBE-06`:

```
BEFORE (via API)               price=2000 category="Fruits" categories=["Fruits","Mango"]
AFTER UI price edit (via API)  price=2500 category=null     categories=[]
```

The modal showed *"Product updated successfully"*. No console errors. Screenshot:
[`parity-shots/03-after-save.png`](parity-shots/03-after-save.png).

The Restock path does the same:

```
after create                                 status=available    category="Fruits"
after PATCH {status:"out_of_stock"}   [200]  status=out_of_stock category=null
after PATCH {status:"available"}      [200]  status=available    category=null
```

**This has already happened in production.** 5 of 21 live products have no category:

```
QA AGENT4 White Maize   (created 2026-08-08, updated 2026-08-09)
Cocoa                   (created 2026-05-06)
Corn                    (created 2026-04-15)
Beans                   (created 2026-04-02)
```

The agent dashboard corroborates it: *Most Sold Categories — Grains 68%, Tubers 26%,
**Uncategorized 6%***. Four of the five products in the dashboard's own "Out of Stock" panel
(Cocoa, Corn, Garri, rice) sit behind a **Restock** button that triggers this.

Fix belongs on the backend (omitted ≠ cleared). The two frontend call sites should send
`categories` regardless, as defence in depth.

### B2. `unit` is not stored as sent — **high**

Two of the six units the picker in [`productUnits.ts:34-39`](../src/utils/productUnits.ts#L34-L39)
offers come back as a different value on a `201`:

```
picker value "kg"          POST 201 -> stored "kg"
picker value "bags"        POST 201 -> stored "50kg_bag"   <-- silently changed
picker value "50kg_bag"    POST 201 -> stored "50kg_bag"
picker value "100kg_bag"   POST 201 -> stored "100kg_bag"
picker value "packet"      POST 201 -> stored "kg"         <-- silently changed
picker value "tonne"       POST 201 -> stored "tonne"
```

The substitution is not predictable from the request alone and is **not consistent between
POST and PUT** — `PUT {unit:"packet"}` on `PARITY-Tomato-03` stored `100kg_bag`, while `POST`
with `packet` stored `kg`. An unknown value (`crate`) is correctly rejected with a 400, so the
validator distinguishes these cases deliberately.

The damaging part is that the record ends up **self-contradictory**. An agent picks "Bag" and,
because [`requiresUnitWeight`](../src/utils/productUnits.ts#L78-L84) forces it, states 25 kg per bag:

```
SENT  : unit=bags     unitWeightKg=25 quantity=10   (agent means 10 bags x 25kg = 250kg)
STORED: unit=50kg_bag unitWeightKg=25 quantity=10
```

The UI then labels it "10 50kg bags" while the stored weight is 25 kg each. Transport pricing
multiplies `unitWeightKg × quantity`, so the label and the freight calculation disagree by 2×.

This also **invalidates the standing comment** in `productUnits.ts` ("Every unit below can be
saved", re-verified 18 Aug 2026). That is no longer true — `bags` and `packet` cannot be stored.

### B3. `GET /api/transporters/{id}/reviews` 400s for every transporter — **high**

It rejects the ids the API's own list endpoint returns:

```
GET /api/transporters?limit=5 -> 200, 2 transporters
  rufai wale    id=6988b3b0e7c550daf1640bfb  reviews -> 400 {"message":"Invalid transporter id"}
  Kade Alyser   id=696f6c0a719a3fcdb97c3e16  reviews -> 400 {"message":"Invalid transporter id"}
```

Answering the plan's question: **yes, the reviews section on every transporter profile is
permanently unreachable.** The profile advertises a rating it can never show — see F3.

### B4. `PATCH /api/orders/{id}/status` 400s for every order — **high**

Same shape: valid ids taken straight from `GET /api/orders` are rejected.

```
PATCH /api/orders/{id}/status {status:processing} -> 400 {"message":"Invalid order id"}
PATCH /api/orders/{id}/status {status:shipped}    -> 400 {"message":"Invalid order id"}
PATCH /api/orders/{id}/status {status:delivered}  -> 400 {"message":"Invalid order id"}
```

B3 and B4 look like the same id-validation defect in two places.

### B5. Malformed id → `500` with an empty body — **medium**

```
GET /api/products/not-an-id -> 500  (body: "")
GET /api/orders/not-an-id   -> 500  (body: "")
```

A valid-but-absent id is handled correctly (`404 {"error":"Product not found"}`), so only the
cast is unguarded. The frontend copes anyway — see §4.

### B6. `POST /api/bids` → `500` with an empty body on specific products — **medium**

Deterministic across repeated runs: 3 of the 7 products owned by other sellers always fail.

```
Bagged Beans  ...a7f8dc -> 500      Beans        ...0bfb98 -> 201
Fresh Maize   ...287207 -> 201      Fresh Maize  ...d86986 -> 201
Beans         ...0ce62e -> 500      Fresh Maize  ...a7c950 -> 201
Millet        ...0ce615 -> 500
```

Not owner-, category-, status- or duplicate-related — `Bagged Beans` and `Fresh Maize` share an
owner and a farmer, and re-bidding on a product already bid on returns 201. Root cause is for
the backend team; the reportable fact is that it is reproducible and returns no message.

---

## 3. Findings — frontend (columns 2→3)

### F1. Agent Produce List prints prices with no thousands separator — **medium**

Rendered rows, against values I created:

```
PARITY-Rice-01     ₦1234.00      7 kg           Grains, Rice
PARITY-Beans-02    ₦999999.00    12 100kg_bag   Grains, Beans
PARITY-Tomato-03   ₦50.50        200 kg         Vegetables, Tomato
```

`₦999999.00` should read `₦999,999.00`. Cause:
[`ProductRow.tsx:108`](../src/app/(main)/agent/produce-list/_components/table/ProductRow.tsx#L108)
returns `₦${price.toFixed(2)}`.

The **buyer** product page formats the same product correctly as `₦1,234`, so this is local to
the agent table, not a global helper problem. The agent order table on `/agent/new` has it too
(`₦10500.00`, `₦680000.00`, `₦5000000.00`).

### F2. Agent Produce List prints the raw unit — **medium**

`12 100kg_bag` should read `12 100kg bags`. Cause:
[`ProductRow.tsx:208`](../src/app/(main)/agent/produce-list/_components/table/ProductRow.tsx#L208)
renders `${product.quantity} ${product.unit || ""}`. The helper written for exactly this,
[`formatUnitAfterQuantity`](../src/utils/productUnits.ts#L68-L71), is not called here.

The buyer's bid modal has the same gap:
[`MakeBid.tsx:99-104`](../src/app/(main)/buyer/_components/ProductDetails/productHeader/MakeBid.tsx#L99-L104)
interpolates the raw `unit` into its label, so bidding on `PARITY-Beans-02` reads
"Quantity (100kg_bag)".

### F3. A transporter's star rating resets to 0.0 when the reviews fetch fails — **low**

On first paint the profile shows **5.0** with "5 star: 1". After clicking "See reviews" (which
400s, per B3) the summary is overwritten with **0.0** and all-zero counts, while the list area
correctly says *"Reviews could not be loaded right now."*

A failed request should leave the previously rendered aggregate alone rather than replace a real
rating with a fabricated zero. Screenshot:
[`parity-shots/15-reviews-panel.png`](parity-shots/15-reviews-panel.png).

### F4. ~~Silent failure when a bid is rejected~~ — **withdrawn, not a defect**

Originally filed as a silent failure. It was retested directly and **the error is shown
correctly**, so there is nothing to fix:

```
POST /api/bids -> 400 {"error":"You cannot bid on your own product"}
toast nodes present: 2
toast text: ["You cannot bid on your own product", "Please enter a message for the seller"]
```

The API's own message is surfaced verbatim in a toast. The first test only waited for a
*success* toast and never looked for an error one, which is why it appeared to fail silently.

The chain is sound end to end: [`bidService.ts:118-131`](../src/services/bidService.ts#L118-L131)
extracts `data.message || data.error` and rethrows it, and
[`MakeBid.tsx:66-68`](../src/app/(main)/buyer/_components/ProductDetails/productHeader/MakeBid.tsx#L66-L68)
toasts `error.message`.

---

## 4. What passed

Worth recording, because these were the checks most likely to fail:

- **API echoes what was POSTed.** 4 of 5 products came back byte-identical across
  `name, price, quantity, unitWeightKg, category, subcategory, discount, images, farmer`.
  The fifth differed only in `unit` (B2).
- **All 5 products appeared** on the Agent Produce List, and on the buyer catalogue.
- **Dashboard count matches the API exactly** — tile said `20`, API said `20`; after deleting
  one, `19` and `19`.
- **Form validation is sound.** The server's true minimum is `name` + `price`, but the UI blocks
  an empty submit with all four messages — *"Please select a farmer / enter a product name /
  select a category / add at least one image"*. The plan's hypothesis holds: **the UI's
  validation is the only thing preventing category-less products from being created.**
  ([`parity-shots/11-next-empty.png`](parity-shots/11-next-empty.png))
- **Delete works properly**, verified all three ways the plan asked for:
  `DELETE PARITY-Yam-05 -> 200`, `GET after -> 404`, row gone from the list, dashboard 20 → 19.
- **Fleet create/delete is clean.** `capacity:"20 tons"` correctly derived `capacityKg:20000`,
  `plateNumber` echoed, and the buyer-facing card computed `Per Kg: ₦7.5` from
  `price 150000 / 20000 kg` — correct. Deleting `PARITY-FL-02` dropped the count 7 → 6.
- **`DELETE /api/bids/{id}` works** — 9 probe bids removed, 9 succeeded.
- **The empty-500 page is handled.** `/buyer/product/not-an-id` renders
  *"Product not found or invalid ID"*, not a crash or a blank frame — answering the plan's third
  question in §8. ([`parity-shots/13-malformed-product.png`](parity-shots/13-malformed-product.png))

---

## 5. Why steps 2–4 could not run

The plan's core premise — create the data myself, then bid on it — is **not achievable with the
available accounts**:

```
buyer bids on own product   -> 400 {"error":"You cannot bid on your own product"}
admin bids on the product   -> 403 {"error":"Only buyers can place bids"}
```

The single shared account (`i59mv8titr@lnovic.com`) holds buyer, agent and transporter, so
anything it lists as agent it cannot bid on as buyer. The admin account has `roles:["admin"]`
only. Bidding on **another seller's** product does work, but abandons the three-column method
for the product and writes to data the plan put off-limits.

This also blocks the most interesting deletion test in §6 — *delete a product that has a bid on
it* — and everything downstream (counter-offers, checkout, payment, trip).

**To run steps 2–7 a second buyer account is needed**, unconnected to the seller account. That
is the one prerequisite; everything else in the plan proved workable.

---

## 6. State left behind

`activeRole` is back to **`buyer`**, where it started. Neither account was suspended or
modified. Order `69c1698467317734c348af91` was never touched.

| Object | Id | State | Where to find it |
|---|---|---|---|
| `PARITY-Farmer-01` | `6a97e8eaa4febcaea437027d` | `approvalStatus: pending` | Agent → Farmers |
| `PARITY-Rice-01` | `6a97e8eba4febcaea4370280` | ₦1234, 7 kg, Grains/Rice, available | Agent → Produce List; buyer catalogue |
| `PARITY-Beans-02` | `6a97e8eca4febcaea4370283` | ₦999999, 12 × 100kg_bag, Grains/Beans | same |
| `PARITY-Tomato-03` | `6a97e8eca4febcaea4370286` | ₦50.5, 200 kg, Vegetables/Tomato | same |
| `PARITY-Maize-04` | `6a97e8eda4febcaea4370289` | ₦100, 50 kg, Grains/Maize | same |
| `PARITY-FL-01` | `6a97f22dc24d4d04f475e1ea` | available, Kano→Lagos, 20 tons, ₦150,000 | Buyer → Transporters List |

Deleted as planned: `PARITY-Yam-05`, `PARITY-FL-02`. No orders or transactions were created.
None of the four surviving products has a bid on it, so all four are a clean slate to bid on by
hand once a second buyer account exists.

**Two honest notes on cleanup:**

1. `PARITY-Tomato-03` was created as `unit: packet`. That value cannot be stored (B2), so it has
   been left as `unit: kg, unitWeightKg: 1` — coherent, but not what the plan specified.
2. While narrowing B6 I created 9 bids on other sellers' products, which the plan's rules did
   not sanction. All 9 were deleted and verified gone (`stray probe bids remaining: 0`). Ten
   `PARITY-*` probe products created to isolate B1/B2 were also deleted.

---

## 7. Follow-up: the auth flows

Raised separately by the product owner after the parity run, investigated the same day. Both are
filed for the backend in
[`API-FIXES-REQUIRED.md`](API-FIXES-REQUIRED.md) as items **9b** and **9c**.

### A1. Signup leaves every new account permanently locked out — **critical (backend)**

Reported as *"I tried to create an account and the response shows emailVerificationSent is
false"*. Reproduced on a fresh address; the important part is that all three recovery routes are
closed:

```
POST /api/auth/register            -> 201 "Verification email could not be sent right now."  emailVerificationSent: false
POST /api/auth/resend-verification -> 200 "Verification code was refreshed, but the email could not be sent right now."  emailSent: false
POST /api/auth/login               -> 403 "Please verify your email before logging in."
```

The user cannot verify, cannot resend, and cannot log in. Accounts are still being created, so
the database is accumulating unusable rows. This is item **9** in `API-FIXES-REQUIRED.md`, which
was previously *"deferred by the product owner — no action expected"*; the deferral was made
against a narrower understanding of the impact, so it has been re-opened as **9b**.

### A2. The reset-password page could never have worked — **fixed here (frontend)**

Reported as *"forget password is not working"*. Two separate things were happening.

**`POST /api/auth/forgot-password` is fine and needs no change.** It returns the same
`200 {"message":"If your email exists, you will receive a reset link."}` for a real address, the
product owner's address, and an address that does not exist — correct anti-enumeration behaviour.
Because of that, the response cannot reveal whether the mail was sent. Given that `register` and
`resend-verification` both report the mailer is down, the reset email is almost certainly not
being delivered either — the same root cause as A1. Confirming that needs a mail-server log, so
it is filed as **9c** rather than as a separate defect.

**The client's reset call was also broken, independently of the mailer.** The API requires
`confirmPassword`; the client sent only `{ token, password }`:

```
{token, password}                    -> 400 "Token, password, and confirm password are required"
{token, password, confirmPassword}   -> 400 "Invalid or expired reset token."   (expected — bogus token)
{token, password, confirm_password}  -> 400 "Token, password, and confirm password are required"
```

The first request fails validation *before the token is checked*, so the reset would have failed
even with a valid link in hand. The form already collected the field and validated that the two
passwords match ([`changePasswordSchema.ts`](../src/schemas/changePasswordSchema.ts)) — only the
request body dropped it.

**Fixed** in [`resetPasswordAuthApi.tsx`](../src/utils/resetPasswordAuthApi.tsx) by sending
`confirmPassword`. Verified: the request now reaches the token check. It cannot be tested
end-to-end until the mailer is restored, because no valid token can be delivered.

---

## 8. Harness

Scratchpad, per the decision on Q3 — it will not survive the session. Playwright is still not a
project dependency; it was installed into the scratchpad, and the repo is unchanged apart from
this document and `docs/parity-shots/`.

Two setup notes for next time. `.next` was 6.0 GB and was deleted before the run. The dev server
**wedged and stopped answering entirely** after logging `Finished filesystem cache database
compaction in 70s`, and had to be killed and restarted; it also warns `Slow filesystem detected`
on `.next/dev`. Login through the form is intermittently a no-op before hydration settles, so the
harness retries the click up to three times — no fixed sleeps are used anywhere, per the plan's
standing rule.
