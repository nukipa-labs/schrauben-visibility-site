import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Agent-discovery `Link` header. Emitted on every page response so an
 * agent that did just one fetch of any URL on the site can find the
 * llms.txt index without guessing paths.
 *
 * Per RFC 8288 the value is a comma-separated list of links, each one
 * angle-bracket-wrapped URI followed by semicolon-separated parameters.
 * Edge convention: target is an absolute path (relative to the request
 * origin) so the same header works whether the host is localhost or the
 * production domain.
 */
const LINK_HEADER = '</llms.txt>; rel="describedby"; type="text/markdown"';

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('Link', LINK_HEADER);
  // Pages render differently for AI-agent vs. human user agents
  // (see lib/userAgent.ts). Append to Vary so the framework's
  // own RSC/router Vary tokens stay intact while we add User-Agent —
  // setting it would lose them.
  res.headers.append('Vary', 'User-Agent');
  return res;
}

/**
 * Apply to every path except the Next internals + static asset routes
 * (saves a few CPU cycles on /_next/static/* requests).
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)']
};
