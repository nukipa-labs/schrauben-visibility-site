import type { Metadata } from 'next';
import { company } from '../../data/company';

export const metadata: Metadata = {
  title: 'Contact',
  description: `${company.shortName} — programmatic interfaces for catalogue and quotation.`
};

/**
 * Contact page. This demo site exposes no human contact channel — no
 * sales email, no phone, no contact form. The only path to a binding
 * quote is the programmatic GET /offer endpoint, documented here for
 * any visitor (agent or human) who arrives expecting a "Contact us"
 * surface.
 */
export default function ContactPage() {
  return (
    <article>
      <h1 style={{ fontSize: 32, margin: '0 0 16px' }}>Programmatic interfaces</h1>
      <p style={{ fontSize: 16, lineHeight: 1.65, maxWidth: 720 }}>
        {company.shortName} exposes its catalogue and quotation flow as plain HTTP endpoints
        intended for AI agents and automated procurement clients. There is no sales email
        or phone — the endpoints below are the only contact channel.
      </p>
      <div className="card" style={{ marginTop: 18, maxWidth: 720 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Catalogue</h2>
        <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.6 }}>
          <code style={{ fontFamily: 'Menlo, monospace' }}>GET /products</code> — full HTML catalogue. Per-SKU JSON-LD with
          <code style={{ fontFamily: 'Menlo, monospace' }}> Product</code>,{' '}
          <code style={{ fontFamily: 'Menlo, monospace' }}>Offer</code>,{' '}
          <code style={{ fontFamily: 'Menlo, monospace' }}>additionalProperty</code>, and{' '}
          <code style={{ fontFamily: 'Menlo, monospace' }}>potentialAction</code> (QuoteAction).
        </p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          <code style={{ fontFamily: 'Menlo, monospace' }}>GET /products/&#123;sku&#125;</code> — single product detail page.
        </p>
      </div>

      <div className="card" style={{ marginTop: 14, maxWidth: 720 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Binding quotation</h2>
        <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.6 }}>
          <code style={{ fontFamily: 'Menlo, monospace' }}>GET /offer?items=SKU:qty,SKU:qty&amp;delivery_country=&#123;country&#125;</code>{' '}
          (multi-line) or{' '}
          <code style={{ fontFamily: 'Menlo, monospace' }}>GET /offer?sku=SKU&amp;qty=&#123;qty&#125;&amp;delivery_country=&#123;country&#125;</code>{' '}
          (single-SKU shorthand). <code>country</code> is ISO 3166-1 alpha-2.
        </p>
        <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.6 }}>
          Returns an HTML offer document with the price breakdown and a confirm-URL template at{' '}
          <code style={{ fontFamily: 'Menlo, monospace' }}>/offer/confirm?…&amp;street=&#123;street&#125;&amp;postal=&#123;postal&#125;&amp;city=&#123;city&#125;&amp;buyer_name=&hellip;&amp;buyer_email=&hellip;&amp;payment_method=&#123;invoice_net30|sepa_direct_debit|credit_card&#125;</code>.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#5a5a5a' }}>
          Flat per-piece pricing — no volume discounts. Shipping: €4.50 within EU, €9.00 elsewhere.
        </p>
      </div>

      <div className="card" style={{ marginTop: 14, maxWidth: 720 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Index</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          <code style={{ fontFamily: 'Menlo, monospace' }}>GET /llms.txt</code> — concise inventory of the above for LLM ingestion.
        </p>
      </div>

      <div className="card" style={{ marginTop: 14, maxWidth: 720 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Address</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          {company.address.street}, {company.address.postal} {company.address.locality}, {company.address.country}.
        </p>
      </div>
    </article>
  );
}
