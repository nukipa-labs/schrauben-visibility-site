import { productBySku } from '../data/products';
import type { Product } from '../data/products';

/**
 * Pure pricing helper used by the GET /offer endpoint and the
 * /offer/confirm summary page. No I/O. The offer ID is derived from
 * the canonical (items + country) string so the same query always
 * produces the same offer. `valid_until_iso` is computed from a
 * caller-supplied issued-at timestamp so server-rendered pages can
 * stamp it once at request time without breaking that determinism.
 *
 * Multi-line offers are the canonical shape — a single-SKU request is
 * just a one-line offer. Industrial procurement is inherently
 * multi-line ("2000× M8 + 2000× M10") and the GET /offer route
 * accepts both shapes (`items=` for multi, `sku=`+`qty=` for one).
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

export type LineItem = { sku: string; qty: number };

export type OfferLine = {
  sku:                      string;
  mpn:                      string;
  name:                     string;
  qty:                      number;
  packs_required:           number;
  unit_price_list_eur:      number;
  discount_pct:             number;
  tier_label:               string;
  unit_price_discounted_eur:number;
  line_subtotal_eur:        number;
};

export type Offer = {
  offer_id:                 string;
  lines:                    OfferLine[];
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
  | { kind: 'no_items' }
  | { kind: 'too_many_items'; max: number }
  | { kind: 'invalid_line';   detail: string }
  | { kind: 'unknown_sku';    sku: string }
  | { kind: 'invalid_qty';    sku: string; qty: unknown }
  | { kind: 'invalid_country';country: unknown };

const MAX_LINES = 20;

/**
 * Deterministic offer ID derived from (canonical items + country).
 * Items are sorted alphabetically by SKU so {A:1,B:2} and {B:2,A:1}
 * yield the same ID. fnv1a — small, no crypto dependency.
 */
function offerIdFor(items: LineItem[], country: string): string {
  const canonical = items
    .map((i) => `${i.sku.toUpperCase()}:${i.qty}`)
    .sort()
    .join(',');
  const input = `${canonical}|${country.toUpperCase()}`;
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
 * Build a multi-line offer. Volume tier is computed per-line based on
 * that line's qty (not the cumulative cross-line total) — that matches
 * how the example seller actually prices: each SKU is a separate
 * manufacturing run, and the discount reflects per-SKU economies of
 * scale, not basket size. One shipping charge per offer (the buyer
 * gets one shipment), zone determined by delivery_country.
 */
export function computeOffer({
  items,
  delivery_country,
  issuedAtMs
}: {
  items: LineItem[];
  delivery_country: string;
  issuedAtMs: number;
}): Offer | OfferError {
  if (!items.length)            return { kind: 'no_items' };
  if (items.length > MAX_LINES) return { kind: 'too_many_items', max: MAX_LINES };
  if (typeof delivery_country !== 'string' || !/^[A-Za-z]{2}$/.test(delivery_country)) {
    return { kind: 'invalid_country', country: delivery_country };
  }

  const country = delivery_country.toUpperCase();
  const lines: OfferLine[] = [];

  for (const { sku, qty } of items) {
    if (!sku || typeof sku !== 'string') {
      return { kind: 'invalid_line', detail: `empty sku in line` };
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 100_000) {
      return { kind: 'invalid_qty', sku, qty };
    }
    const product = productBySku(sku);
    if (!product) return { kind: 'unknown_sku', sku };

    const tier               = tierFor(qty);
    const unitListPerPiece   = round2(product.priceEur / product.packSize);
    const unitDiscounted     = round2(unitListPerPiece * (1 - tier.discountPct / 100));
    const lineSubtotal       = round2(unitDiscounted * qty);
    const packsRequired      = Math.ceil(qty / product.packSize);

    lines.push({
      sku:                       product.sku,
      mpn:                       product.mpn,
      name:                      product.name,
      qty,
      packs_required:            packsRequired,
      unit_price_list_eur:       unitListPerPiece,
      discount_pct:              tier.discountPct,
      tier_label:                tier.label,
      unit_price_discounted_eur: unitDiscounted,
      line_subtotal_eur:         lineSubtotal
    });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.line_subtotal_eur, 0));
  const zone     = shippingZone(country);
  const shipping = SHIPPING_EUR[zone];
  const total    = round2(subtotal + shipping);

  const validUntil = new Date(issuedAtMs + 14 * 24 * 3600 * 1000);
  validUntil.setUTCHours(23, 59, 59, 0);

  return {
    offer_id:                offerIdFor(items, country),
    lines,
    subtotal_eur:            subtotal,
    shipping_eur:            shipping,
    shipping_zone:           zone,
    total_eur:               total,
    currency:                'EUR',
    delivery_country:        country,
    valid_until_iso:         validUntil.toISOString().slice(0, 10),
    payment_terms:           'Net 30 days from invoice issuance.',
    delivery_terms:          zone === 'eu'
      ? 'DAP (Incoterms 2020) — duty unpaid where applicable.'
      : 'DAP (Incoterms 2020) — buyer settles import duty and local VAT.',
    delivery_estimate_days:  zone === 'eu' ? '5-7 business days' : '8-14 business days'
  };
}

/**
 * Serialise a line-item list back to the wire format used in URLs and
 * confirm-page query params: `SKU:qty,SKU:qty`.
 */
export function formatItems(items: LineItem[] | OfferLine[]): string {
  return items.map((i) => `${i.sku}:${i.qty}`).join(',');
}

/**
 * Parse the `items=SKU:qty,SKU:qty` wire format. Returns a clean
 * LineItem array or a human-readable error string for the route to
 * surface in a 400 response.
 */
export function parseItems(raw: string): LineItem[] | string {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return 'items list is empty';
  const out: LineItem[] = [];
  for (const part of parts) {
    const [skuRaw, qtyStr] = part.split(':');
    const sku = (skuRaw || '').trim();
    const qty = Number((qtyStr || '').trim());
    if (!sku)                   return `line "${part}" — missing SKU before the colon`;
    if (!Number.isFinite(qty))  return `line "${part}" — qty after the colon is not a number`;
    if (!Number.isInteger(qty)) return `line "${part}" — qty must be an integer`;
    if (qty < 1)                return `line "${part}" — qty must be at least 1`;
    out.push({ sku, qty });
  }
  return out;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export function isOfferError(x: Offer | OfferError): x is OfferError {
  return 'kind' in x;
}
