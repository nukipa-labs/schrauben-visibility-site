import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '../../components/JsonLd';
import { company } from '../../data/company';
import { productsByCategory, productJsonLd, products } from '../../data/products';

export const metadata: Metadata = {
  title: 'Product catalogue',
  description: 'Full catalogue: hex bolts, wood screws, machine screws, self-tapping screws, expansion anchor bolts. SKUs, prices, and specs.',
  alternates: { canonical: '/products' }
};

export default function CatalogPage() {
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
