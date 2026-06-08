import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Agent-discovery `Link` header. Emitted on every page response so an
 * agent that did just one fetch of any URL on the site (typically the
 * homepage) can find every discovery surface without guessing paths:
 *
 *   - mcp           → the MCP server-card (and from it the JSON-RPC endpoint)
 *   - describedby   → llms.txt — Markdown index written for LLMs
 *   - service-desc  → MCP card duplicated under the OpenAPI-style rel
 *     for clients that look for that one specifically
 *
 * Per RFC 8288 the value is a comma-separated list of links, each one
 * angle-bracket-wrapped URI followed by semicolon-separated parameters.
 * Edge convention: targets are absolute paths (relative to the request
 * origin) so the same header works whether the host is localhost or the
 * production domain.
 */
const LINK_HEADER = [
  '</.well-known/mcp/server-card.json>; rel="mcp"; type="application/json"',
  '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
  '</llms.txt>; rel="describedby"; type="text/markdown"'
].join(', ');

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('Link', LINK_HEADER);
  return res;
}

/**
 * Apply to every path except the Next internals + static asset routes
 * (saves a few CPU cycles on /_next/static/* requests).
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)']
};
