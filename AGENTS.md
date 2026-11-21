# ShopLedger — Codex working instructions

## Current stack
- Node.js CommonJS application, Express 4, body-parser, browser JavaScript/CSS.
- `server.js` mounts HTTP routers in `routes/`; `public/` contains the POS UI.
- `lib/pricing.js`, `lib/tax.js`, and `lib/coupons.js` compute checkout amounts.
- `lib/orders.js`, `lib/inventory.js`, and `lib/ledger.js` handle orders, stock, and khata.
- `lib/invoice.js` renders printed invoices; `lib/reports.js` reconciles invoices against the ledger.
- `lib/store.js` reads/writes the tracked `data/db.json`; `config.js` defines tax slabs and coupons.

## Commands
- `npm install` to install dependencies; `npm start` to serve at http://localhost:3000.
- `node --test` runs tests with Node's built-in test runner (Node 22+ recommended).
- The existing `npm test` script is a placeholder, not the test command.

## Safety rules
1. Write characterization tests documenting **current** behavior before changing it; name surprising cases `CURRENT BEHAVIOUR`.
2. Fix only the production module named by the ticket; avoid unrelated changes.
3. Tests must use in-memory fixtures; never read, modify, or reset `data/db.json`.
4. Add no dependencies.
5. Keep the legacy behavior documented separately from the corrected behavior; run `node --test` after each stage.
