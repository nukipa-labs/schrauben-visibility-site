import Link from 'next/link';
import { company } from '../data/company';

/**
 * Top navigation. The audit's buying agent looks for a clear path
 * from the homepage to a products list — the "Products" link below
 * is the one it follows.
 */
export function Nav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 24px', borderBottom: '1px solid #e5e5e5',
      maxWidth: 1100, margin: '0 auto'
    }}>
      <Link href="/" style={{ fontWeight: 700, color: '#001D21', textDecoration: 'none', fontSize: 18 }}>
        {company.shortName}
      </Link>
      <div style={{ display: 'flex', gap: 24 }}>
        <Link href="/search"   style={navLink}>Search</Link>
        <Link href="/products" style={navLink}>Products</Link>
        <Link href="/about"    style={navLink}>About</Link>
        <Link href="/contact"  style={navLink}>Contact</Link>
      </div>
    </nav>
  );
}

const navLink = {
  color: '#001D21', textDecoration: 'none', fontSize: 15, fontWeight: 500
};
