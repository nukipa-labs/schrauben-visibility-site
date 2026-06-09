import { productBySku } from '../data/products';
import type { Product } from '../data/products';

/**
 * Pure pricing helper used by the GET /offer endpoint and the
 * /offer/confirm summary page. No I/O, no Date.now() inside the
 * deterministic parts — the offer ID is derived from (sku, qty,
 * country) so the same query string always produces the same offer.
 * `valid_until_iso` is computed from a caller-supplied issued-at
 * timestamp so server-rendered pages can stamp it once at request
 * time without breaking memoisation.
 */

export type PaymentMethod = 'invoice_net30' | 'sepa_direct_debit' | 'credit_card';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'invoice_net30',
  'sepa_direct_debit',
  'credit_card'
];

const VOLUME_TIERS: Array<{ minPieces: number; discountPct: number; label: string }> = [
  { minPieces: 2000, discountPct: 15, label: '2000+ pieces' },
  { minPieces: 500,  discountPct: 10, label: '500-1999 pieces' },
  { minPieces: 100,  discountPct:  5, label: '100-499 pieces' },
  { minPieces: 0,    discountPct:  0, label: '0-99 pieces (list price)' }
];

const EU_COUNTRIES = new Set([
  'DE','AT','CH','NL','BE','LU','FR','IT','ES','PT','IE','DK','SE','FI','NO',
  'PL','CZ','SK','HU','SI','HR','EE','LV','LT','RO','BG','GR','CY','MT'
]);

const SHIPPING_EUR: Record<'eu' | 'world', number> = {
  eu:    4.5,
  world: 9.0
};

export type Offer = {
  offer_id:                 string;
  product:                  Product;
  qty:                      number;            // pieces
  packs_required:           number;
  unit_price_list_eur:      number;
  discount_pct:             number;
  tier_label:               string;
  unit_price_discounted_eur: number;
  subtotal_eur:             number;
  shipping_eur:             number;
  shipping_zone:            'eu' | 'world';
  total_eur:                number;
  currency:                 'EUR';
  delivery_country:         string;
  valid_until_iso:          string;
  payment_terms:            string;
  delivery_terms:           string;
  delivery_estimate_days:   string;
};

export type OfferError =
  | { kind: 'unknown_sku';         sku: string }
  | { kind: 'invalid_qty';         qty: unknown }
  | { kind: 'invalid_country';     country: unknown };

/**
 * Deterministic offer ID derived from (sku, qty, country). Same inputs
 * → same ID. Six-char base36 hash so it reads like a real reference.
 * fnv1a — small, no crypto dependency, plenty of spread for a demo.
 */
function offerIdFor(sku: string, qty: number, country: string): string {
  const input = `${sku}|${qty}|${country.toUpperCase()}`;
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) >>> 0) + ((h << 4) >>> 0) + ((h << 7) >>> 0) + ((h << 8) >>> 0) + ((h << 24) >>> 0)) >>> 0;
  }
  return 'OFF-' + h.toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

function shippingZone(country: string): 'eu' | 'world' {
  return EU_COUNTRIES.has(country.toUpperCase()) ? 'eu' : 'world';
}

function tierFor(qty: number) {
  for (const t of VOLUME_TIERS) if (qty >= t.minPieces) return t;
  return VOLUME_TIERS[VOLUME_TIERS.length - 1];
}

/**
 * Build an offer for (sku, qty, country). Returns either a valid
 * Offer or a discriminated OfferError so the caller can choose a
 * 400 vs. 404 response shape.
 *
 * `issuedAtMs` is passed in so the request handler stamps it once
 * (Route Handlers run server-side per request — Date.now() is fine
 * there, we just don't bake it into the pricing module itself).
 */
export function computeOffer({
  sku,
  qty,
  delivery_country,
  issuedAtMs
}: {
  sku: string;
  qty: number;
  delivery_country: string;
  issuedAtMs: number;
}): Offer | OfferError {
  const product = productBySku(sku);
  if (!product) return { kind: 'unknown_sku', sku };
  if (!Number.isInteger(qty) || qty < 1 || qty > 100_000) {
    return { kind: 'invalid_qty', qty };
  }
  if (typeof delivery_country !== 'string' || !/^[A-Za-z]{2}$/.test(delivery_country)) {
    return { kind: 'invalid_country', country: delivery_country };
  }

  const country = delivery_country.toUpperCase();
  const tier    = tierFor(qty);

  // Pricing is per-piece. Per-pack list price ÷ packSize = per-piece
  // list price. Round each price to cents.
  const unitListPerPiece = round2(product.priceEur / product.packSize);
  const unitDiscounted   = round2(unitListPerPiece * (1 - tier.discountPct / 100));
  const subtotal         = round2(unitDiscounted * qty);

  const zone     = shippingZone(country);
  const shipping = SHIPPING_EUR[zone];
  const total    = round2(subtotal + shipping);

  // 14-day validity window. Day-precision so the same offer stays
  // visually identical when reloaded within the same day.
  const validUntil = new Date(issuedAtMs + 14 * 24 * 3600 * 1000);
  validUntil.setUTCHours(23, 59, 59, 0);

  const packs = Math.ceil(qty / product.packSize);

  return {
    offer_id:                  offerIdFor(sku, qty, country),
    product,
    qty,
    packs_required:            packs,
    unit_price_list_eur:       unitListPerPiece,
    discount_pct:              tier.discountPct,
    tier_label:                tier.label,
    unit_price_discounted_eur: unitDiscounted,
    subtotal_eur:              subtotal,
    shipping_eur:              shipping,
    shipping_zone:             zone,
    total_eur:                 total,
    currency:                  'EUR',
    delivery_country:          country,
    valid_until_iso:           validUntil.toISOString().slice(0, 10),
    payment_terms:             'Net 30 days from invoice issuance.',
    delivery_terms:            zone === 'eu'
      ? 'DAP (Incoterms 2020) — duty unpaid where applicable.'
      : 'DAP (Incoterms 2020) — buyer settles import duty and local VAT.',
    delivery_estimate_days:    zone === 'eu' ? '5-7 business days' : '8-14 business days'
  };
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export function isOfferError(x: Offer | OfferError): x is OfferError {
  return 'kind' in x;
}
