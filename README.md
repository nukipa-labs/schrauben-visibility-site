# Brandenburger Schraubenwerk — Supplier Visibility test fixture

Fictional screw-catalogue site designed to score **100/100** on the Supplier
Visibility audit (`services/audits/src/analyzers/supplier.js`).

## Run

```bash
cd tmp/visibility-example
npm install
npm run dev
```

Server listens on `http://localhost:3030`. Pages:

- `/`                    — homepage with Organization + ItemList JSON-LD for 6 featured products
- `/products`            — full catalogue (14 SKUs across 5 families) with per-product JSON-LD
- `/products/<sku>`      — product detail with Product + Offer + additionalProperty schema
- `/about`, `/contact`   — supporting pages

## Pointing the audit at it

Create a supplier-type audit row (any tenant), then submit `http://localhost:3030` as the URL.

The audit's buying agent will:

1. Auto-infer a buying task from the homepage (likely a hex bolt or wood screw scenario)
2. Follow the "Products" link → `/products`
3. Pick a matching SKU → `/products/<sku>`
4. Read price, identifier, specs, availability — all present in both visible text and JSON-LD
5. Record `report_finding` with `matched` + confidence ≥0.7

Expected score breakdown:

| Component   | Value | Reason                                                          |
|-------------|-------|-----------------------------------------------------------------|
| Outcome     | 35/35 | `matched` with high confidence                                  |
| Efficiency  | 15/15 | 3 pages visited (≤4)                                            |
| Friction    | 25/25 | Everything visible — zero friction events                       |
| Conformance | 25/25 | Product + Offer + identifier + structured-specs on every page   |
| **Total**   | **100/100** |                                                           |

## What hits the conformance check

Every page emits:

- `Organization` JSON-LD in the root layout (every page inherits it).
- `Product` JSON-LD with `sku`, `mpn`, `brand`, `image`, `description`.
- `Offer` nested under Product with `price`, `priceCurrency: EUR`, `availability`.
- `additionalProperty` array with 7-10 spec entries per product.
- Visible HTML `<table>` rendering the same specs (covers checkers that
  fall back to structuredBlocks.tables).
- Visible body text repeating price, SKU, MPN, and category labels.

The homepage uses a `CollectionPage` → `ItemList` → `ListItem.item: Product`
wrapper. The conformance pass flattens `@graph` and `itemListElement` so it
still finds the Product nodes inside.
