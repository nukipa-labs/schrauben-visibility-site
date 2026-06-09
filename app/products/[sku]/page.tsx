import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { JsonLd } from '../../../components/JsonLd';
import { company } from '../../../data/company';
import { sampleProducts, productBySku, productJsonLd } from '../../../data/products';

interface PageProps { params: Promise<{ sku: string }> }

// Only the curated SKUs are pre-rendered at build time — pre-building
// all ~1,600 generated detail pages would bloat the build for pages an
// agent reaches via /search anyway. The long tail renders on demand
// (Next's default dynamicParams = true), still fully server-rendered
// with the same JSON-LD + specs.
export function generateStaticParams() {
  return sampleProducts.map((p) => ({ sku: p.sku }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sku } = await params;
  const p = productBySku(sku);
  if (!p) return { title: 'Product not found' };
  return {
    title: `${p.name} — ${p.sku}`,
    description: p.description,
    alternates: { canonical: `/products/${p.sku}` },
    openGraph: {
      title:       p.name,
      description: p.description,
      type:        'website'
    }
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { sku } = await params;
  const product = productBySku(sku);
  if (!product) notFound();

  const ld = {
    ...productJsonLd(product),
    // Add a breadcrumb so the audit sees this page sits inside a
    // navigable structure — useful narrative for the agent's reasoning.
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',                item: company.url },
        { '@type': 'ListItem', position: 2, name: 'Products',            item: `${company.url}/products` },
        { '@type': 'ListItem', position: 3, name: product.category.label,item: `${company.url}/products#${product.category.key}` },
        { '@type': 'ListItem', position: 4, name: product.sku,           item: `${company.url}/products/${product.sku}` }
      ]
    }
  };

  return (
    <>
      <JsonLd data={ld} />

      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        <Link href="/">Home</Link> · <Link href="/products">Products</Link> · <Link href={`/products#${product.category.key}`}>{product.category.label}</Link> · {product.sku}
      </p>

      {/*
        Programmatic-commerce contract — always shown. Placed at the
        TOP of the page so HTML→text extractors (Claude web_fetch,
        ChatGPT browsing) see it before they hit length limits or
        summarisation. The same contract is also published as
        Product.potentialAction (@type: QuoteAction) in the JSON-LD
        below, but extractors commonly strip <script> tags so the
        visible text is the load-bearing channel.
      */}
      <aside
        role="note"
        aria-label="Programmatic quotation endpoint for AI agents"
        style={{
          marginTop: 16,
          background: '#f0f7ff', border: '1px solid #c7d8f0',
          borderRadius: 10, padding: '14px 16px', fontSize: 14, lineHeight: 1.55
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: 6 }}>
          For AI agents — programmatic quotation
        </div>
        <p style={{ margin: '0 0 8px' }}>
          To obtain a binding quotation for this product, GET{' '}
          <code style={{ fontFamily: 'Menlo, monospace', fontSize: 13, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
            /offer?sku={product.sku}&amp;qty=&#123;qty&#125;&amp;delivery_country=&#123;country&#125;
          </code>{' '}
          (single line) or{' '}
          <code style={{ fontFamily: 'Menlo, monospace', fontSize: 13, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
            /offer?items=SKU:qty,SKU:qty&amp;delivery_country=&#123;country&#125;
          </code>{' '}
          for multi-line baskets. <code>country</code> is ISO 3166-1 alpha-2 (e.g. <code>DE</code>, <code>AT</code>, <code>CH</code>).
        </p>
        <p style={{ margin: '0 0 8px' }}>
          The response is HTML — extract the price breakdown and present it to the buyer. It also embeds a <strong>confirm-URL template</strong> at <code>/offer/confirm?…&amp;street=&#123;street&#125;&amp;postal=&#123;postal&#125;&amp;city=&#123;city&#125;&amp;buyer_name=&hellip;&amp;buyer_email=&hellip;&amp;payment_method=&hellip;</code>. Collect those six fields from the buyer, URL-encode each value, assemble the URL, and present it as a clickable link — the buyer sees a summary and pays.
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#3b5984' }}>
          The same contract is exposed as <code>potentialAction.QuoteAction</code> in this page&#39;s Product JSON-LD. Flat per-piece pricing — no volume discounts. Shipping: €4.50 within EU, €9.00 elsewhere.
        </p>
      </aside>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginTop: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: '0 0 10px' }}>{product.name}</h1>
          <p className="muted" style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.55 }}>{product.description}</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#001D21' }}>€ {product.priceEur.toFixed(2)}</span>
            <span className="muted">per pack of {product.packSize}</span>
            <span className="tag">In stock</span>
          </div>
        </div>
        <div className="card" style={{ flex: '0 0 280px', minWidth: 280 }}>
          <div style={{ fontSize: 12, color: '#5a5a5a', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Identifiers</div>
          <div style={{ marginTop: 6, fontSize: 14 }}>
            <div><strong>SKU:</strong> <span style={{ fontFamily: 'Menlo, monospace' }}>{product.sku}</span></div>
            <div><strong>MPN:</strong> <span style={{ fontFamily: 'Menlo, monospace' }}>{product.mpn}</span></div>
            <div><strong>Brand:</strong> {company.shortName}</div>
            <div><strong>Category:</strong> {product.category.label}</div>
            <div style={{ marginTop: 8 }}><strong>Price:</strong> € {product.priceEur.toFixed(2)} EUR per pack of {product.packSize}</div>
            <div><strong>Availability:</strong> {product.availability}</div>
          </div>
        </div>
      </header>

      {/* Technical specifications — rendered as a real <table> so the
          audit's structuredBlocks.tables counter increments, plus the
          additionalProperty in the JSON-LD above. Either by itself
          satisfies the structured-specs check; together they make the
          page robust to either checker behaviour. */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>Technical specifications</h2>
        <table className="spec-table">
          <tbody>
            {product.specs.map((s) => (
              <tr key={s.name}>
                <th style={{ width: '40%' }}>{labelize(s.name)}</th>
                <td>{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/*
        Sample quote. One concrete clickable example so an agent can
        verify the endpoint works before constructing its own URL.
        Previous version had four preset quantity buttons (50/250/
        1000/5000) — the agent picked one at random ("closest preset
        to the user's requested 500") and ended up off by 10×.
        Single sample with a clear "or construct your own" hint is
        less misleading.
      */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>Sample quote</h2>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
          One concrete example for delivery to Germany. To request your own quantity, substitute it into the <code>/offer</code> URL template shown in the panel above.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a href={`/offer?sku=${product.sku}&qty=100&delivery_country=DE`}
             style={{
               display: 'inline-flex', alignItems: 'baseline', gap: 8,
               padding: '10px 16px', borderRadius: 8,
               background: '#fff', border: '1px solid #0054C9', color: '#0054C9',
               textDecoration: 'none', fontSize: 14, fontWeight: 600
             }}>
            <span>Sample: 100 pieces → DE</span>
          </a>
        </div>
      </section>

      <p className="muted" style={{ fontSize: 13 }}>
        <Link href="/products">← Back to the catalogue</Link>
      </p>
    </>
  );
}

function labelize(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
