import { products } from '../data/products';
import type { Product } from '../data/products';

/**
 * Catalogue search — pure, used by the GET /search page. Same spirit as
 * lib/pricing: no I/O, deterministic, so an agent fetching
 * /search?thread=M8&grade=8.8&length=30-60 gets a stable result set it
 * can pick a SKU from and hand to /offer.
 *
 * The catalogue is large on purpose (browsing is impractical), so search
 * is the intended entry point. Filters are ANDed; `q` is free-text
 * (every token must appear somewhere in the product).
 */

function specValue(p: Product, name: string): string {
  return p.specs.find((s) => s.name === name)?.value || '';
}
function firstNumber(s: string): number {
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : NaN;
}

// ── facets: the distinct values an agent can filter on ─────────────────
function distinct(fn: (p: Product) => string): string[] {
  return Array.from(new Set(products.map(fn).filter(Boolean)));
}
function byThreadOrder(a: string, b: string): number {
  const na = firstNumber(a), nb = firstNumber(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b);
}

export const FACETS = {
  categories: distinct((p) => p.category.label).sort(),
  threads:    distinct((p) => specValue(p, 'thread_size')).sort(byThreadOrder),
  heads:      distinct((p) => specValue(p, 'head_type')).sort(),
  drives:     distinct((p) => specValue(p, 'drive_type')).sort(),
  materials:  distinct((p) => specValue(p, 'material')).sort(),
  grades:     distinct((p) => specValue(p, 'tensile_class')).sort(),
  finishes:   distinct((p) => specValue(p, 'surface_finish')).sort()
};

export const SEARCH_PARAMS = [
  { name: 'q',          desc: 'Free-text — every word must appear in the SKU, name, category, or any spec value.' },
  { name: 'category',   desc: 'Product family (substring of the category label or key, e.g. "hex", "wood", "anchor").' },
  { name: 'thread',     desc: 'Thread size or gauge, e.g. "M8" or "8" (metric) or "4.0" (wood/self-tapping gauge in mm).' },
  { name: 'length',     desc: 'Length in mm — exact ("40") or range ("30-60").' },
  { name: 'head',       desc: 'Head type substring, e.g. "hex", "countersunk", "pan", "socket cap".' },
  { name: 'drive',      desc: 'Drive type substring, e.g. "phillips", "pozidriv", "torx", "hex socket", "slotted".' },
  { name: 'material',   desc: 'Material substring, e.g. "stainless", "carbon", "alloy", "A2", "A4".' },
  { name: 'grade',      desc: 'Strength / tensile class substring, e.g. "8.8", "10.9", "12.9", "A2-70".' },
  { name: 'finish',     desc: 'Surface finish substring, e.g. "zinc", "bright", "black oxide".' },
  { name: 'min_price',  desc: 'Minimum price per pack in EUR.' },
  { name: 'max_price',  desc: 'Maximum price per pack in EUR.' },
  { name: 'limit',      desc: 'Max results to return (default 25, max 100).' }
] as const;

export type SearchInput = Record<string, string | undefined>;

export type SearchOutcome = {
  results:  Product[];
  total:    number;   // matches before the limit slice
  limit:    number;
  applied:  Array<{ name: string; value: string }>;
  hasQuery: boolean;  // any filter supplied at all
};

const FILTER_KEYS = ['q', 'category', 'thread', 'length', 'head', 'drive', 'material', 'grade', 'finish', 'min_price', 'max_price'];

export function searchCatalogue(raw: SearchInput): SearchOutcome {
  const get = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string).trim() : '');

  const q        = get('q').toLowerCase();
  const category = get('category').toLowerCase();
  const thread   = get('thread').toLowerCase();
  const lengthIn = get('length');
  const head     = get('head').toLowerCase();
  const drive    = get('drive').toLowerCase();
  const material = get('material').toLowerCase();
  const grade    = get('grade').toLowerCase();
  const finish   = get('finish').toLowerCase();
  const minPrice = parseFloat(get('min_price'));
  const maxPrice = parseFloat(get('max_price'));

  let limit = parseInt(get('limit'), 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = 25;
  if (limit > 100) limit = 100;

  const applied = FILTER_KEYS
    .map((k) => ({ name: k, value: get(k) }))
    .filter((a) => a.value.length > 0);
  const hasQuery = applied.length > 0;

  // length: exact "40" or range "30-60"
  let lenMin = NaN, lenMax = NaN;
  if (lengthIn) {
    const range = lengthIn.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
    if (range) { lenMin = parseFloat(range[1]); lenMax = parseFloat(range[2]); }
    else { const n = parseFloat(lengthIn); if (Number.isFinite(n)) { lenMin = lenMax = n; } }
  }

  // thread: normalise "M8" / "8" / "8 mm" → numeric where possible
  const threadNum = firstNumber(thread.replace(/^m/, ''));
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  const matches = products.filter((p) => {
    if (category && !(p.category.label.toLowerCase().includes(category) || p.category.key.includes(category))) return false;

    if (thread) {
      const ts = specValue(p, 'thread_size').toLowerCase();
      const tn = firstNumber(ts.replace(/^m/, ''));
      if (Number.isFinite(threadNum) && Number.isFinite(tn)) {
        if (threadNum !== tn) return false;
      } else if (!ts.includes(thread)) return false;
    }

    if (!Number.isNaN(lenMin)) {
      const L = firstNumber(specValue(p, 'length'));
      if (!(L >= lenMin && L <= lenMax)) return false;
    }
    if (head     && !specValue(p, 'head_type').toLowerCase().includes(head))     return false;
    if (drive    && !specValue(p, 'drive_type').toLowerCase().includes(drive))   return false;
    if (material && !specValue(p, 'material').toLowerCase().includes(material))  return false;
    if (grade    && !specValue(p, 'tensile_class').toLowerCase().includes(grade)) return false;
    if (finish   && !specValue(p, 'surface_finish').toLowerCase().includes(finish)) return false;
    if (Number.isFinite(minPrice) && p.priceEur < minPrice) return false;
    if (Number.isFinite(maxPrice) && p.priceEur > maxPrice) return false;

    if (tokens.length) {
      const hay = `${p.sku} ${p.name} ${p.category.label} ${p.specs.map((s) => s.value).join(' ')}`.toLowerCase();
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  // Cheapest first, then SKU — deterministic ordering.
  matches.sort((a, b) => a.priceEur - b.priceEur || a.sku.localeCompare(b.sku));

  return { results: matches.slice(0, limit), total: matches.length, limit, applied, hasQuery };
}
