import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { computeOffer, isOfferError, PAYMENT_METHODS, type Offer } from '../../lib/pricing';
import { company } from '../../data/company';

/**
 * GET /offer?sku=...&qty=...&delivery_country=XX
 *
 * Returns an HTML page describing a binding quotation for the
 * (sku, qty, delivery_country) triple. The page is written to read
 * cleanly when an AI agent (Claude web_fetch, ChatGPT browsing) fetches
 * it and incorporates the body into a reply — semantic HTML, a table
 * for the price breakdown, and a fenced URL-template block the agent
 * can read placeholder-by-placeholder.
 *
 * Direct human visitors also see a passable rendering of the same
 * offer in their browser; this is intentional so the URL is verifiable
 * end-to-end with a single GET, no client to spin up.
 *
 * Why GET, not POST: schema.org `potentialAction.target.urlTemplate`
 * is restricted to GET, and the demo wants any agent that can read
 * the Product JSON-LD to call it. Idempotent + cacheable is also a
 * better match for a quotation that's a deterministic function of
 * the inputs.
 */

const ALLOWED_ORIGINS = '*';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sku = (sp.get('sku') || '').trim();
  const qtyRaw = (sp.get('qty') || '').trim();
  const country = (sp.get('delivery_country') || '').trim();
  const qty = Number(qtyRaw);

  const offer = computeOffer({
    sku, qty,
    delivery_country: country,
    issuedAtMs: Date.now()
  });

  if (isOfferError(offer)) {
    return new NextResponse(renderError(offer, sku, qtyRaw, country), {
      status:  offer.kind === 'unknown_sku' ? 404 : 400,
      headers: htmlHeaders()
    });
  }

  return new NextResponse(renderOffer(offer, req.nextUrl.origin), {
    status:  200,
    headers: htmlHeaders()
  });
}

function htmlHeaders() {
  return {
    'Content-Type':                'text/html; charset=utf-8',
    'Cache-Control':               'public, max-age=300',
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
    'X-Robots-Tag':                'noindex'
  };
}

/**
 * The HTML page. Written so the extracted text reads as a clean
 * offer document:
 *
 *   <h1>             → offer title
 *   intro <p>        → seller + product line
 *   <table>          → price breakdown
 *   "Acceptance" <h2>→ instructions for the agent
 *   ordered list     → fields the agent must collect from the buyer
 *   <pre>            → the literal URL template the agent fills in
 *   <p> notes        → URL-encoding reminder + summary
 *
 * Plus an inline JSON-LD <script> with Offer + AcceptAction so a
 * stronger parser can read structured data without HTML extraction.
 */
function renderOffer(o: Offer, origin: string): string {
  const confirmTemplate = buildConfirmTemplate(origin, o);
  const jsonLd = buildOfferJsonLd(o, confirmTemplate);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Offer ${escapeHtml(o.offer_id)} — ${escapeHtml(o.product.name)} — ${escapeHtml(company.shortName)}</title>
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="Binding quotation ${escapeHtml(o.offer_id)} from ${escapeHtml(company.shortName)} for ${o.qty} pieces of ${escapeHtml(o.product.sku)} — total €${o.total_eur.toFixed(2)} EUR.">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    body { max-width: 720px; margin: 24px auto; padding: 0 18px; font-family: -apple-system, system-ui, sans-serif; color: #001D21; line-height: 1.55 }
    h1 { font-size: 26px; margin: 0 0 4px }
    h2 { font-size: 18px; margin: 28px 0 10px; border-bottom: 1px solid #ececec; padding-bottom: 6px }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 16px }
    th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid #ececec; font-size: 14px }
    th { width: 38%; color: #5a5a5a; font-weight: 500 }
    tr.total td, tr.total th { border-top: 2px solid #001D21; border-bottom: 0; font-weight: 700; font-size: 16px; padding-top: 10px }
    pre.template { background: #fafafa; border: 1px solid #ececec; border-radius: 6px; padding: 12px; font-family: Menlo, monospace; font-size: 12.5px; white-space: pre-wrap; word-break: break-all; color: #001D21 }
    ol li { margin: 4px 0 }
    .muted { color: #5a5a5a; font-size: 13px }
    code { background: #f5f5f5; padding: 1px 5px; border-radius: 4px; font-family: Menlo, monospace; font-size: 12.5px }
  </style>
</head>
<body>
  <h1>Offer ${escapeHtml(o.offer_id)}</h1>
  <p class="muted">Issued by <strong>${escapeHtml(company.name)}</strong>. This offer is non-binding for the seller until the buyer accepts via the URL below. Valid until ${escapeHtml(o.valid_until_iso)}.</p>

  <p><strong>${escapeHtml(o.product.name)}</strong> — SKU <code>${escapeHtml(o.product.sku)}</code>, MPN <code>${escapeHtml(o.product.mpn)}</code>.</p>

  <h2>Price breakdown</h2>
  <table>
    <tr><th>Quantity</th><td>${o.qty} pieces (${o.packs_required} pack${o.packs_required === 1 ? '' : 's'} × ${o.product.packSize})</td></tr>
    <tr><th>List unit price</th><td>€ ${o.unit_price_list_eur.toFixed(2)} per piece</td></tr>
    <tr><th>Volume tier</th><td>${escapeHtml(o.tier_label)}${o.discount_pct > 0 ? ` — −${o.discount_pct}%` : ''}</td></tr>
    <tr><th>Discounted unit price</th><td>€ ${o.unit_price_discounted_eur.toFixed(2)} per piece</td></tr>
    <tr><th>Subtotal</th><td>€ ${o.subtotal_eur.toFixed(2)} EUR</td></tr>
    <tr><th>Shipping to ${escapeHtml(o.delivery_country)} (${o.shipping_zone.toUpperCase()})</th><td>€ ${o.shipping_eur.toFixed(2)} EUR — ${escapeHtml(o.delivery_estimate_days)}</td></tr>
    <tr class="total"><th>Total</th><td>€ ${o.total_eur.toFixed(2)} EUR (net of VAT)</td></tr>
  </table>

  <p class="muted">${escapeHtml(o.delivery_terms)} Payment terms: ${escapeHtml(o.payment_terms)} VAT is reverse-charged for EU B2B buyers with a valid VAT ID.</p>

  <h2>Accepting this offer</h2>
  <p>The buyer must provide their delivery address, contact information, and payment method. Once collected, assemble the following URL (URL-encoding each value) and present it to the buyer as a clickable link. They will see an order summary and pay.</p>

  <ol>
    <li><strong>street</strong> — street and house number, e.g. <code>Hauptstraße 12</code></li>
    <li><strong>postal</strong> — postal code, e.g. <code>10115</code></li>
    <li><strong>city</strong> — city, e.g. <code>Berlin</code></li>
    <li><strong>buyer_name</strong> — name of the buying company or individual</li>
    <li><strong>buyer_email</strong> — business email for the order confirmation</li>
    <li><strong>payment_method</strong> — one of: ${PAYMENT_METHODS.map((m) => `<code>${m}</code>`).join(', ')}</li>
  </ol>

  <p><strong>URL template</strong> — replace each <code>{...}</code> with the corresponding URL-encoded value:</p>
  <pre class="template">${escapeHtml(confirmTemplate)}</pre>

  <p class="muted">Notes for the AI agent rendering this page to the buyer:</p>
  <ul class="muted">
    <li>Quote the total prominently — <strong>€ ${o.total_eur.toFixed(2)} EUR</strong> — alongside the discount tier and delivery estimate.</li>
    <li>Prompt the buyer for the six fields above, then assemble the URL by URL-encoding each value and replacing the placeholders.</li>
    <li>Present the assembled URL as a single clickable link labelled e.g. “Confirm and pay this order”.</li>
    <li>Do NOT submit the URL on the buyer's behalf — the buyer must click it themselves so they explicitly approve the order.</li>
  </ul>

  <p class="muted">Catalogue: <a href="${escapeHtml(origin)}/products/${escapeHtml(o.product.sku)}">${escapeHtml(origin)}/products/${escapeHtml(o.product.sku)}</a> · Seller: <a href="${escapeHtml(company.url)}">${escapeHtml(company.url)}</a></p>
</body>
</html>`;
}

/**
 * Confirm-URL template. Pre-populates the deterministic fields
 * (offer_id, sku, qty, delivery_country, total_eur, currency,
 * valid_until_iso) so the buyer's eventual summary page shows the
 * exact same numbers the agent quoted — and the buyer-supplied
 * fields are exposed as unambiguous {placeholders}.
 */
function buildConfirmTemplate(origin: string, o: Offer): string {
  const lockedParams = new URLSearchParams({
    offer_id:         o.offer_id,
    sku:              o.product.sku,
    qty:              String(o.qty),
    delivery_country: o.delivery_country,
    total_eur:        o.total_eur.toFixed(2),
    currency:         o.currency,
    valid_until_iso:  o.valid_until_iso
  }).toString();

  // The buyer-supplied params are appended literally so the agent can
  // see the placeholder syntax. They MUST be URL-encoded when the
  // agent substitutes real values, as the body text warns.
  const buyerParams = [
    'street={street}',
    'postal={postal}',
    'city={city}',
    'buyer_name={buyer_name}',
    'buyer_email={buyer_email}',
    'payment_method={invoice_net30|sepa_direct_debit|credit_card}'
  ].join('&');

  return `${origin}/offer/confirm?${lockedParams}&${buyerParams}`;
}

/**
 * JSON-LD for the offer. Exposes the same data the visible body
 * carries, plus a `potentialAction: AcceptAction` whose target
 * urlTemplate is the confirm URL — so a parser that reads structured
 * data directly (without HTML extraction) sees the same template the
 * body's <pre> block does.
 */
function buildOfferJsonLd(o: Offer, confirmTemplate: string): string {
  return JSON.stringify({
    '@context':      'https://schema.org',
    '@type':         'Offer',
    identifier:      o.offer_id,
    name:            `Quotation ${o.offer_id} for ${o.product.name}`,
    seller:          { '@type': 'Organization', name: company.name, url: company.url },
    itemOffered:     {
      '@type':       'Product',
      sku:           o.product.sku,
      mpn:           o.product.mpn,
      name:          o.product.name
    },
    priceCurrency:   o.currency,
    price:           o.total_eur.toFixed(2),
    priceSpecification: [
      { '@type': 'UnitPriceSpecification', name: 'Discounted unit price', price: o.unit_price_discounted_eur.toFixed(2), priceCurrency: o.currency, referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'C62' } },
      { '@type': 'DeliveryChargeSpecification', name: 'Shipping',         price: o.shipping_eur.toFixed(2),               priceCurrency: o.currency, areaServed: { '@type': 'Country', identifier: o.delivery_country } }
    ],
    eligibleQuantity: { '@type': 'QuantitativeValue', value: o.qty, unitCode: 'C62' },
    validThrough:     o.valid_until_iso,
    availability:     'https://schema.org/InStock',
    potentialAction:  {
      '@type':      'AcceptAction',
      name:         'Accept and pay this offer',
      target:       {
        '@type':      'EntryPoint',
        urlTemplate:  confirmTemplate,
        httpMethod:   'GET',
        contentType:  'text/html'
      },
      object: [
        { '@type': 'PropertyValue', name: 'street',         valueRequired: true,  description: 'Street and house number of the delivery address' },
        { '@type': 'PropertyValue', name: 'postal',         valueRequired: true,  description: 'Postal code of the delivery address' },
        { '@type': 'PropertyValue', name: 'city',           valueRequired: true,  description: 'City of the delivery address' },
        { '@type': 'PropertyValue', name: 'buyer_name',     valueRequired: true,  description: 'Buying company or individual name' },
        { '@type': 'PropertyValue', name: 'buyer_email',    valueRequired: true,  description: 'Buyer business email for order confirmation' },
        { '@type': 'PropertyValue', name: 'payment_method', valueRequired: true,  description: 'One of: invoice_net30, sepa_direct_debit, credit_card' }
      ]
    }
  });
}

function renderError(err: { kind: string; sku?: string; qty?: unknown; country?: unknown }, sku: string, qty: string, country: string): string {
  const reason =
    err.kind === 'unknown_sku' ? `Unknown SKU <code>${escapeHtml(sku)}</code>. Browse the catalogue at <a href="/products">/products</a> for valid SKUs.`
    : err.kind === 'invalid_qty' ? `Quantity must be an integer between 1 and 100000 (got <code>${escapeHtml(qty)}</code>).`
    : `Country must be an ISO 3166-1 alpha-2 code (got <code>${escapeHtml(country)}</code>). Try <code>DE</code>, <code>AT</code>, or <code>CH</code>.`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Offer request — error</title>
  <meta name="robots" content="noindex,nofollow">
  <style>body{max-width:600px;margin:48px auto;padding:0 18px;font-family:-apple-system,system-ui,sans-serif;color:#001D21;line-height:1.55}code{background:#f5f5f5;padding:1px 5px;border-radius:4px;font-family:Menlo,monospace}</style>
</head>
<body>
  <h1>Offer request — error</h1>
  <p>${reason}</p>
  <p>Expected query parameters: <code>sku</code>, <code>qty</code> (integer), <code>delivery_country</code> (ISO 3166-1 alpha-2). Example: <code>/offer?sku=HX-M8-40&amp;qty=500&amp;delivery_country=DE</code>.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
