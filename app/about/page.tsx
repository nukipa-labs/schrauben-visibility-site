import type { Metadata } from 'next';
import { company } from '../../data/company';

export const metadata: Metadata = {
  title: 'About',
  description: 'Brandenburger Schraubenwerk GmbH — family-owned screw manufacturer in Brandenburg an der Havel since 1962.'
};

export default function AboutPage() {
  return (
    <article>
      <h1 style={{ fontSize: 32, margin: '0 0 16px' }}>About {company.shortName}</h1>
      <p style={{ fontSize: 17, lineHeight: 1.65, maxWidth: 720 }}>
        {company.description}
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.65, maxWidth: 720, color: '#5a5a5a', marginTop: 16 }}>
        We hold DIN 933 / ISO 4017 / DIN 912 / ETA-Option-1 conformity certificates.
        Our facility runs a calibrated metrology lab; per-batch certificates of conformity
        are available on request for every order.
      </p>
      <h2 style={{ fontSize: 22, margin: '32px 0 10px' }}>Facts</h2>
      <ul style={{ fontSize: 15, lineHeight: 1.7 }}>
        <li>Founded {company.founded}, family-owned across three generations.</li>
        <li>Production site: {company.address.street}, {company.address.postal} {company.address.locality}, {company.address.country}.</li>
        <li>Catalogue: 14+ active SKUs across 5 product families.</li>
        <li>Standards: DIN 84, DIN 912, DIN 933, DIN 7981, DIN 7985, ISO 4017, ISO 4762, ISO 7045, ISO 1207.</li>
      </ul>
    </article>
  );
}
