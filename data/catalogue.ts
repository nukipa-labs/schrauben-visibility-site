/**
 * Generated product catalogue — the "very large" SKU set that makes
 * browsing the site by hand impractical and forces an agent through the
 * /search endpoint instead.
 *
 * Everything here is DETERMINISTIC: no Math.random(), no Date.now().
 * SKUs, prices, weights, and availability are pure functions of the
 * dimension grid (thread/gauge × length × grade/finish), so the same
 * catalogue is produced on every build and every request.
 *
 * Shared types + the `categories` map live in this file (not
 * data/products.ts) so the import graph stays acyclic:
 *   catalogue.ts  (no imports from products.ts)
 *      ↑
 *   products.ts   (imports generatedProducts + categories from here)
 *      ↑
 *   pages / lib/search
 */

export type Spec = { name: string; value: string };

export type ProductCategory = { key: string; label: string; blurb: string };

export type Product = {
  sku:          string;
  mpn:          string;
  name:         string;
  category:     ProductCategory;
  description:  string;
  shortDesc:    string;
  priceEur:     number;            // per PACK (offer divides by packSize)
  packSize:     number;            // pieces per pack
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder';
  image:        string;
  specs:        Spec[];            // ≥5 entries — the audit needs ≥5
};

export const categories: Record<string, ProductCategory> = {
  hex_bolts:      { key: 'hex_bolts',      label: 'Hex Bolts (DIN 933)',     blurb: 'Fully-threaded hex head bolts, M3–M20, grades 8.8 / 10.9 and stainless A2 / A4.' },
  machine_screws: { key: 'machine_screws', label: 'Machine Screws',          blurb: 'Socket cap (DIN 912), pan and countersunk machine screws — slotted, Phillips, hex socket.' },
  wood_screws:    { key: 'wood_screws',    label: 'Wood Screws',             blurb: 'Countersunk, raised and pan-head wood screws — Pozidriv and Torx, zinc and stainless.' },
  self_tapping:   { key: 'self_tapping',   label: 'Self-Tapping Screws',     blurb: 'DIN 7981 self-tapping screws for sheet metal and plastic, Phillips drive.' },
  anchor_bolts:   { key: 'anchor_bolts',   label: 'Expansion Anchor Bolts',  blurb: 'Heavy-duty wedge anchors for concrete and masonry, M6–M20, zinc and A4 stainless.' }
};

const IMAGE_BY_CATEGORY: Record<string, string> = {
  hex_bolts:      '/images/hex-bolt.svg',
  machine_screws: '/images/machine-screw.svg',
  wood_screws:    '/images/wood-screw.svg',
  self_tapping:   '/images/self-tapping.svg',
  anchor_bolts:   '/images/anchor-bolt.svg'
};

// ── deterministic helpers ──────────────────────────────────────────────
function fnv(s: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) >>> 0) + ((h << 4) >>> 0) + ((h << 7) >>> 0) + ((h << 8) >>> 0) + ((h << 24) >>> 0)) >>> 0;
  }
  return h >>> 0;
}
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const weightG = (d: number, L: number, k: number) => round1(k * d * d * L);
const perPiece = (w: number, matRate: number, base: number) => round2(matRate * (w / 1000) + base);

function packSizeFor(d: number): number {
  if (d <= 4)  return 500;
  if (d <= 6)  return 200;
  if (d <= 8)  return 100;
  if (d <= 12) return 50;
  if (d <= 16) return 25;
  return 10;
}
function availFor(sku: string): Product['availability'] {
  return fnv(sku) % 11 === 0 ? 'BackOrder' : 'InStock';
}

// ── dimension grids ────────────────────────────────────────────────────
const METRIC_LENGTHS: Record<string, number[]> = {
  M3:  [6, 8, 10, 12, 16, 20, 25, 30],
  M4:  [8, 10, 12, 16, 20, 25, 30, 35, 40],
  M5:  [10, 12, 16, 20, 25, 30, 35, 40, 45, 50],
  M6:  [12, 16, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80],
  M8:  [16, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100],
  M10: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120],
  M12: [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120],
  M16: [35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 110, 120],
  M20: [45, 50, 55, 60, 70, 80, 90, 100, 110, 120]
};
const THREAD_DIA: Record<string, number> = { M3: 3, M4: 4, M5: 5, M6: 6, M8: 8, M10: 10, M12: 12, M16: 16, M20: 20 };
const HEX_SW: Record<string, string> = { M3: '5.5', M4: '7', M5: '8', M6: '10', M8: '13', M10: '17', M12: '19', M16: '24', M20: '30' };
const SOCKET_SW: Record<string, string> = { M3: '2.5', M4: '3', M5: '4', M6: '5', M8: '6', M10: '8', M12: '10' };

type Grade = { code: string; label: string; material: string; finish: string; matRate: number };

const HEX_GRADES: Grade[] = [
  { code: '88',  label: '8.8',   material: 'Carbon steel',                finish: 'Zinc plated (8 µm)', matRate: 3.2 },
  { code: '109', label: '10.9',  material: 'Alloy steel',                 finish: 'Zinc plated (8 µm)', matRate: 4.0 },
  { code: 'A2',  label: 'A2-70', material: 'Stainless steel 1.4301 (A2)', finish: 'Bright',             matRate: 9.0 },
  { code: 'A4',  label: 'A4-80', material: 'Stainless steel 1.4401 (A4)', finish: 'Bright',             matRate: 12.0 }
];
const SOCKET_GRADES: Grade[] = [
  { code: '88',  label: '8.8',   material: 'Carbon steel',                finish: 'Zinc plated (8 µm)', matRate: 3.4 },
  { code: '129', label: '12.9',  material: 'Alloy steel',                 finish: 'Black oxide',        matRate: 4.8 },
  { code: 'A2',  label: 'A2-70', material: 'Stainless steel 1.4301 (A2)', finish: 'Bright',             matRate: 9.5 }
];
const MS_GRADES: Grade[] = [
  { code: '48', label: '4.8',   material: 'Carbon steel',                finish: 'Zinc plated', matRate: 2.8 },
  { code: 'A2', label: 'A2-70', material: 'Stainless steel 1.4301 (A2)', finish: 'Bright',      matRate: 8.5 }
];

// ── the catalogue ──────────────────────────────────────────────────────
function buildCatalogue(): Product[] {
  const out: Product[] = [];
  const seen = new Set<string>();
  const push = (p: Product) => { if (!seen.has(p.sku)) { seen.add(p.sku); out.push(p); } };

  // Hex bolts (DIN 933) — M3–M20 × lengths × {8.8, 10.9, A2, A4}
  for (const thread of Object.keys(METRIC_LENGTHS)) {
    const d = THREAD_DIA[thread];
    for (const L of METRIC_LENGTHS[thread]) {
      for (const g of HEX_GRADES) {
        const sku  = `HX-${thread}-${L}-${g.code}`;
        const w    = weightG(d, L, 0.0066);
        const pack = packSizeFor(d);
        const price = round2(perPiece(w, g.matRate, 0.02) * pack);
        const stainless = g.code === 'A2' || g.code === 'A4';
        push({
          sku, mpn: `BSW-933-${thread}-${L}-${g.code}`,
          name: stainless
            ? `Hex bolt ${thread} × ${L} mm, stainless ${g.label}`
            : `Hex bolt ${thread} × ${L} mm, grade ${g.label}, zinc plated`,
          category: categories.hex_bolts,
          description: `Fully-threaded hex head bolt, ${thread} × ${L} mm, DIN 933 / ISO 4017, ${g.material}, ${g.finish.toLowerCase()}. Pack of ${pack}.`,
          shortDesc: `${thread} × ${L} mm, DIN 933, ${g.label}, pack of ${pack}.`,
          priceEur: price, packSize: pack, availability: availFor(sku),
          image: IMAGE_BY_CATEGORY.hex_bolts,
          specs: [
            { name: 'thread_size',      value: thread },
            { name: 'length',           value: `${L} mm` },
            { name: 'head_type',        value: 'Hex' },
            { name: 'drive_type',       value: `External hex SW${HEX_SW[thread]}` },
            { name: 'tensile_class',    value: g.label },
            { name: 'material',         value: g.material },
            { name: 'surface_finish',   value: g.finish },
            { name: 'standard',         value: 'DIN 933 / ISO 4017' },
            { name: 'weight_per_piece', value: `${w} g` }
          ]
        });
      }
    }
  }

  // Socket cap screws (DIN 912) — M3–M12, under machine_screws
  for (const thread of ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12']) {
    const d = THREAD_DIA[thread];
    for (const L of METRIC_LENGTHS[thread]) {
      for (const g of SOCKET_GRADES) {
        const sku  = `SC-${thread}-${L}-${g.code}`;
        const w    = weightG(d, L, 0.0070);
        const pack = packSizeFor(d);
        const price = round2(perPiece(w, g.matRate, 0.02) * pack);
        const stainless = g.code === 'A2';
        push({
          sku, mpn: `BSW-912-${thread}-${L}-${g.code}`,
          name: stainless
            ? `Hex socket cap screw ${thread} × ${L} mm, stainless ${g.label}`
            : `Hex socket cap screw ${thread} × ${L} mm, grade ${g.label}`,
          category: categories.machine_screws,
          description: `Hex socket cap head machine screw, ${thread} × ${L} mm, DIN 912 / ISO 4762, ${g.material}, ${g.finish.toLowerCase()}. Pack of ${pack}.`,
          shortDesc: `${thread} × ${L} mm, DIN 912, ${g.label}, hex socket, pack of ${pack}.`,
          priceEur: price, packSize: pack, availability: availFor(sku),
          image: IMAGE_BY_CATEGORY.machine_screws,
          specs: [
            { name: 'thread_size',      value: thread },
            { name: 'length',           value: `${L} mm` },
            { name: 'head_type',        value: 'Socket cap' },
            { name: 'drive_type',       value: `Hex socket SW${SOCKET_SW[thread]}` },
            { name: 'tensile_class',    value: g.label },
            { name: 'material',         value: g.material },
            { name: 'surface_finish',   value: g.finish },
            { name: 'standard',         value: 'DIN 912 / ISO 4762' },
            { name: 'weight_per_piece', value: `${w} g` }
          ]
        });
      }
    }
  }

  // Machine screws (pan / countersunk) — DIN 7985 / 85 / 965
  const MS_LENGTHS: Record<string, number[]> = {
    M3: [6, 8, 10, 12, 16, 20, 25, 30],
    M4: [8, 10, 12, 16, 20, 25, 30, 35, 40],
    M5: [10, 12, 16, 20, 25, 30, 35, 40],
    M6: [12, 16, 20, 25, 30, 35, 40, 50],
    M8: [16, 20, 25, 30, 35, 40, 50]
  };
  const MS_LINES = [
    { prefix: 'MSP', head: 'Pan head',    drive: 'Phillips PH2', din: 'DIN 7985 / ISO 7045', dinNo: '7985' },
    { prefix: 'MSS', head: 'Pan head',    drive: 'Slotted',      din: 'DIN 85 / ISO 1580',   dinNo: '85'   },
    { prefix: 'MSK', head: 'Countersunk', drive: 'Phillips PH2', din: 'DIN 965 / ISO 7046',  dinNo: '965'  }
  ];
  for (const line of MS_LINES) {
    for (const thread of Object.keys(MS_LENGTHS)) {
      const d = THREAD_DIA[thread];
      for (const L of MS_LENGTHS[thread]) {
        for (const g of MS_GRADES) {
          const sku  = `${line.prefix}-${thread}-${L}-${g.code}`;
          const w    = weightG(d, L, 0.0042);
          const pack = packSizeFor(d);
          const price = round2(perPiece(w, g.matRate, 0.015) * pack);
          const finishWord = g.code === 'A2' ? 'stainless A2' : 'zinc plated';
          push({
            sku, mpn: `BSW-${line.dinNo}-${thread}-${L}-${g.code}`,
            name: `${line.head} ${line.drive.split(' ')[0]} machine screw ${thread} × ${L} mm, ${finishWord}`,
            category: categories.machine_screws,
            description: `${line.head} ${line.drive} machine screw, ${thread} × ${L} mm, ${line.din}, ${g.material}, ${g.finish.toLowerCase()}. Pack of ${pack}.`,
            shortDesc: `${thread} × ${L} mm, ${line.head}, ${line.drive}, ${g.label}, pack of ${pack}.`,
            priceEur: price, packSize: pack, availability: availFor(sku),
            image: IMAGE_BY_CATEGORY.machine_screws,
            specs: [
              { name: 'thread_size',      value: thread },
              { name: 'length',           value: `${L} mm` },
              { name: 'head_type',        value: line.head },
              { name: 'drive_type',       value: line.drive },
              { name: 'tensile_class',    value: g.label },
              { name: 'material',         value: g.material },
              { name: 'surface_finish',   value: g.finish },
              { name: 'standard',         value: line.din },
              { name: 'weight_per_piece', value: `${w} g` }
            ]
          });
        }
      }
    }
  }

  // Wood screws — gauge × length × head × drive × {zinc, A2}
  const WOOD_LENGTHS: Record<string, number[]> = {
    '3.0': [12, 16, 20, 25, 30, 40],
    '3.5': [16, 20, 25, 30, 35, 40, 45],
    '4.0': [20, 25, 30, 35, 40, 45, 50, 60],
    '4.5': [30, 40, 45, 50, 60, 70],
    '5.0': [30, 40, 50, 60, 70, 80],
    '6.0': [40, 50, 60, 70, 80, 90, 100]
  };
  const WOOD_HEADS  = [{ h: 'Countersunk', p: 'CS' }, { h: 'Raised countersunk', p: 'RC' }, { h: 'Pan head', p: 'PN' }];
  const WOOD_DRIVES = [{ d: 'Pozidriv PZ2', p: 'PZ' }, { d: 'Torx T20', p: 'TX' }];
  const WOOD_FINISH = [
    { code: 'ZN', material: 'Carbon steel',                finish: 'Zinc plated', matRate: 2.4 },
    { code: 'A2', material: 'Stainless steel 1.4301 (A2)', finish: 'Bright',      matRate: 8.0 }
  ];
  for (const head of WOOD_HEADS) {
    for (const drive of WOOD_DRIVES) {
      for (const gaugeStr of Object.keys(WOOD_LENGTHS)) {
        const gauge = parseFloat(gaugeStr);
        const gcode = gaugeStr.replace('.', '');
        for (const L of WOOD_LENGTHS[gaugeStr]) {
          for (const f of WOOD_FINISH) {
            const sku  = `WS-${head.p}${drive.p}-${gcode}-${L}-${f.code}`;
            const w    = weightG(gauge, L, 0.0040);
            const pack = packSizeFor(gauge);
            const price = round2(perPiece(w, f.matRate, 0.012) * pack);
            const finishWord = f.code === 'A2' ? 'stainless A2' : 'zinc plated';
            push({
              sku, mpn: `BSW-WS-${head.p}${drive.p}-${gcode}-${L}-${f.code}`,
              name: `${head.h} wood screw ${gaugeStr} × ${L} mm, ${drive.d}, ${finishWord}`,
              category: categories.wood_screws,
              description: `${head.h} wood screw with sharp tip and partial thread, ${gaugeStr} × ${L} mm, ${drive.d} drive, ${f.material}, ${f.finish.toLowerCase()}. Pack of ${pack}.`,
              shortDesc: `${gaugeStr} × ${L} mm, ${head.h}, ${drive.d}, pack of ${pack}.`,
              priceEur: price, packSize: pack, availability: availFor(sku),
              image: IMAGE_BY_CATEGORY.wood_screws,
              specs: [
                { name: 'thread_size',      value: `${gaugeStr} mm` },
                { name: 'length',           value: `${L} mm` },
                { name: 'head_type',        value: head.h },
                { name: 'drive_type',       value: drive.d },
                { name: 'tensile_class',    value: 'Standard' },
                { name: 'material',         value: f.material },
                { name: 'surface_finish',   value: f.finish },
                { name: 'standard',         value: 'DIN 7997 / DIN 571' },
                { name: 'weight_per_piece', value: `${w} g` }
              ]
            });
          }
        }
      }
    }
  }

  // Self-tapping screws (DIN 7981) — gauge × length × head × {zinc, A2}
  const ST_LENGTHS: Record<string, number[]> = {
    '2.9': [9.5, 13, 16, 19, 25],
    '3.5': [13, 16, 19, 25, 32],
    '3.9': [13, 16, 19, 25, 32, 38],
    '4.2': [13, 16, 19, 25, 32, 38, 45],
    '4.8': [16, 19, 25, 32, 38, 45, 50],
    '5.5': [19, 25, 32, 38, 45, 50],
    '6.3': [25, 32, 38, 45, 50, 60]
  };
  const ST_HEADS  = [{ h: 'Pan head', p: 'PN' }, { h: 'Countersunk', p: 'CS' }];
  const ST_FINISH = [
    { code: 'ZN', material: 'Hardened steel',               finish: 'Zinc plated', matRate: 2.6 },
    { code: 'A2', material: 'Stainless steel 1.4301 (A2)',  finish: 'Bright',      matRate: 8.2 }
  ];
  for (const head of ST_HEADS) {
    for (const gaugeStr of Object.keys(ST_LENGTHS)) {
      const gauge = parseFloat(gaugeStr);
      const gcode = gaugeStr.replace('.', '');
      for (const L of ST_LENGTHS[gaugeStr]) {
        for (const f of ST_FINISH) {
          const lcode = String(L).replace('.', '');
          const sku  = `ST-${head.p}PH-${gcode}-${lcode}-${f.code}`;
          const w    = weightG(gauge, L, 0.0044);
          const pack = packSizeFor(gauge);
          const price = round2(perPiece(w, f.matRate, 0.013) * pack);
          const finishWord = f.code === 'A2' ? 'stainless A2' : 'zinc plated';
          push({
            sku, mpn: `BSW-7981-${head.p}-${gcode}-${lcode}-${f.code}`,
            name: `Self-tapping ${head.h.toLowerCase()} screw ${gaugeStr} × ${L} mm, Phillips, ${finishWord}`,
            category: categories.self_tapping,
            description: `Self-tapping ${head.h.toLowerCase()} screw with sharp piercing point, ${gaugeStr} × ${L} mm, DIN 7981, Phillips PH2 drive, ${f.material}, ${f.finish.toLowerCase()}. Pack of ${pack}.`,
            shortDesc: `${gaugeStr} × ${L} mm, DIN 7981, ${head.h}, Phillips, pack of ${pack}.`,
            priceEur: price, packSize: pack, availability: availFor(sku),
            image: IMAGE_BY_CATEGORY.self_tapping,
            specs: [
              { name: 'thread_size',      value: `${gaugeStr} mm` },
              { name: 'length',           value: `${L} mm` },
              { name: 'head_type',        value: head.h },
              { name: 'drive_type',       value: 'Phillips PH2' },
              { name: 'tensile_class',    value: 'C-type' },
              { name: 'material',         value: f.material },
              { name: 'surface_finish',   value: f.finish },
              { name: 'standard',         value: 'DIN 7981 / ISO 1481' },
              { name: 'weight_per_piece', value: `${w} g` }
            ]
          });
        }
      }
    }
  }

  // Expansion anchor bolts — M6–M20 × length × {zinc, A4}
  const ANCHOR_LENGTHS: Record<string, number[]> = {
    M6:  [50, 65, 80],
    M8:  [65, 80, 95, 110],
    M10: [80, 95, 110, 130],
    M12: [100, 115, 130, 160],
    M16: [125, 145, 165],
    M20: [150, 170, 200]
  };
  const ANCHOR_FINISH = [
    { code: 'ZN', material: 'Carbon steel',                finish: 'Zinc plated (8 µm)', matRate: 3.0 },
    { code: 'A4', material: 'Stainless steel 1.4401 (A4)', finish: 'Bright',             matRate: 12.0 }
  ];
  for (const thread of Object.keys(ANCHOR_LENGTHS)) {
    const d = THREAD_DIA[thread];
    for (const L of ANCHOR_LENGTHS[thread]) {
      for (const f of ANCHOR_FINISH) {
        const sku  = `AB-${thread}-${L}-${f.code}`;
        const w    = weightG(d, L, 0.013);
        const pack = d <= 8 ? 50 : d <= 12 ? 25 : 10;
        const price = round2(perPiece(w, f.matRate, 0.05) * pack);
        push({
          sku, mpn: `BSW-AB-${thread}-${L}-${f.code}`,
          name: `Expansion anchor bolt ${thread} × ${L} mm, ${f.code === 'A4' ? 'stainless A4' : 'zinc plated'}`,
          category: categories.anchor_bolts,
          description: `Heavy-duty wedge anchor bolt for concrete, ${thread} thread, ${L} mm length, ${f.material}, ${f.finish.toLowerCase()}. ETA Option 1 approved. Box of ${pack}.`,
          shortDesc: `Wedge anchor ${thread} × ${L} mm, ETA Option 1, box of ${pack}.`,
          priceEur: price, packSize: pack, availability: availFor(sku),
          image: IMAGE_BY_CATEGORY.anchor_bolts,
          specs: [
            { name: 'thread_size',      value: thread },
            { name: 'length',           value: `${L} mm` },
            { name: 'head_type',        value: 'Hex with washer' },
            { name: 'drive_type',       value: `External hex SW${HEX_SW[thread]}` },
            { name: 'tensile_class',    value: 'ETA Option 1' },
            { name: 'material',         value: f.material },
            { name: 'surface_finish',   value: f.finish },
            { name: 'standard',         value: 'ETAG 001' },
            { name: 'weight_per_piece', value: `${w} g` },
            { name: 'drill_hole',       value: `${d} mm` }
          ]
        });
      }
    }
  }

  return out;
}

export const generatedProducts: Product[] = buildCatalogue();
