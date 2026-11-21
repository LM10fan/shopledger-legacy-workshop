# Codex workshop evidence and checkpoint notes

## CP1 — Explain (read-only inspection)
ShopLedger is an Express/CommonJS point-of-sale and khata credit app. The browser UI is in `public/`, API routes in `routes/`, and business logic in `lib/`. Orders are created by `routes/orders.js`: look up products, validate inventory and coupons, compute totals with `lib/pricing.js`, optionally charge khata, reserve stock, append the order, and persist via `lib/store.js`. Printing and GST audit use `lib/invoice.js` and `lib/reports.js`.

**Confirmed risks:** `data/db.json` is a tracked mutable database; the original `npm test` script is a failing placeholder; `config.js` contains a hard-coded admin key; the original invoice calculation did not share the checkout tax/coupon logic. The repository uses legacy Express 4 dependencies. **Suspected risks:** race conditions around file-backed writes and inventory/credit edge cases require separate investigation.

## CP2 — Architecture
See [shopledger-architecture.svg](shopledger-architecture.svg). The diagram uses only files present in the repository.

## CP3 — Characterization
The commit before the invoice fix, `45464df9c9a1bd234c83652ebd349d132760f581`, contains 12 tests, including `CURRENT BEHAVIOUR` cases documenting 18% default GST on 5%/12% items, tax-before-discount, coupon cap/minimum bypass, case-sensitive coupon lookup, and decimal GST misinterpretation. These tests intentionally preserve the legacy behavior.

## CP4 — Fix and regression
`lib/invoice.js` now derives its calculations from the same `pricing.computeTotals` engine used at checkout, retaining the invoice renderer and existing API. The test suite now asserts the corrected totals, HSN slabs, discount caps, and GST reconciliation.

To verify in your clone:
```sh
node --test
git status --short
```
No tests import `lib/store.js` or touch `data/db.json`.

## CP5 — Pull request
See the pull request linked from the repository's Pull Requests tab. Do not merge without reviewing the diff and running the tests in the full checkout.

## Submission evidence
The workshop form specifically requests real Codex screenshots/outputs for CP1, CP3, CP4 and CP5. Capture those from your own Codex session or browser. A repository document or generated graphic is not a genuine screenshot of Codex.
