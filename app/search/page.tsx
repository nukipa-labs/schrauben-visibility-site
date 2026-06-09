import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '../../components/JsonLd';
import { company } from '../../data/company';
import { productJsonLd, catalogueSize } from '../../data/products';
import type { Product } from '../../data/products';
import { searchCatalogue, FACETS, SEARCH_PARAMS, type SearchInput } from '../../lib/search';

export const metadata: Metadata = {
  title: 'Search the catalogue',
  description: `Search ${catalogueSize}+ fastener SKUs by thread, length, head, drive, material, grade, and price. GET /search with query params.`,
  alternates: { canonical: '/search' }
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function flatten(sp: Record<string, string | string[] | undefined>): SearchInput {
  const out: SearchInput = {};
  for (const [k, v] of Object.entries(sp)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

const mono = { fontFamily: 'Menlo, monospace', fontSize: 13 } as const;

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = flatten(await searchParams);
  const { results, total, limit, applied, hasQuery } = searchCatalogue(raw);

  return (
    <>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        <Link href="/">Home</Link> · <Link href="/products">Products</Link> · Search
      </p>
      <h1 style={{ fontSize: 30, margin: '6px 0 8px' }}>Search the catalogue</h1>
      <p className="muted" style={{ margin: '0 0 20px', fontSize: 15, maxWidth: 720 }}>
        The catalogue holds <strong>{catalogueSize.toLocaleString()} SKUs</strong> — too many to list. Search by any
        combination of the parameters below. This page is a plain <code style={mono}>GET /search</code> with query
        params, so an agent can fetch it directly and read the results.
      </p>

      <AgentPanel />
      <SearchForm raw={raw} />

      {hasQuery ? (
        <Results raw={raw} results={results} total={total} limit={limit} applied={applied} />
      ) : (
        <SearchHelp />
      )}
    </>
  );
}

// ── results ────────────────────────────────────────────────────────────
function Results({
  raw, results, total, limit, applied
}: {
  raw: SearchInput;
  results: Product[];
  total: number;
  limit: number;
  applied: Array<{ name: string; value: string }>;
}) {
  // ItemList JSON-LD over the matches — structured-data agents (and the
  // supplier audit's conformance pass) read the Product+Offer+identifier
  // nodes directly without HTML extraction.
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:        'Catalogue search results',
    numberOfItems: results.length,
    itemListElement: results.map((p, i) => ({
      '@type':  'ListItem',
      position: i + 1,
      item:     productJsonLd(p)
    }))
  };

  const spec = (p: Product, n: string) => p.specs.find((s) => s.name === n)?.value || '—';

  return (
    <section style={{ marginTop: 28 }}>
      <JsonLd data={itemListLd} />
      <JsonLd data={results.map(productJsonLd)} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>
          {total.toLocaleString()} match{total === 1 ? '' : 'es'}
          {total > results.length ? ` — showing the ${results.length} cheapest` : ''}
        </h2>
        <span className="muted" style={{ fontSize: 13 }}>
          {applied.map((a) => `${a.name}=${a.value}`).join('  ·  ')}
        </span>
      </div>

      {total > results.length && (
        <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
          Narrow the result set with more filters (e.g. <code style={mono}>&amp;grade=8.8</code>,{' '}
          <code style={mono}>&amp;length=30-60</code>, <code style={mono}>&amp;finish=zinc</code>) or raise{' '}
          <code style={mono}>&amp;limit=</code> (max 100).
        </p>
      )}

      {results.length === 0 ? (
        <p style={{ fontSize: 15 }}>
          No products match. Loosen a filter, or open the <Link href="/search">search help</Link> to see the valid
          values for each parameter.
        </p>
      ) : (
        <table className="spec-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Thread</th>
              <th>Length</th>
              <th>Head</th>
              <th>Drive</th>
              <th>Material</th>
              <th>Grade</th>
              <th>Price / pack</th>
              <th>Quote</th>
            </tr>
          </thead>
          <tbody>
            {results.map((p) => (
              <tr key={p.sku}>
                <td style={mono}><Link href={`/products/${p.sku}`}>{p.sku}</Link></td>
                <td>{p.name}</td>
                <td>{spec(p, 'thread_size')}</td>
                <td>{spec(p, 'length')}</td>
                <td>{spec(p, 'head_type')}</td>
                <td>{spec(p, 'drive_type')}</td>
                <td>{spec(p, 'material')}</td>
                <td>{spec(p, 'tensile_class')}</td>
                <td><strong>€ {p.priceEur.toFixed(2)}</strong> / {p.packSize}</td>
                <td>
                  <a href={`/offer?sku=${p.sku}&qty=${p.packSize}&delivery_country=DE`} style={{ color: '#0054C9', whiteSpace: 'nowrap' }}>
                    Quote →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
        To order any row: GET <code style={mono}>/offer?sku=&#123;SKU&#125;&amp;qty=&#123;qty&#125;&amp;delivery_country=&#123;country&#125;</code>{' '}
        (or batch several with <code style={mono}>/offer?items=SKU:qty,SKU:qty&amp;delivery_country=&#123;country&#125;</code>).
        The <strong>Quote →</strong> links above use a sample quantity of one pack to Germany.
      </p>
    </section>
  );
}

// ── search help (no query) ─────────────────────────────────────────────
function SearchHelp() {
  const examples = [
    { href: '/search?thread=M8&grade=8.8&category=hex', label: 'M8 hex bolts, grade 8.8' },
    { href: '/search?q=stainless+countersunk+wood&length=40-60', label: 'Stainless countersunk wood screws, 40–60 mm' },
    { href: '/search?category=anchor&material=A4', label: 'A4 stainless anchor bolts' },
    { href: '/search?thread=M6&head=socket+cap&grade=12.9', label: 'M6 socket cap screws, grade 12.9' },
    { href: '/search?drive=torx&max_price=20', label: 'Torx-drive screws under €20/pack' }
  ];

  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 20, margin: '0 0 10px' }}>Search parameters</h2>
      <table className="spec-table">
        <thead><tr><th>Parameter</th><th>Meaning</th></tr></thead>
        <tbody>
          {SEARCH_PARAMS.map((p) => (
            <tr key={p.name}>
              <td style={mono}>{p.name}</td>
              <td>{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 20, margin: '24px 0 10px' }}>Valid values</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Facet title="category" values={FACETS.categories} />
        <Facet title="thread"   values={FACETS.threads} />
        <Facet title="head"     values={FACETS.heads} />
        <Facet title="drive"    values={FACETS.drives} />
        <Facet title="material" values={FACETS.materials} />
        <Facet title="grade"    values={FACETS.grades} />
        <Facet title="finish"   values={FACETS.finishes} />
      </div>

      <h2 style={{ fontSize: 20, margin: '24px 0 10px' }}>Example searches</h2>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
        {examples.map((e) => (
          <li key={e.href}>
            <a href={e.href} style={{ color: '#0054C9' }}>{e.label}</a>{' '}
            <code style={{ ...mono, color: '#5a5a5a' }}>{e.href}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Facet({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 6, ...mono }}>{title}</div>
      <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
        {values.join(' · ')}
      </div>
    </div>
  );
}

// ── agent panel ────────────────────────────────────────────────────────
function AgentPanel() {
  return (
    <aside
      role="note"
      aria-label="Programmatic search and quotation for AI agents"
      style={{
        marginBottom: 22, background: '#f0f7ff', border: '1px solid #c7d8f0',
        borderRadius: 10, padding: '14px 18px', fontSize: 14, lineHeight: 1.6
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: 6 }}>
        For AI agents — search then order
      </div>
      <p style={{ margin: '0 0 8px' }}>
        <strong>1. Find a SKU.</strong> GET{' '}
        <code style={{ ...mono, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
          /search?thread=&#123;thread&#125;&amp;length=&#123;mm&#125;&amp;grade=&#123;grade&#125;&amp;material=&#123;material&#125;&amp;category=&#123;family&#125;
        </code>{' '}
        — all params optional and ANDed, plus free-text <code style={mono}>q=</code>. The response lists matching SKUs
        with their specs and price.
      </p>
      <p style={{ margin: 0 }}>
        <strong>2. Order it.</strong> Take a SKU from the results and GET{' '}
        <code style={{ ...mono, background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #d6e2f1' }}>
          /offer?sku=&#123;SKU&#125;&amp;qty=&#123;qty&#125;&amp;delivery_country=&#123;country&#125;
        </code>{' '}
        (or batch with <code style={mono}>items=SKU:qty,SKU:qty</code>). The offer response carries the price
        breakdown and a confirm-URL the buyer clicks to pay.
      </p>
    </aside>
  );
}

// ── human search form ──────────────────────────────────────────────────
function SearchForm({ raw }: { raw: SearchInput }) {
  const val = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const sel = (k: string, options: string[]) => (
    <select name={k} defaultValue={val(k)} style={fieldStyle}>
      <option value="">any</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <form action="/search" method="get" style={{
      background: '#fafafa', border: '1px solid #ececec', borderRadius: 10,
      padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, alignItems: 'end'
    }}>
      <Field label="Free text (q)"><input name="q" defaultValue={val('q')} placeholder="e.g. stainless hex bolt" style={fieldStyle} /></Field>
      <Field label="Category">{sel('category', FACETS.categories)}</Field>
      <Field label="Thread / gauge"><input name="thread" defaultValue={val('thread')} placeholder="M8 or 4.0" style={fieldStyle} /></Field>
      <Field label="Length (mm)"><input name="length" defaultValue={val('length')} placeholder="40 or 30-60" style={fieldStyle} /></Field>
      <Field label="Head">{sel('head', FACETS.heads)}</Field>
      <Field label="Drive">{sel('drive', FACETS.drives)}</Field>
      <Field label="Material">{sel('material', FACETS.materials)}</Field>
      <Field label="Grade">{sel('grade', FACETS.grades)}</Field>
      <Field label="Max € / pack"><input name="max_price" defaultValue={val('max_price')} placeholder="20" style={fieldStyle} /></Field>
      <button type="submit" style={{
        padding: '9px 18px', borderRadius: 8, border: 'none', background: '#0054C9',
        color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', height: 38
      }}>Search</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#5a5a5a' }}>
      {label}
      {children}
    </label>
  );
}

const fieldStyle = {
  padding: '8px 10px', border: '1px solid #d6d3d1', borderRadius: 6, fontSize: 14, width: '100%', boxSizing: 'border-box' as const, background: '#fff'
};
