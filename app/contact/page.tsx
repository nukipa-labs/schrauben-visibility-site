import type { Metadata } from 'next';
import { company } from '../../data/company';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${company.name} — sales, technical questions, and quote requests.`
};

export default function ContactPage() {
  return (
    <article>
      <h1 style={{ fontSize: 32, margin: '0 0 16px' }}>Contact</h1>
      <p style={{ fontSize: 16, lineHeight: 1.65, maxWidth: 640 }}>
        For sales enquiries, technical questions, or volume quotes, contact our sales team directly.
      </p>
      <div className="card" style={{ marginTop: 18, maxWidth: 480 }}>
        <div style={{ marginBottom: 10 }}><strong>Email:</strong> <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a></div>
        <div style={{ marginBottom: 10 }}><strong>Phone:</strong> <a href={`tel:${company.contact.phone.replace(/\s/g, '')}`}>{company.contact.phone}</a></div>
        <div style={{ marginBottom: 10 }}>
          <strong>Address:</strong><br />
          {company.address.street}<br />
          {company.address.postal} {company.address.locality}<br />
          {company.address.country}
        </div>
      </div>
    </article>
  );
}
