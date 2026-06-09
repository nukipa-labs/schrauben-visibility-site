import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '../../components/JsonLd';
import { company } from '../../data/company';
import { categoryStats, sampleProducts, productJsonLd, catalogueSize } from '../../data/products';

export const metadata: Metadata = {
  title: 'Product catalogue',
  description: `${catalogueSize}+ fastener SKUs — hex bolts, machine screws, wood screws, self-tapping, anchors. Search by thread, length, grade, and material.`,
  alternates: { canonical: '/products' }
};

const mono = { fontFamily: 'Menlo, monospace', fontSize: 13 } as const;

export default function CatalogPage() {
  const stats = categoryStats();

  // CollectionPage JSON-LD reports the true catalogue size; the embedded
  // Product nodes are a curated sample (the full ~1,600 would be a
  // multi-MB <script>). The conformance pass only needs SOME products
  // with the four axes present.
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type':    'CollectionPage',
    name:        `${company.shortName} — Catalogue`,
    description: `${catalogueSize} SKUs across ${stats.length} product families.`,
    url:         `${company.url}/products`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: catalogueSize,
      itemListElement: sampleProducts.map((p, i) => ({
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
      <JsonLd data={sampleProducts.map(productJsonLd)} />

      <header style={{ marginBottom: 20 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          <Link href="/">Home</Link> · Products
        </p>
        <h1 style={{ fontSize: 32, margin: '6px 0 8px' }}>Product catalogue</h1>
        <p className="muted" style={{ margin: 0, fontSize: 15, maxWidth: 720 }}>
          <strong>{catalogueSize.toLocaleString()} SKUs</strong> across {stats.length} product families — far too many to
          list on one page. Use search to find the exact part by thread, length, grade, material, and finish.
        </p>
      </header>

      {/*
        Search-first: the catalogue is large by design, so the primary
        affordance — for humans and agents alike — is search, not
        browsing. The form is a real GET to /search (works for
        form-following agents); the agent panel documents the same
        endpoint as query params.
      */}
      <form action="/search" method="get" style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        background: '#F0EBEB', borderRadius: 14, padding: 12, marginBottom: 18
      }}>
        <input
          name="q" type="text" placeholder="Search 1,600+ SKUs — e.g. M8 hex bolt stainless"
          style={{ flex: '1 1 260px', minWidth: 0, padding: '12px 16px', borderRadius: 999, border: '1px solid #e2ddd9', background: '#fff', color: '#1a1a1a', fontSize: 15, outline: 'none' }}
        />
        <button type="submit" style={{
          padding: '12px 24px', borderRadius: 999, border: 'none', background: '#0054C9',
          color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
        }}>Search</button>
        <Link href="/search" style={{ color: '#0054C9', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          Advanced search →
        </Link>
      </form>

      <aside
        role="note"
        aria-label="Programmatic search and quotation for AI agents"
        style={{
          marginBottom: 28, background: '#f0f7ff', border: '1px solid #c7d8f0',
          borderRadius: 10, padding: '14px 18px', fontSize: 14, lineHeight: 1.6
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: 6 }}>
          For AI agents — search then order
        </div>
        <p style={{ margin: '0 0 8px' }}>
          The catalogue is too large to enumerate. To find a part, GET{' '}
          <code style={{ ...mono, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
            /search?thread=&#123;thread&#125;&amp;length=&#123;mm&#125;&amp;grade=&#123;grade&#125;&amp;material=&#123;material&#125;&amp;category=&#123;family&#125;
          </code>{' '}
          (all optional and ANDed; free-text <code style={mono}>q=</code> also supported). See{' '}
          <Link href="/search">/search</Link> for the full parameter list and valid values.
        </p>
        <p style={{ margin: 0 }}>
          To order a SKU from the results, GET{' '}
          <code style={{ ...mono, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
            /offer?sku=&#123;SKU&#125;&amp;qty=&#123;qty&#125;&amp;delivery_country=&#123;country&#125;
          </code>{' '}
          (or batch with <code style={mono}>items=SKU:qty,SKU:qty</code>). The offer response carries the price
          breakdown and a confirm-URL the buyer clicks to pay.
        </p>
      </aside>

      {/* Families — counts + a link into a pre-filtered search, not a
          full SKU dump. */}
      <h2 style={{ fontSize: 20, margin: '0 0 14px' }}>Product families</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
        {stats.map(({ category, count, sample }) => (
          <div key={category.key} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>{category.label}</div>
              <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{count.toLocaleString()} SKUs</span>
            </div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.55, margin: '6px 0 10px' }}>{category.blurb}</div>
            <div style={{ fontSize: 12, color: '#5a5a5a', marginBottom: 10 }}>
              e.g. {sample.map((p) => p.sku).join(', ')}…
            </div>
            <a href={`/search?category=${encodeURIComponent(category.key)}`} style={{ color: '#0054C9', fontSize: 13, fontWeight: 600 }}>
              Search this family →
            </a>
          </div>
        ))}
      </div>

      {/* A small visible sample so the page still carries product text +
          a spec table (structuredBlocks for the audit), without dumping
          the whole catalogue. */}
      <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>Sample products</h2>
      <table className="spec-table">
        <thead>
          <tr>
            <th>SKU</th><th>MPN</th><th>Product</th><th>Thread</th><th>Length</th><th>Material</th><th>Price (EUR)</th><th>Pack</th><th></th>
          </tr>
        </thead>
        <tbody>
          {sampleProducts.map((p) => (
            <tr key={p.sku}>
              <td style={mono}>{p.sku}</td>
              <td style={mono} className="muted">{p.mpn}</td>
              <td><Link href={`/products/${p.sku}`}>{p.name}</Link></td>
              <td>{p.specs.find((s) => s.name === 'thread_size')?.value || '—'}</td>
              <td>{p.specs.find((s) => s.name === 'length')?.value || '—'}</td>
              <td>{p.specs.find((s) => s.name === 'material')?.value || '—'}</td>
              <td><strong>€ {p.priceEur.toFixed(2)}</strong></td>
              <td>{p.packSize}</td>
              <td><Link href={`/products/${p.sku}`}>Details →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
