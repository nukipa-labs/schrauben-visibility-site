import { company } from './company';

/**
 * Screw catalogue — 14 SKUs across 5 families. Hand-tuned to make
 * EVERY product page satisfy the supplier audit's conformance check:
 *   - JSON-LD Product (drives all four rolled-up axes)
 *   - JSON-LD Offer (drives offer + has_price)
 *   - sku + mpn (drives identifier_kind)
 *   - additionalProperty with ≥5 entries (drives structured_specs)
 * Specs are also rendered as a visible HTML <table> on each detail
 * page so the agent's visibleText sees them as text too (the
 * conformance pass treats either as "structured").
 */

export type Spec = { name: string; value: string };

export type Product = {
  sku:           string;
  mpn:           string;
  name:          string;
  category:      ProductCategory;
  description:   string;
  shortDesc:     string;
  priceEur:      number;            // per piece
  packSize:      number;            // pieces per pack
  availability:  'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder';
  image:         string;            // /images/...svg placeholder
  specs:         Spec[];            // 7-8 entries — the audit needs ≥5
};

export type ProductCategory = {
  key:      string;
  label:    string;
  blurb:    string;
};

export const categories: Record<string, ProductCategory> = {
  hex_bolts:     { key: 'hex_bolts',     label: 'Hex Bolts (DIN 933)',           blurb: 'Fully-threaded hex head bolts in steel grade 8.8, zinc plated.' },
  wood_screws:   { key: 'wood_screws',   label: 'Wood Screws',                   blurb: 'Countersunk and pan-head wood screws with sharp tip.' },
  machine_screws:{ key: 'machine_screws',label: 'Machine Screws',                blurb: 'Metric machine screws with slotted, Phillips, and hex socket drives.' },
  self_tapping:  { key: 'self_tapping',  label: 'Self-Tapping Screws',           blurb: 'Self-piercing screws for sheet metal and plastic substrates.' },
  anchor_bolts:  { key: 'anchor_bolts',  label: 'Expansion Anchor Bolts',        blurb: 'Heavy-duty wedge anchors for concrete and masonry.' }
};

export const products: Product[] = [
  // ─── Hex bolts (DIN 933) ────────────────────────────────────────────
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
    sku: 'HX-M12-60', mpn: 'BSW-933-M12-60-A2',
    name: 'Hex bolt M12 × 60 mm, stainless A2',
    category: categories.hex_bolts,
    description: 'Fully-threaded hex head bolt, M12 × 60, DIN 933 / ISO 4017, stainless steel A2-70 (1.4301). Pack of 50.',
    shortDesc: 'M12 × 60 mm, DIN 933, A2 stainless, pack of 50.',
    priceEur: 41.20, packSize: 50, availability: 'InStock',
    image: '/images/hex-bolt.svg',
    specs: [
      { name: 'thread_size',      value: 'M12' },
      { name: 'length',           value: '60 mm' },
      { name: 'head_type',        value: 'Hex' },
      { name: 'drive_type',       value: 'External hex SW19' },
      { name: 'tensile_class',    value: 'A2-70' },
      { name: 'material',         value: 'Stainless steel 1.4301 (A2)' },
      { name: 'surface_finish',   value: 'Bright' },
      { name: 'weight_per_piece', value: '64.0 g' }
    ]
  },

  // ─── Wood screws ────────────────────────────────────────────────────
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
    sku: 'WS-CS-5-60', mpn: 'BSW-WS-CS-5-60-ZN',
    name: 'Countersunk wood screw 5 × 60 mm, zinc plated',
    category: categories.wood_screws,
    description: 'Countersunk wood screw, 5 × 60 mm, partial thread, Pozidriv drive, zinc plated steel. Pack of 200.',
    shortDesc: 'Countersunk 5 × 60 mm, Pozidriv, zinc plated, pack of 200.',
    priceEur: 12.60, packSize: 200, availability: 'InStock',
    image: '/images/wood-screw.svg',
    specs: [
      { name: 'thread_size',      value: '5.0 mm' },
      { name: 'length',           value: '60 mm' },
      { name: 'head_type',        value: 'Countersunk' },
      { name: 'drive_type',       value: 'Pozidriv PZ2' },
      { name: 'tensile_class',    value: 'Standard' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated' },
      { name: 'weight_per_piece', value: '5.4 g' }
    ]
  },
  {
    sku: 'WS-PH-4-30', mpn: 'BSW-WS-PH-4-30-ZN',
    name: 'Pan head wood screw 4 × 30 mm, zinc plated',
    category: categories.wood_screws,
    description: 'Pan head wood screw with sharp tip, 4 × 30 mm, Phillips drive, zinc plated. Pack of 500.',
    shortDesc: 'Pan head 4 × 30 mm, Phillips, zinc plated, pack of 500.',
    priceEur: 13.20, packSize: 500, availability: 'InStock',
    image: '/images/wood-screw.svg',
    specs: [
      { name: 'thread_size',      value: '4.0 mm' },
      { name: 'length',           value: '30 mm' },
      { name: 'head_type',        value: 'Pan head' },
      { name: 'drive_type',       value: 'Phillips PH2' },
      { name: 'tensile_class',    value: 'Standard' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated' },
      { name: 'weight_per_piece', value: '2.5 g' }
    ]
  },

  // ─── Machine screws ─────────────────────────────────────────────────
  {
    sku: 'MS-SL-M4-20', mpn: 'BSW-84-M4-20-ZN',
    name: 'Slotted machine screw M4 × 20 mm, zinc plated',
    category: categories.machine_screws,
    description: 'Slotted pan head machine screw, M4 × 20, DIN 84 / ISO 1207, zinc plated steel. Pack of 200.',
    shortDesc: 'M4 × 20 mm, DIN 84, slotted, zinc plated, pack of 200.',
    priceEur: 9.40, packSize: 200, availability: 'InStock',
    image: '/images/machine-screw.svg',
    specs: [
      { name: 'thread_size',      value: 'M4' },
      { name: 'length',           value: '20 mm' },
      { name: 'head_type',        value: 'Pan head' },
      { name: 'drive_type',       value: 'Slotted' },
      { name: 'tensile_class',    value: '4.8' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated' },
      { name: 'weight_per_piece', value: '1.7 g' }
    ]
  },
  {
    sku: 'MS-PH-M5-25', mpn: 'BSW-7985-M5-25-ZN',
    name: 'Phillips machine screw M5 × 25 mm, zinc plated',
    category: categories.machine_screws,
    description: 'Pan head Phillips machine screw, M5 × 25, DIN 7985 / ISO 7045, zinc plated steel. Pack of 200.',
    shortDesc: 'M5 × 25 mm, DIN 7985, Phillips, zinc plated, pack of 200.',
    priceEur: 11.80, packSize: 200, availability: 'InStock',
    image: '/images/machine-screw.svg',
    specs: [
      { name: 'thread_size',      value: 'M5' },
      { name: 'length',           value: '25 mm' },
      { name: 'head_type',        value: 'Pan head' },
      { name: 'drive_type',       value: 'Phillips PH2' },
      { name: 'tensile_class',    value: '4.8' },
      { name: 'material',         value: 'Carbon steel' },
      { name: 'surface_finish',   value: 'Zinc plated' },
      { name: 'weight_per_piece', value: '2.8 g' }
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

  // ─── Self-tapping ───────────────────────────────────────────────────
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
    sku: 'ST-PH-5-35', mpn: 'BSW-7981-5-35-ZN',
    name: 'Self-tapping screw 4.8 × 35 mm, Phillips, zinc plated',
    category: categories.self_tapping,
    description: 'Self-tapping pan head screw, 4.8 × 35 mm, DIN 7981, Phillips drive, sharp piercing point, zinc plated. Pack of 250.',
    shortDesc: '4.8 × 35 mm, DIN 7981, Phillips, zinc plated, pack of 250.',
    priceEur: 13.90, packSize: 250, availability: 'InStock',
    image: '/images/self-tapping.svg',
    specs: [
      { name: 'thread_size',      value: '4.8 mm' },
      { name: 'length',           value: '35 mm' },
      { name: 'head_type',        value: 'Pan head' },
      { name: 'drive_type',       value: 'Phillips PH2' },
      { name: 'tensile_class',    value: 'C-type' },
      { name: 'material',         value: 'Hardened steel' },
      { name: 'surface_finish',   value: 'Zinc plated' },
      { name: 'weight_per_piece', value: '3.6 g' }
    ]
  },

  // ─── Anchor bolts ───────────────────────────────────────────────────
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
  },
  {
    sku: 'AB-M10-100', mpn: 'BSW-AB-M10-100-A4',
    name: 'Expansion anchor bolt M10 × 100 mm, stainless A4',
    category: categories.anchor_bolts,
    description: 'Heavy-duty wedge anchor bolt, M10 × 100 mm, stainless steel A4-70 (1.4401) — suitable for marine and outdoor environments. ETA Option 1 approved. Box of 25.',
    shortDesc: 'Wedge anchor M10 × 100 mm, A4 stainless, ETA Option 1, box of 25.',
    priceEur: 64.80, packSize: 25, availability: 'InStock',
    image: '/images/anchor-bolt.svg',
    specs: [
      { name: 'thread_size',      value: 'M10' },
      { name: 'length',           value: '100 mm' },
      { name: 'head_type',        value: 'Hex with washer' },
      { name: 'drive_type',       value: 'External hex SW17' },
      { name: 'tensile_class',    value: 'ETA Option 1' },
      { name: 'material',         value: 'Stainless steel 1.4401 (A4)' },
      { name: 'surface_finish',   value: 'Bright' },
      { name: 'weight_per_piece', value: '88.0 g' },
      { name: 'drill_hole',       value: '10 mm' },
      { name: 'concrete_grade',   value: 'C20/25 — C50/60' }
    ]
  }
];

/**
 * Six "featured" SKUs surfaced on the homepage — broad cross-section
 * across the categories so the auto-generated buying task has a chance
 * of being satisfiable directly from the home page's ItemList.
 */
export const featuredSkus = [
  'HX-M8-40', 'HX-M10-50', 'WS-CS-5-60', 'MS-HX-M6-30', 'ST-PH-4-25', 'AB-M8-80'
];

export function productBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}

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
 * Build a single Product JSON-LD node — used both inline on product
 * detail pages and inside ItemList wrappers on collection pages.
 * The conformance pass keys off `sku` + `mpn` for identifier, `offers`
 * for Offer, and `additionalProperty` for structured specs — all four
 * are present here, by design.
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
    }
  };
}
