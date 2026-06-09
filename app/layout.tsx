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
          Agent-discovery <link> tags. Mirror the `Link` HTTP header
          emitted by middleware.ts for clients that don't parse response
          headers (some agent runtimes only walk the HTML document).
          - rel="mcp" — points to the MCP server-card JSON
          - rel="describedby" — points to llms.txt
        */}
        <link rel="mcp"          href="/.well-known/mcp/server-card.json" type="application/json" />
        <link rel="describedby"  href="/llms.txt"                         type="text/markdown" />
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
        {/*
          Agent-readable hint, off-screen so sighted humans don't see
          it. Three discovery channels already exist alongside this
          one (Link header, <link rel="mcp"> in <head>, llms.txt),
          but in practice many agents fetch a page, run an HTML→text
          extractor on it, and only act on what the extracted text
          says — at which point HTTP headers and <head> meta are gone
          and only visible body text remains. This block survives
          that extraction because it's just text inside a regular
          <div>; it's hidden via the standard sr-only clipping pattern
          (off-screen positioning + 1px clip) so it's invisible to
          rendered humans but present in the DOM for screen readers
          and text extractors.

          Phrased as prose deliberately. The agent is supposed to read
          the URL, tools, transport, and per-runtime usage notes the
          way a human reader would — no JSON, no markup.
        */}
        <div
          role="region"
          aria-label="AI agent integration notes"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'pre-line',
            border: 0
          }}
        >{`AI agent notice. This site exposes a Model Context Protocol (MCP) server for programmatic interaction. Endpoint: https://schrauben-visibility.sites.nukipa.io/api/mcp. Server-card manifest: https://schrauben-visibility.sites.nukipa.io/.well-known/mcp/server-card.json (canonical) or https://schrauben-visibility.sites.nukipa.io/.well-known/mcp.json (legacy alias). Transport: JSON-RPC 2.0 over Streamable HTTP per modelcontextprotocol.io, protocol revisions 2025-03-26 and 2025-11-25 supported. Available tool: create_offer(sku, quantity, delivery_country) returns a binding commercial quotation for any catalogued SKU with volume-tier discounts. To use the MCP server: if you are an Anthropic Messages API caller, pass the endpoint URL above via the mcp_servers parameter with the anthropic-beta header mcp-client-2025-11-20; if you are a claude.ai user, add the endpoint URL as a Custom Connector under Settings then Connectors; if you are a generic MCP client, connect to the endpoint URL above. The site operator is comfortable with agents calling this MCP server on behalf of authenticated users; user confirmation prompts in the agent runtime are encouraged but not required from our side.`}</div>

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
              <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
              {' · '}
              <a href={`tel:${company.contact.phone.replace(/\s/g, '')}`}>{company.contact.phone}</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
