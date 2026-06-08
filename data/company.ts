/**
 * Static company profile. Drives the Organization JSON-LD on every page
 * (via the root layout) plus the footer + about copy. Fictional.
 */
export const company = {
  name:       'Brandenburger Schraubenwerk GmbH',
  legalName:  'Brandenburger Schraubenwerk GmbH',
  shortName:  'Brandenburger Schraubenwerk',
  // The deployed origin. Every JSON-LD self-reference resolves to this
  // URL; the offer's accept_url is built off it (with a per-request
  // override in app/api/mcp/route.ts so it tracks whichever host the
  // MCP call came in on — works for localhost dev + the public host).
  url:        'https://schrauben-visibility.sites.nukipa.io',
  logo:       '/logo.svg',
  tagline:    'Präzision in jedem Gewinde.',
  founded:    1962,
  description:
    'Brandenburger Schraubenwerk GmbH is a family-owned screw and fastener ' +
    'manufacturer based in Brandenburg an der Havel. Since 1962 we have ' +
    'produced industrial-grade hex bolts, wood screws, machine screws, ' +
    'self-tapping screws and anchor bolts for DACH industrial buyers.',
  address: {
    street:    'Industriestraße 14',
    locality:  'Brandenburg an der Havel',
    region:    'Brandenburg',
    postal:    '14770',
    country:   'DE'
  },
  contact: {
    email: 'vertrieb@brandenburger-schraubenwerk.example',
    phone: '+49 3381 555 100'
  },
  sameAs: [
    'https://www.linkedin.com/company/brandenburger-schraubenwerk-example',
    'https://www.xing.com/companies/brandenburgerschraubenwerk',
    'https://www.wlw.de/de/firma/brandenburger-schraubenwerk'
  ]
};

/**
 * Organization JSON-LD block reused on every page (root layout). The
 * supplier audit's conformance pass looks for Organization on the home
 * page for entity-authority signal; emitting it everywhere also makes
 * `notableGaps.no_organization_schema` empty on every page → no spurious
 * recommendation.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    name:        company.name,
    legalName:   company.legalName,
    url:         company.url,
    logo:        `${company.url}${company.logo}`,
    description: company.description,
    foundingDate: String(company.founded),
    address: {
      '@type':         'PostalAddress',
      streetAddress:   company.address.street,
      addressLocality: company.address.locality,
      addressRegion:   company.address.region,
      postalCode:      company.address.postal,
      addressCountry:  company.address.country
    },
    contactPoint: [{
      '@type':       'ContactPoint',
      contactType:   'sales',
      email:         company.contact.email,
      telephone:     company.contact.phone,
      availableLanguage: ['de', 'en']
    }],
    sameAs: company.sameAs
  };
}
