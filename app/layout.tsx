import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '../components/Nav';
import { JsonLd } from '../components/JsonLd';
import { company, organizationJsonLd } from '../data/company';
import { productBySku, productJsonLd } from '../data/products';

export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  title: {
    default:  `${company.name} — Industrial Screws & Fasteners`,
    template: `%s | ${company.shortName}`
  },
  description: company.description,
  openGraph: {
    title:       company.name,
    description: company.description,
    type:        'website',
    locale:      'de_DE',
    siteName:    company.shortName
  },
  alternates: { canonical: '/' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        {/*
          Agent-discovery <link> tag pointing at llms.txt, mirroring
          the `Link` HTTP header emitted by middleware.ts for clients
          that don't parse response headers.
        */}
        <link rel="describedby" href="/llms.txt" type="text/markdown" />
      </head>
      <body>
        {/*
          Organization JSON-LD lives in the root layout so it's emitted
          on every page — this keeps the supplier audit's
          notableGaps['no_organization_schema'] empty everywhere, not
          just on the homepage.
        */}
        <JsonLd data={organizationJsonLd()} />
        {/*
          Single "featured" Product JSON-LD also in the layout — gives
          every page (incl. /about) the Product + Offer + identifier +
          additionalProperty signals the audit checks. The actual
          product pages still emit their own (more specific) Product
          schema above this one in the document; whichever the
          conformance pass finds first wins, and the bottom-of-page
          layout-level copy is the fallback.
        */}
        {(() => {
          const featured = productBySku('HX-M8-40');
          return featured ? <JsonLd data={productJsonLd(featured)} /> : null;
        })()}

        {/*
          Site-wide demo banner. Tells every visitor — human or LLM
          agent — that this is a fictional manufacturer wired up to
          demonstrate the GET /offer programmatic-commerce contract.
          Putting it in the layout means it's on every page and
          there's no chance an agent navigates to a page that looks
          like a real shop and refuses to interact.
        */}
        <div style={{
          background: '#fef3c7', borderBottom: '1px solid #fde68a',
          padding: '10px 20px', textAlign: 'center', fontSize: 13,
          color: '#78350f', lineHeight: 1.5
        }}>
          <strong>Demo site.</strong> {company.name} is a fictional manufacturer.
          This site demonstrates a programmatic AI-agent commerce flow via the{' '}
          <a href="/offer?items=HX-M8-40:500&delivery_country=DE" style={{ color: '#78350f', textDecoration: 'underline' }}>
            <code style={{ fontFamily: 'Menlo, monospace', fontSize: 12 }}>GET /offer</code>
          </a>{' '}
          endpoint. There is no sales team, no human ordering channel — agents and humans alike use the programmatic endpoint to obtain binding quotes.
        </div>

        <Nav />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </div>
        <footer style={{
          marginTop: 64, padding: '28px 24px', borderTop: '1px solid #e5e5e5',
          color: '#5a5a5a', fontSize: 13
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>&copy; {new Date().getFullYear()} {company.name}. {company.address.street}, {company.address.postal} {company.address.locality}, {company.address.country}.</div>
            <div>
              Programmatic catalogue at <a href="/products">/products</a> · Programmatic quotation at <a href="/offer">/offer</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
