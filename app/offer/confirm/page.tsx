import type { Metadata } from 'next';
import Link from 'next/link';
import { company } from '../../../data/company';
import { PAYMENT_METHODS, parseItems, type PaymentMethod, type LineItem } from '../../../lib/pricing';
import { productBySku } from '../../../data/products';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title:   'Confirm and pay',
  robots:  { index: false, follow: false }
};

/**
 * Confirm-and-pay landing page — the URL the AI agent assembles and
 * presents to the buyer as a clickable link. Reads everything from
 * query params (no DB, no session) so the demo is fully traceable:
 * the URL bar IS the order.
 *
 * The "Pay now" button is a placeholder. In a real implementation it
 * would hand off to a PSP (Stripe Checkout / Adyen / etc.); for the
 * demo it just acknowledges receipt.
 */
export default async function ConfirmOfferPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const order = readOrder(sp);

  if (!order.ok) {
    return (
      <article style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 26, margin: '0 0 8px' }}>Confirm an offer</h1>
        <div className="card" style={{ borderColor: '#f3a4a4', background: '#fef2f2' }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#7f1d1d' }}>
            <strong>Missing or invalid order details.</strong> {order.reason}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: '#7f1d1d' }}>
            This URL is normally assembled by an AI agent after collecting the buyer's delivery address, contact, and payment method. To start over, request a fresh offer at <code>/offer?items=SKU:qty,SKU:qty&amp;delivery_country=…</code>.
          </p>
        </div>
        <p style={{ marginTop: 16, fontSize: 13 }}><Link href="/products">← Back to the catalogue</Link></p>
      </article>
    );
  }

  const o = order.data;

  return (
    <article style={{ maxWidth: 760 }}>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        <Link href="/">Home</Link> · <Link href="/products">Products</Link> · Confirm offer
      </p>

      <header style={{ marginTop: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>Confirm and pay</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Offer <code>{o.offer_id}</code> from <strong>{company.shortName}</strong>. Valid until <strong>{o.valid_until_iso}</strong>.
        </p>
      </header>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Line items</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ececec' }}>
              <th style={{ padding: '6px 8px', color: '#5a5a5a', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKU</th>
              <th style={{ padding: '6px 8px', color: '#5a5a5a', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
              <th style={{ padding: '6px 8px', color: '#5a5a5a', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((it) => {
              const product = productBySku(it.sku);
              return (
                <tr key={it.sku} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'Menlo, monospace' }}>{it.sku}</td>
                  <td style={{ padding: '6px 8px' }}>{product?.name || <span className="muted">(unknown SKU — verify the offer)</span>}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{it.qty.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #001D21', paddingTop: 10 }}>
          <span style={{ color: '#5a5a5a', fontSize: 13 }}>Total ({o.items.length} line item{o.items.length === 1 ? '' : 's'}, shipping incl.)</span>
          <strong style={{ fontSize: 22 }}>€ {o.total_eur.toFixed(2)} {o.currency}</strong>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Delivery</h2>
        <Row label="Recipient">             {o.buyer_name}</Row>
        <Row label="Email">                 {o.buyer_email}</Row>
        <Row label="Address">               {o.street}, {o.postal} {o.city}, {o.delivery_country}</Row>
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Payment</h2>
        <Row label="Method">                {paymentMethodLabel(o.payment_method)}</Row>
      </section>

      {/*
        The "Pay now" affordance. Inert because this is a demo and we
        don't want to wire a real PSP into a fixture site, but the
        markup, styling, and copy mirror what a real conversion-step
        page would look like. The agent's job ends at the assembled
        URL; this is the buyer-confirmation surface.
      */}
      <form action="/offer/confirm" method="get" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          disabled
          style={{
            padding: '14px 28px', borderRadius: 999, border: 'none', cursor: 'not-allowed',
            background: '#001D21', color: '#fff', fontSize: 15, fontWeight: 600, opacity: 0.6
          }}
          title="Demo site — payment integration not wired"
        >
          Pay € {o.total_eur.toFixed(2)} {o.currency} now
        </button>
        <span className="muted" style={{ fontSize: 12 }}>Demo — payment integration not wired.</span>
      </form>

      <p className="muted" style={{ marginTop: 20, fontSize: 12 }}>
        After paying, a confirmation is sent to <strong>{o.buyer_email}</strong>. Questions: <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>.
      </p>
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid #f3f3f3', fontSize: 14 }}>
      <span style={{ color: '#5a5a5a' }}>{label}</span>
      <span style={{ textAlign: 'right', minWidth: 0 }}>{children}</span>
    </div>
  );
}

function paymentMethodLabel(m: PaymentMethod): string {
  switch (m) {
    case 'invoice_net30':    return 'Invoice (net 30 days)';
    case 'sepa_direct_debit':return 'SEPA direct debit';
    case 'credit_card':      return 'Credit card';
  }
}

type Order = {
  ok: true;
  data: {
    offer_id:         string;
    items:            LineItem[];
    delivery_country: string;
    total_eur:        number;
    currency:         string;
    valid_until_iso:  string;
    street:           string;
    postal:           string;
    city:             string;
    buyer_name:       string;
    buyer_email:      string;
    payment_method:   PaymentMethod;
  };
};
type OrderError = { ok: false; reason: string };

function readOrder(sp: Record<string, string | string[] | undefined>): Order | OrderError {
  const str = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return v[0] ?? '';
    return typeof v === 'string' ? v : '';
  };

  // Items source: either `items=SKU:qty,SKU:qty` (canonical) OR the
  // legacy single-SKU triple `sku=…&qty=…` (so an agent that called
  // the single-SKU shorthand on /offer doesn't have to relearn a
  // different shape for the confirm URL).
  let items: LineItem[] | null = null;
  const rawItems = str('items');
  if (rawItems) {
    const parsed = parseItems(rawItems);
    if (typeof parsed === 'string') return { ok: false, reason: `items parameter: ${parsed}.` };
    items = parsed;
  } else if (str('sku') && str('qty')) {
    const qty = Number(str('qty'));
    if (!Number.isInteger(qty) || qty < 1) return { ok: false, reason: 'qty must be a positive integer.' };
    items = [{ sku: str('sku'), qty }];
  } else {
    return { ok: false, reason: 'No items in the URL. Either `items=SKU:qty,SKU:qty` or `sku=…&qty=…` is required.' };
  }

  const required = ['offer_id','delivery_country','total_eur','currency','valid_until_iso','street','postal','city','buyer_name','buyer_email','payment_method'] as const;
  const missing  = required.filter((k) => !str(k));
  if (missing.length) return { ok: false, reason: `Missing fields: ${missing.join(', ')}.` };

  const total_eur = Number(str('total_eur'));
  if (!Number.isFinite(total_eur) || total_eur <= 0) return { ok: false, reason: 'total_eur must be a positive number.' };

  const payment_method = str('payment_method');
  if (!PAYMENT_METHODS.includes(payment_method as PaymentMethod)) {
    return { ok: false, reason: `payment_method must be one of: ${PAYMENT_METHODS.join(', ')}.` };
  }

  const email = str('buyer_email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: `buyer_email does not look like a valid email address: ${email}.` };
  }

  return {
    ok: true,
    data: {
      offer_id:         str('offer_id'),
      items,
      delivery_country: str('delivery_country').toUpperCase(),
      total_eur,
      currency:         str('currency'),
      valid_until_iso:  str('valid_until_iso'),
      street:           str('street'),
      postal:           str('postal'),
      city:             str('city'),
      buyer_name:       str('buyer_name'),
      buyer_email:      email,
      payment_method:   payment_method as PaymentMethod
    }
  };
}
