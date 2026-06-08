import type { Metadata } from 'next';
import { company } from '../../../data/company';

interface PageProps { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Offer received',
  robots: { index: false, follow: false }
};

/**
 * Offer-acceptance landing — the URL the WebMCP tool puts in
 * `accept_url`. Intentionally minimal: this is a fixture, not a real
 * commerce stack. A production version would look up the offer by id,
 * present a binding "accept" button, and create a sales-order record.
 */
export default async function OfferLanding({ params }: PageProps) {
  const { id } = await params;
  return (
    <article style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 12px' }}>Offer {id}</h1>
      <div className="card">
        <p style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.6 }}>
          Thanks for selecting this offer. Our sales team will be in touch
          within one business day to confirm the order and pickup an
          accepted purchase order from your side.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#5a5a5a' }}>
          Any questions in the meantime: <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
        </p>
      </div>
    </article>
  );
}
