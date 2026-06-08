/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use SVG placeholders served as static assets — no remote image
  // optimisation needed; the audit only reads alt text + URLs.
  images: { unoptimized: true }
};

module.exports = nextConfig;
