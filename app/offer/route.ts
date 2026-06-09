import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { computeOffer, isOfferError, parseItems, formatItems, PAYMENT_METHODS, type Offer, type LineItem } from '../../lib/pricing';
import { company } from '../../data/company';

/**
 * GET /offer?items=SKU:qty,SKU:qty&delivery_country=XX
 * GET /offer?sku=SKU&qty=N&delivery_country=XX        (single-SKU shorthand)
 *
 * Returns an HTML page describing a binding quotation for the
 * requested line items. The page is written to read cleanly when an
 * AI agent (Claude web_fetch, ChatGPT browsing) fetches it and
 * incorporates the body into a reply — semantic HTML, a table for the
 * price breakdown, and a fenced URL-template block the agent can read
 * placeholder-by-placeholder.
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
  const country = (sp.get('delivery_country') || '').trim();

  const itemsResult = readItems(sp);
  if (typeof itemsResult === 'string') {
    return new NextResponse(renderError(itemsResult), { status: 400, headers: htmlHeaders() });
  }

  const offer = computeOffer({
    items: itemsResult,
    delivery_country: country,
    issuedAtMs: Date.now()
  });

  if (isOfferError(offer)) {
    return new NextResponse(renderError(humaniseError(offer, country)), {
      status:  offer.kind === 'unknown_sku' ? 404 : 400,
      headers: htmlHeaders()
    });
  }

  return new NextResponse(renderOffer(offer, req.nextUrl.origin), {
    status:  200,
    headers: htmlHeaders()
  });
}

/**
 * Read the requested line items from the query, accepting either
 * shape. Returns the parsed LineItem[] or an error string.
 */
function readItems(sp: URLSearchParams): LineItem[] | string {
  const itemsRaw = (sp.get('items') || '').trim();
  if (itemsRaw) {
    const parsed = parseItems(itemsRaw);
    if (typeof parsed === 'string') return `items parameter: ${parsed}`;
    return parsed;
  }
  const sku = (sp.get('sku') || '').trim();
  const qtyStr = (sp.get('qty') || '').trim();
  if (sku || qtyStr) {
    const qty = Number(qtyStr);
    if (!sku) return 'sku parameter is required when using the single-SKU shorthand';
    if (!Number.isInteger(qty) || qty < 1) return `qty must be a positive integer (got "${qtyStr}")`;
    return [{ sku, qty }];
  }
  return 'Missing items. Provide either ?items=SKU:qty,SKU:qty (multi-line) or ?sku=SKU&qty=N (single-SKU shorthand).';
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
 *   intro <p>        → seller + items summary
 *   <table>          → line items + totals
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
  const itemsHeader = o.lines.length === 1
    ? `<strong>${escapeHtml(o.lines[0].name)}</strong> — SKU <code>${escapeHtml(o.lines[0].sku)}</code>, MPN <code>${escapeHtml(o.lines[0].mpn)}</code>.`
    : `<strong>${o.lines.length} line items</strong> — total ${o.lines.reduce((s, l) => s + l.qty, 0).toLocaleString()} pieces across ${o.lines.length} SKUs.`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Offer ${escapeHtml(o.offer_id)} — ${escapeHtml(o.lines.length === 1 ? o.lines[0].name : `${o.lines.length} line items`)} — ${escapeHtml(company.shortName)}</title>
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="Binding quotation ${escapeHtml(o.offer_id)} from ${escapeHtml(company.shortName)} — total €${o.total_eur.toFixed(2)} EUR across ${o.lines.length} line item${o.lines.length === 1 ? '' : 's'} delivered to ${o.delivery_country}.">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    body { max-width: 760px; margin: 24px auto; padding: 0 18px; font-family: -apple-system, system-ui, sans-serif; color: #001D21; line-height: 1.55 }
    h1 { font-size: 26px; margin: 0 0 4px }
    h2 { font-size: 18px; margin: 28px 0 10px; border-bottom: 1px solid #ececec; padding-bottom: 6px }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 16px }
    th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid #ececec; font-size: 14px }
    table.lines th { color: #5a5a5a; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em }
    table.lines td.num, table.lines th.num { text-align: right; font-variant-numeric: tabular-nums }
    table.breakdown th { width: 38%; color: #5a5a5a; font-weight: 500 }
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

  <p>${itemsHeader}</p>

  <h2>Line items</h2>
  <table class="lines">
    <thead>
      <tr>
        <th>SKU</th>
        <th>Product</th>
        <th class="num">Qty (pcs)</th>
        <th class="num">Unit list</th>
        <th class="num">Discount</th>
        <th class="num">Unit net</th>
        <th class="num">Line total</th>
      </tr>
    </thead>
    <tbody>
      ${o.lines.map((l) => `
      <tr>
        <td><code>${escapeHtml(l.sku)}</code></td>
        <td>${escapeHtml(l.name)}</td>
        <td class="num">${l.qty.toLocaleString()}</td>
        <td class="num">€ ${l.unit_price_list_eur.toFixed(2)}</td>
        <td class="num">${l.discount_pct > 0 ? `−${l.discount_pct}% (${escapeHtml(l.tier_label)})` : 'list'}</td>
        <td class="num">€ ${l.unit_price_discounted_eur.toFixed(2)}</td>
        <td class="num"><strong>€ ${l.line_subtotal_eur.toFixed(2)}</strong></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>Totals</h2>
  <table class="breakdown">
    <tr><th>Subtotal (${o.lines.length} line item${o.lines.length === 1 ? '' : 's'})</th><td>€ ${o.subtotal_eur.toFixed(2)} EUR</td></tr>
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
    <li>Quote the total prominently — <strong>€ ${o.total_eur.toFixed(2)} EUR</strong> — alongside the per-line discount tiers and delivery estimate.</li>
    <li>Prompt the buyer for the six fields above, then assemble the URL by URL-encoding each value and replacing the placeholders.</li>
    <li>Present the assembled URL as a single clickable link labelled e.g. “Confirm and pay this order”.</li>
    <li>Do NOT submit the URL on the buyer's behalf — the buyer must click it themselves so they explicitly approve the order.</li>
  </ul>

  <p class="muted">Catalogue: <a href="${escapeHtml(origin)}/products">${escapeHtml(origin)}/products</a> · Seller: <a href="${escapeHtml(company.url)}">${escapeHtml(company.url)}</a></p>
</body>
</html>`;
}

/**
 * Confirm-URL template. Pre-populates the deterministic fields
 * (offer_id, items, delivery_country, total_eur, currency,
 * valid_until_iso) so the buyer's eventual summary page shows the
 * exact same numbers the agent quoted — and the buyer-supplied
 * fields are exposed as unambiguous {placeholders}.
 */
function buildConfirmTemplate(origin: string, o: Offer): string {
  const lockedParams = new URLSearchParams({
    offer_id:         o.offer_id,
    items:            formatItems(o.lines),
    delivery_country: o.delivery_country,
    total_eur:        o.total_eur.toFixed(2),
    currency:         o.currency,
    valid_until_iso:  o.valid_until_iso
  }).toString();

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
  const itemOffered = o.lines.length === 1
    ? { '@type': 'Product', sku: o.lines[0].sku, mpn: o.lines[0].mpn, name: o.lines[0].name }
    : {
        '@type':         'AggregateOffer',
        offerCount:      o.lines.length,
        priceCurrency:   o.currency,
        lowPrice:        Math.min(...o.lines.map((l) => l.line_subtotal_eur)).toFixed(2),
        highPrice:       Math.max(...o.lines.map((l) => l.line_subtotal_eur)).toFixed(2),
        offers:          o.lines.map((l) => ({
          '@type':       'Offer',
          itemOffered:   { '@type': 'Product', sku: l.sku, mpn: l.mpn, name: l.name },
          eligibleQuantity: { '@type': 'QuantitativeValue', value: l.qty, unitCode: 'C62' },
          price:         l.line_subtotal_eur.toFixed(2),
          priceCurrency: o.currency
        }))
      };

  return JSON.stringify({
    '@context':      'https://schema.org',
    '@type':         'Offer',
    identifier:      o.offer_id,
    name:            `Quotation ${o.offer_id} from ${company.name}`,
    seller:          { '@type': 'Organization', name: company.name, url: company.url },
    itemOffered,
    priceCurrency:   o.currency,
    price:           o.total_eur.toFixed(2),
    priceSpecification: [
      { '@type': 'DeliveryChargeSpecification', name: 'Shipping', price: o.shipping_eur.toFixed(2), priceCurrency: o.currency, areaServed: { '@type': 'Country', identifier: o.delivery_country } }
    ],
    validThrough:    o.valid_until_iso,
    availability:    'https://schema.org/InStock',
    potentialAction: {
      '@type':     'AcceptAction',
      name:        'Accept and pay this offer',
      target:      {
        '@type':     'EntryPoint',
        urlTemplate: confirmTemplate,
        httpMethod:  'GET',
        contentType: 'text/html'
      },
      object: [
        { '@type': 'PropertyValue', name: 'street',         valueRequired: true, description: 'Street and house number of the delivery address' },
        { '@type': 'PropertyValue', name: 'postal',         valueRequired: true, description: 'Postal code of the delivery address' },
        { '@type': 'PropertyValue', name: 'city',           valueRequired: true, description: 'City of the delivery address' },
        { '@type': 'PropertyValue', name: 'buyer_name',     valueRequired: true, description: 'Buying company or individual name' },
        { '@type': 'PropertyValue', name: 'buyer_email',    valueRequired: true, description: 'Buyer business email for order confirmation' },
        { '@type': 'PropertyValue', name: 'payment_method', valueRequired: true, description: 'One of: invoice_net30, sepa_direct_debit, credit_card' }
      ]
    }
  });
}

function humaniseError(err: ReturnType<typeof computeOffer> & object, country: string): string {
  if (!('kind' in err)) return 'unknown error';
  switch (err.kind) {
    case 'no_items':         return 'No items specified.';
    case 'too_many_items':   return `Too many line items (max ${err.max}).`;
    case 'unknown_sku':      return `Unknown SKU <code>${escapeHtml(err.sku)}</code>. Browse the catalogue at <a href="/products">/products</a> for valid SKUs.`;
    case 'invalid_qty':      return `Quantity for <code>${escapeHtml(err.sku)}</code> must be an integer between 1 and 100000 (got <code>${escapeHtml(String(err.qty))}</code>).`;
    case 'invalid_country':  return `delivery_country must be an ISO 3166-1 alpha-2 code (got <code>${escapeHtml(String(country))}</code>). Try <code>DE</code>, <code>AT</code>, or <code>CH</code>.`;
    case 'invalid_line':     return `Invalid line: ${escapeHtml(err.detail)}.`;
  }
}

function renderError(message: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Offer request — error</title>
  <meta name="robots" content="noindex,nofollow">
  <style>body{max-width:640px;margin:48px auto;padding:0 18px;font-family:-apple-system,system-ui,sans-serif;color:#001D21;line-height:1.55}code{background:#f5f5f5;padding:1px 5px;border-radius:4px;font-family:Menlo,monospace}</style>
</head>
<body>
  <h1>Offer request — error</h1>
  <p>${message}</p>
  <p>Endpoint shape: <code>GET /offer?items=SKU:qty,SKU:qty&amp;delivery_country=XX</code> for a multi-line quote, or <code>GET /offer?sku=SKU&amp;qty=N&amp;delivery_country=XX</code> for a single SKU. Country must be ISO 3166-1 alpha-2.</p>
  <p>Example: <code>/offer?items=HX-M8-40:500,HX-M10-50:300&amp;delivery_country=DE</code></p>
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
