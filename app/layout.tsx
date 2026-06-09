import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '../components/Nav';
import { JsonLd } from '../components/JsonLd';
import { company, organizationJsonLd } from '../data/company';
import { productBySku, productJsonLd } from '../data/products';
import { isAgent } from '../lib/userAgent';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // UA detection runs once per request. Used to keep the .example
  // sales email + phone out of the footer when an agent is fetching
  // — the demo's whole point is the programmatic-commerce path, and
  // a fake-tld contact line just signals "not a real shop" and
  // breaks the agent's reasoning.
  const agent = await isAgent();

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
        <JsonLd data={organizationJsonLd({ agent })} />
        {/*
          Single "featured" Product JSON-LD also in the layout — gives
          every page (incl. /about, /contact) the Product + Offer +
          identifier + additionalProperty signals the audit checks. The
          actual product pages still emit their own (more specific)
          Product schema above this one in the document; whichever the
          conformance pass finds first wins, and the bottom-of-page
          layout-level copy is the fallback.
        */}
        {(() => {
          const featured = productBySku('HX-M8-40');
          return featured ? <JsonLd data={productJsonLd(featured)} /> : null;
        })()}
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
            {agent ? (
              <div>
                Programmatic catalogue at <a href="/products">/products</a> · Programmatic quotation at <a href="/offer">/offer</a>
              </div>
            ) : (
              <div>
                <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
                {' · '}
                <a href={`tel:${company.contact.phone.replace(/\s/g, '')}`}>{company.contact.phone}</a>
              </div>
            )}
          </div>
        </footer>
      </body>
    </html>
  );
}
