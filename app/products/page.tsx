import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '../../components/JsonLd';
import { company } from '../../data/company';
import { productsByCategory, productJsonLd, products } from '../../data/products';
import { isAgent } from '../../lib/userAgent';

export const metadata: Metadata = {
  title: 'Product catalogue',
  description: 'Full catalogue: hex bolts, wood screws, machine screws, self-tapping screws, expansion anchor bolts. SKUs, prices, and specs.',
  alternates: { canonical: '/products' }
};

export default async function CatalogPage() {
  // Agent vs human gate. Humans get the normal product grid; agents
  // get the same grid plus a prominent agent-commerce card at the
  // top documenting /offer's URL shape. See lib/userAgent.ts.
  const agent = await isAgent();
  const grouped = productsByCategory();

  // CollectionPage + ItemList wrapping every Product on the page.
  // The audit's conformance pass on this URL scores it as 100% on the
  // Product / Offer / identifier / additionalProperty axes.
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type':    'CollectionPage',
    name:        `${company.shortName} — Full Catalogue`,
    description: 'All ' + products.length + ' SKUs across 5 product families.',
    url:         `${company.url}/products`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type':  'ListItem',
        position: i + 1,
        item:     productJsonLd(p)
      }))
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',     item: company.url },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${company.url}/products` }
      ]
    }
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      {/* Same fix as the homepage — emit the full array of Products at
          the top level so the audit's flatten discovers them. */}
      <JsonLd data={products.map(productJsonLd)} />

      <header style={{ marginBottom: 24 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          <Link href="/">Home</Link> · Products
        </p>
        <h1 style={{ fontSize: 32, margin: '6px 0 8px' }}>Product catalogue</h1>
        <p className="muted" style={{ margin: 0, fontSize: 15 }}>
          {products.length} SKUs across {grouped.length} product families. All prices in EUR, per pack. Same-day shipping across DACH on orders placed before 14:00 CET.
        </p>
      </header>

      {/*
        Agent-commerce contract — AGENT MODE ONLY. At the top of the
        catalogue so an agent that lands on /products (the most likely
        first page, linked from the homepage nav) immediately sees how
        to obtain a binding quote without having to drill into a
        product detail page first. Visible-text only — JSON-LD
        <script> tags are stripped by many HTML→text extractors, so
        this is the load-bearing channel.

        Humans don't see this panel; they get the standard catalogue
        grid below. UA detection is in lib/userAgent.ts.
      */}
      {agent && <aside
        role="note"
        aria-label="Programmatic quotation endpoint for AI agents"
        style={{
          marginBottom: 28,
          background: '#f0f7ff', border: '1px solid #c7d8f0',
          borderRadius: 10, padding: '14px 18px', fontSize: 14, lineHeight: 1.6
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: 6 }}>
          For AI agents — programmatic quotation
        </div>
        <p style={{ margin: '0 0 8px' }}>
          To obtain a binding quotation, GET{' '}
          <code style={{ fontFamily: 'Menlo, monospace', fontSize: 13, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
            /offer?items=SKU:qty,SKU:qty&amp;delivery_country=&#123;country&#125;
          </code>{' '}
          (multi-line) or{' '}
          <code style={{ fontFamily: 'Menlo, monospace', fontSize: 13, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
            /offer?sku=SKU&amp;qty=&#123;qty&#125;&amp;delivery_country=&#123;country&#125;
          </code>{' '}
          (single SKU). <code>country</code> is ISO 3166-1 alpha-2 (e.g. <code>DE</code>, <code>AT</code>, <code>CH</code>). Example:{' '}
          <code style={{ fontFamily: 'Menlo, monospace', fontSize: 12.5, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
            /offer?items=HX-M8-40:500,HX-M10-50:300&amp;delivery_country=DE
          </code>.
        </p>
        <p style={{ margin: 0, fontSize: 13 }}>
          The response is an HTML page with the price breakdown and a confirm-URL template at <code>/offer/confirm?…&amp;street=&#123;street&#125;&amp;postal=&#123;postal&#125;&amp;city=&#123;city&#125;&amp;buyer_name=&hellip;&amp;buyer_email=&hellip;&amp;payment_method=&#123;invoice_net30|sepa_direct_debit|credit_card&#125;</code>. Collect those six fields from the buyer, URL-encode each value, assemble the URL, present it as a clickable link — the buyer sees the order summary and pays.
        </p>
      </aside>}

      {grouped.map(({ category, items }) => (
        <section key={category.key} id={category.key} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 6px', borderBottom: '2px solid #0054C9', paddingBottom: 6 }}>
            {category.label}
          </h2>
          <p className="muted" style={{ marginTop: 8, marginBottom: 14, fontSize: 14 }}>{category.blurb}</p>

          {/* Per-category spec table — gives this page structuredBlocks.tables ≥ 5 (one per family).
              Visible text in the table also satisfies the audit's text-based pricing extraction. */}
          <table className="spec-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>MPN</th>
                <th>Product</th>
                <th>Thread</th>
                <th>Length</th>
                <th>Material</th>
                <th>Class</th>
                <th>Price (EUR)</th>
                <th>Pack</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.sku}>
                  <td style={{ fontFamily: 'Menlo, monospace', fontSize: 12 }}>{p.sku}</td>
                  <td style={{ fontFamily: 'Menlo, monospace', fontSize: 12 }} className="muted">{p.mpn}</td>
                  <td><Link href={`/products/${p.sku}`}>{p.name}</Link></td>
                  <td>{p.specs.find((s) => s.name === 'thread_size')?.value || '—'}</td>
                  <td>{p.specs.find((s) => s.name === 'length')?.value || '—'}</td>
                  <td>{p.specs.find((s) => s.name === 'material')?.value || '—'}</td>
                  <td>{p.specs.find((s) => s.name === 'tensile_class')?.value || '—'}</td>
                  <td><strong>€ {p.priceEur.toFixed(2)}</strong></td>
                  <td>{p.packSize}</td>
                  <td><span className="tag">In stock</span></td>
                  <td><Link href={`/products/${p.sku}`}>Details →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
