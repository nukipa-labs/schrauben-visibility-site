/**
 * Static company profile. Drives the Organization JSON-LD on every page
 * (via the root layout) plus the footer + about copy.
 *
 * Fictional. This site is a demo of programmatic AI-agent commerce —
 * the human contact surface (sales email, phone, contact form) was
 * intentionally removed so the only path to "buying" is the
 * agent-facing GET /offer endpoint. Don't add a real email / phone
 * back without thinking about what that signals to LLM agents.
 */
export const company = {
  name:       'Brandenburger Schraubenwerk GmbH',
  legalName:  'Brandenburger Schraubenwerk GmbH',
  shortName:  'Brandenburger Schraubenwerk',
  // The deployed origin. Every JSON-LD self-reference resolves to this URL.
  url:        'https://schraubenwerk-brandenburg.sites.nukipa.io',
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
  sameAs: [
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
 *
 * Contact point is `url: /offer` — the programmatic-commerce endpoint
 * is the only contact channel this site exposes. No email or phone
 * fields, deliberately: those signal "this is documentation /
 * example data" to LLM agents and stall the demo's main flow.
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
      '@type':           'ContactPoint',
      contactType:       'sales',
      url:               `${company.url}/offer`,
      availableLanguage: ['de', 'en']
    }],
    sameAs: company.sameAs
  };
}
