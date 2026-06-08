import { productBySku, type Product } from './products';
import { company } from './company';

/**
 * Offer creation. Deterministic, no DB — derives a binding quote from
 * SKU + quantity using a plausible B2B volume-discount ladder.
 *
 * `quantity` is in pieces, not packs. Pricing scales linearly off the
 * per-piece list price (packPrice / packSize), then a tier discount
 * applies, then shipping is added.
 *
 * Returned shape is what the WebMCP `create_offer` tool serialises and
 * what the supplier audit's report.offer captures.
 */

export type Offer = {
  offer_id:                string;
  sku:                     string;
  product_name:            string;
  category:                string;
  quantity_pieces:         number;
  pack_size:               number;
  packs_required:          number;
  list_unit_price_eur:     number;     // per piece, list
  discount_pct:            number;     // 0, 5, 10, 15
  discounted_unit_price_eur: number;   // per piece, after discount
  subtotal_eur:            number;
  shipping_eur:            number;
  total_eur:               number;
  currency:                'EUR';
  delivery_country:        string;
  delivery_estimate_days:  number;
  payment_terms:           string;
  delivery_terms:          string;
  valid_until_iso:         string;
  issued_at_iso:           string;
  seller:                  { name: string; url: string };
  accept_url:              string;
};

export class OfferError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Tier table — per-piece quantity → discount %. Keep monotonic;
 * a binary-search-style scan works since the tiers are short.
 */
const VOLUME_TIERS: { min: number; pct: number }[] = [
  { min: 0,    pct: 0  },
  { min: 100,  pct: 5  },
  { min: 500,  pct: 10 },
  { min: 2000, pct: 15 }
];

/**
 * Stable per-tenant pseudo-randomness for the offer id — we don't have
 * Date.now()/Math.random() in some agentic-runtime contexts and we want
 * a deterministic id derivable from the inputs. Hash sku + quantity +
 * delivery_country into a short suffix.
 */
function shortHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).toUpperCase().slice(0, 6).padEnd(6, '0');
}

function pickTier(qty: number) {
  let chosen = VOLUME_TIERS[0];
  for (const t of VOLUME_TIERS) if (qty >= t.min) chosen = t;
  return chosen;
}

/**
 * Shipping schedule — flat €14 to DE/AT/CH, €24 to other EU. Quantity
 * doesn't influence the rate in this fixture (we're not modelling
 * pallet logistics).
 */
function shippingFor(country: string) {
  const c = country.toUpperCase();
  if (c === 'DE' || c === 'AT' || c === 'CH') return 14;
  return 24;
}

/**
 * Realistic delivery estimate in working days.
 */
function deliveryDaysFor(country: string) {
  const c = country.toUpperCase();
  if (c === 'DE') return 1;
  if (c === 'AT' || c === 'CH') return 2;
  return 4;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export function createOffer(args: {
  sku:               string;
  quantity:          number;
  delivery_country?: string;
}): Offer {
  const sku       = String(args.sku || '').trim();
  const quantity  = Math.floor(Number(args.quantity));
  const country   = (args.delivery_country || 'DE').toUpperCase();

  if (!sku) throw new OfferError('invalid_sku', 'sku is required');
  if (!Number.isFinite(quantity) || quantity < 1)
    throw new OfferError('invalid_quantity', 'quantity must be a positive integer (pieces)');

  const product: Product | undefined = productBySku(sku);
  if (!product) throw new OfferError('sku_not_found', `No catalogue item with SKU ${sku}`);

  const listUnitPrice = product.priceEur / product.packSize;
  const tier = pickTier(quantity);
  const discountedUnit = round2(listUnitPrice * (1 - tier.pct / 100));
  const subtotal       = round2(discountedUnit * quantity);
  const shipping       = shippingFor(country);
  const total          = round2(subtotal + shipping);

  const packsRequired  = Math.ceil(quantity / product.packSize);

  // Fixed issue time in the offer id — the audit runtime may forbid
  // Date.now()/new Date(), so we anchor on a build-time constant and
  // shift validity off it. The agent + the report don't care which
  // wall-clock the offer is anchored to; only the relative window matters.
  const issuedAt = new Date('2026-06-08T12:00:00.000Z');
  const validUntil = new Date(issuedAt.getTime() + 14 * 24 * 3600 * 1000);

  const offerId = `OFF-${issuedAt.toISOString().slice(0, 10)}-${shortHash(sku + ':' + quantity + ':' + country)}`;

  return {
    offer_id:                offerId,
    sku,
    product_name:            product.name,
    category:                product.category.label,
    quantity_pieces:         quantity,
    pack_size:               product.packSize,
    packs_required:          packsRequired,
    list_unit_price_eur:     round2(listUnitPrice),
    discount_pct:            tier.pct,
    discounted_unit_price_eur: discountedUnit,
    subtotal_eur:            subtotal,
    shipping_eur:            shipping,
    total_eur:               total,
    currency:                'EUR',
    delivery_country:        country,
    delivery_estimate_days:  deliveryDaysFor(country),
    payment_terms:           'Net 30',
    delivery_terms:          'DAP, Incoterms 2020',
    valid_until_iso:         validUntil.toISOString(),
    issued_at_iso:           issuedAt.toISOString(),
    seller:                  { name: company.name, url: company.url },
    accept_url:              `${company.url}/offers/${offerId}`
  };
}
