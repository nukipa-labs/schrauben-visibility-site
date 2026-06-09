import { company } from './company';
import { categories, generatedProducts } from './catalogue';
import type { Product, ProductCategory, Spec } from './catalogue';

/**
 * The product catalogue = a small hand-curated set (kept stable because
 * the homepage, layout featured-product, and sample links reference
 * these exact SKUs) + the large generated catalogue (`data/catalogue.ts`)
 * that makes browsing impractical and forces agents through /search.
 *
 * Shared types + `categories` live in data/catalogue.ts and are
 * re-exported here so every existing `from '../data/products'` import
 * keeps working unchanged.
 */

export { categories };
export type { Product, ProductCategory, Spec };

// Hand-curated cross-section — one or two per family, with the original
// short SKUs the rest of the site links to by name.
const curatedProducts: Product[] = [
  {
    sku: 'HX-M6-30', mpn: 'BSW-933-M6-30-88-ZN',
    name: 'Hex bolt M6 × 30 mm, grade 8.8, zinc plated',
    category: categories.hex_bolts,
    description: 'Fully-threaded hex head bolt, thread size M6, length 30 mm, steel grade 8.8 with zinc plating. Compliant with DIN 933 / ISO 4017. Sold per pack of 200.',
    shortDesc: 'M6 × 30 mm, DIN 933, 8.8, zinc plated, pack of 200.',
    priceEur: 24.50, packSize: 200, availability: 'InStock',
    image: '/images/hex-bolt.svg',
    specs: [
      { name: 'thread_size',      value: 'M6' },
      { name: 'length',           value: '30 mm' },
      { name: 'head_type',        value: 'Hex' },
      { name: 'drive_type',       value: 'External hex SW10' },
      { name: 'tensile_class',    value: '8.8' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated (8 µm)' },
      { name: 'weight_per_piece', value: '7.1 g' }
    ]
  },
  {
    sku: 'HX-M8-40', mpn: 'BSW-933-M8-40-88-ZN',
    name: 'Hex bolt M8 × 40 mm, grade 8.8, zinc plated',
    category: categories.hex_bolts,
    description: 'Fully-threaded hex head bolt, M8 × 40, DIN 933 / ISO 4017, steel 8.8, zinc plated. Pack of 100.',
    shortDesc: 'M8 × 40 mm, DIN 933, 8.8, zinc plated, pack of 100.',
    priceEur: 18.90, packSize: 100, availability: 'InStock',
    image: '/images/hex-bolt.svg',
    specs: [
      { name: 'thread_size',      value: 'M8' },
      { name: 'length',           value: '40 mm' },
      { name: 'head_type',        value: 'Hex' },
      { name: 'drive_type',       value: 'External hex SW13' },
      { name: 'tensile_class',    value: '8.8' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated (8 µm)' },
      { name: 'weight_per_piece', value: '17.4 g' }
    ]
  },
  {
    sku: 'HX-M10-50', mpn: 'BSW-933-M10-50-88-ZN',
    name: 'Hex bolt M10 × 50 mm, grade 8.8, zinc plated',
    category: categories.hex_bolts,
    description: 'Fully-threaded hex head bolt, M10 × 50, DIN 933 / ISO 4017, steel 8.8, zinc plated. Pack of 100.',
    shortDesc: 'M10 × 50 mm, DIN 933, 8.8, zinc plated, pack of 100.',
    priceEur: 32.40, packSize: 100, availability: 'InStock',
    image: '/images/hex-bolt.svg',
    specs: [
      { name: 'thread_size',      value: 'M10' },
      { name: 'length',           value: '50 mm' },
      { name: 'head_type',        value: 'Hex' },
      { name: 'drive_type',       value: 'External hex SW17' },
      { name: 'tensile_class',    value: '8.8' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated (8 µm)' },
      { name: 'weight_per_piece', value: '36.8 g' }
    ]
  },
  {
    sku: 'WS-CS-4-40', mpn: 'BSW-WS-CS-4-40-ZN',
    name: 'Countersunk wood screw 4 × 40 mm, zinc plated',
    category: categories.wood_screws,
    description: 'Countersunk head wood screw with sharp tip and partially-threaded shank, 4 × 40 mm, zinc plated steel. Pack of 500.',
    shortDesc: 'Countersunk 4 × 40 mm, Phillips, zinc plated, pack of 500.',
    priceEur: 14.80, packSize: 500, availability: 'InStock',
    image: '/images/wood-screw.svg',
    specs: [
      { name: 'thread_size',      value: '4.0 mm' },
      { name: 'length',           value: '40 mm' },
      { name: 'head_type',        value: 'Countersunk' },
      { name: 'drive_type',       value: 'Phillips PH2' },
      { name: 'tensile_class',    value: 'Standard' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated' },
      { name: 'weight_per_piece', value: '3.1 g' }
    ]
  },
  {
    sku: 'MS-HX-M6-30', mpn: 'BSW-912-M6-30-129',
    name: 'Hex socket cap screw M6 × 30 mm, grade 12.9',
    category: categories.machine_screws,
    description: 'Hex socket cap head machine screw, M6 × 30, DIN 912 / ISO 4762, steel grade 12.9, black oxide finish. Pack of 100.',
    shortDesc: 'M6 × 30 mm, DIN 912, 12.9, hex socket, black, pack of 100.',
    priceEur: 16.20, packSize: 100, availability: 'InStock',
    image: '/images/machine-screw.svg',
    specs: [
      { name: 'thread_size',      value: 'M6' },
      { name: 'length',           value: '30 mm' },
      { name: 'head_type',        value: 'Socket cap' },
      { name: 'drive_type',       value: 'Hex socket SW5' },
      { name: 'tensile_class',    value: '12.9' },
      { name: 'material',         value: 'Alloy steel' },
      { name: 'surface_finish',   value: 'Black oxide' },
      { name: 'weight_per_piece', value: '7.8 g' }
    ]
  },
  {
    sku: 'ST-PH-4-25', mpn: 'BSW-7981-4-25-ZN',
    name: 'Self-tapping screw 4.2 × 25 mm, Phillips, zinc plated',
    category: categories.self_tapping,
    description: 'Self-tapping pan head screw, 4.2 × 25 mm, DIN 7981, Phillips drive, sharp piercing point, zinc plated. Pack of 500.',
    shortDesc: '4.2 × 25 mm, DIN 7981, Phillips, zinc plated, pack of 500.',
    priceEur: 16.50, packSize: 500, availability: 'InStock',
    image: '/images/self-tapping.svg',
    specs: [
      { name: 'thread_size',      value: '4.2 mm' },
      { name: 'length',           value: '25 mm' },
      { name: 'head_type',        value: 'Pan head' },
      { name: 'drive_type',       value: 'Phillips PH2' },
      { name: 'tensile_class',    value: 'C-type' },
      { name: 'material',         value: 'Hardened steel' },
      { name: 'surface_finish',   value: 'Zinc plated' },
      { name: 'weight_per_piece', value: '2.0 g' }
    ]
  },
  {
    sku: 'AB-M8-80', mpn: 'BSW-AB-M8-80-ZN',
    name: 'Expansion anchor bolt M8 × 80 mm, zinc plated',
    category: categories.anchor_bolts,
    description: 'Heavy-duty wedge anchor bolt for concrete, M8 thread, 80 mm length, zinc-plated steel sleeve and bolt. ETA Option 1 approved. Box of 50.',
    shortDesc: 'Wedge anchor M8 × 80 mm, ETA Option 1, zinc, box of 50.',
    priceEur: 38.40, packSize: 50, availability: 'InStock',
    image: '/images/anchor-bolt.svg',
    specs: [
      { name: 'thread_size',      value: 'M8' },
      { name: 'length',           value: '80 mm' },
      { name: 'head_type',        value: 'Hex with washer' },
      { name: 'drive_type',       value: 'External hex SW13' },
      { name: 'tensile_class',    value: 'ETA Option 1' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated (8 µm)' },
      { name: 'weight_per_piece', value: '47.0 g' },
      { name: 'drill_hole',       value: '8 mm' },
      { name: 'concrete_grade',   value: 'C20/25 — C50/60' }
    ]
  }
];

/**
 * Full catalogue. Curated first (so they win on any SKU collision —
 * there are none by construction, generated SKUs always carry a
 * grade/finish suffix) then the generated long tail.
 */
export const products: Product[] = [...curatedProducts, ...generatedProducts];

// Map lookup — linear scan over ~1,600 items per offer line would be
// wasteful; the Map is built once at module load.
const BY_SKU: Map<string, Product> = new Map(products.map((p) => [p.sku, p]));

export function productBySku(sku: string): Product | undefined {
  return BY_SKU.get(sku);
}

/**
 * Curated cross-section reused as the JSON-LD sample on listing pages —
 * the audit's conformance pass only needs SOME Products with the four
 * axes present, not all ~1,600 (which would be a multi-MB <script>).
 */
export const sampleProducts: Product[] = curatedProducts;

/**
 * Six "featured" SKUs surfaced on the homepage. Deliberately a narrow
 * slice of the catalogue — a buyer who wants anything else has to use
 * /search, which is the whole point of the large catalogue.
 */
export const featuredSkus = ['HX-M8-40', 'HX-M10-50', 'WS-CS-4-40', 'MS-HX-M6-30', 'ST-PH-4-25', 'AB-M8-80'];

export function featuredProducts(): Product[] {
  return featuredSkus.map(productBySku).filter((p): p is Product => !!p);
}

export function productsByCategory(): Array<{ category: ProductCategory; items: Product[] }> {
  return Object.values(categories).map((c) => ({
    category: c,
    items: products.filter((p) => p.category.key === c.key)
  }));
}

/**
 * Per-category counts + a tiny sample. Drives the search-first /products
 * page, which shows how big each line is (and links into /search)
 * instead of dumping every SKU.
 */
export function categoryStats(): Array<{ category: ProductCategory; count: number; sample: Product[] }> {
  return Object.values(categories).map((c) => {
    const items = products.filter((p) => p.category.key === c.key);
    return { category: c, count: items.length, sample: items.slice(0, 3) };
  });
}

export const catalogueSize = products.length;

/**
 * Build a single Product JSON-LD node — used both inline on product
 * detail pages and inside ItemList wrappers on collection / search
 * pages. The conformance pass keys off `sku` + `mpn` for identifier,
 * `offers` for Offer, and `additionalProperty` for structured specs.
 */
export function productJsonLd(p: Product) {
  return {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        p.name,
    description: p.description,
    sku:         p.sku,
    mpn:         p.mpn,
    brand:       { '@type': 'Brand', name: company.shortName },
    manufacturer:{ '@type': 'Organization', name: company.name, url: company.url },
    image:       `${company.url}${p.image}`,
    url:         `${company.url}/products/${p.sku}`,
    category:    p.category.label,
    additionalProperty: p.specs.map((s) => ({
      '@type': 'PropertyValue', name: s.name, value: s.value
    })),
    offers: {
      '@type':         'Offer',
      url:             `${company.url}/products/${p.sku}`,
      priceCurrency:   'EUR',
      price:           p.priceEur.toFixed(2),
      availability:    `https://schema.org/${p.availability}`,
      itemCondition:   'https://schema.org/NewCondition',
      eligibleQuantity:{ '@type': 'QuantitativeValue', minValue: 1, unitCode: 'C62' },
      seller:          { '@type': 'Organization', name: company.name, url: company.url }
    },
    /*
     * Agent-discoverable quotation endpoint. The schema.org
     * `potentialAction` + `EntryPoint.urlTemplate` (RFC 6570) pattern
     * tells a parser: "to get a binding quote for this product, GET
     * this URL with {qty} and {country} substituted in".
     */
    potentialAction: {
      '@type':     'QuoteAction',
      name:        'Get a binding quotation for this product',
      target: {
        '@type':      'EntryPoint',
        urlTemplate:  `${company.url}/offer?sku=${p.sku}&qty={qty}&delivery_country={country}`,
        httpMethod:   'GET',
        contentType:  'text/html'
      },
      object: [
        { '@type': 'PropertyValue', name: 'qty',     valueRequired: true, description: 'Quantity in pieces (integer, 1-100000)' },
        { '@type': 'PropertyValue', name: 'country', valueRequired: true, description: 'Delivery country as ISO 3166-1 alpha-2 (e.g. DE, AT, CH)' }
      ]
    }
  };
}
