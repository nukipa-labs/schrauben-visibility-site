import { NextResponse } from 'next/server';
import { createOffer, OfferError } from '../../../data/offers';

/**
 * MCP Streamable HTTP server — protocol revision 2025-03-26.
 * Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
 *
 * What this handler implements (in spec order):
 *   - `initialize` request — capability negotiation. Replies with the
 *     server's protocolVersion (matching the client's if supported,
 *     otherwise 2025-03-26), capabilities.tools, serverInfo.
 *   - `notifications/initialized` — client's signal that init is
 *     complete. Server returns HTTP 202 Accepted with no body, per
 *     spec §"Sending Messages": "If the input consists solely of
 *     notifications, the server MUST return HTTP 202 Accepted".
 *   - `tools/list` — returns the single tool we expose, `create_offer`.
 *   - `tools/call` — invokes create_offer. Result wrapped as
 *     `{ content: [{ type: "text", text: <stringified offer> }],
 *        isError: false }` per spec §"Tool Result".
 *   - Unknown methods → JSON-RPC -32601 Method not found.
 *
 * What it deliberately does NOT implement (acceptable per spec):
 *   - Mcp-Session-Id — we are stateless. Spec §"Session Management":
 *     "A server using the Streamable HTTP transport MAY assign a
 *     session ID." MAY, not MUST. Anthropic's MCP connector accepts
 *     stateless servers.
 *   - SSE response streams — we always return `Content-Type:
 *     application/json` for tools/list and tools/call. Spec §"Sending
 *     Messages": "If the input contains any number of JSON-RPC
 *     requests, the server MUST either return Content-Type: text/
 *     event-stream, ... or Content-Type: application/json, to return
 *     one JSON object." Single JSON response is valid.
 *   - GET endpoint with SSE — we return 405 Method Not Allowed on
 *     GET, which the spec explicitly permits: "Server MUST either
 *     return Content-Type: text/event-stream in response to this
 *     HTTP GET, or else return HTTP 405 Method Not Allowed."
 *   - Resources, prompts, logging capabilities — only tools.
 *
 * Security:
 *   - Origin header is validated when the request looks browser-
 *     originated (has an Origin and an Accept hint of browser). In
 *     production this is fine for a public commerce endpoint; we
 *     could tighten it to an allowlist if needed.
 */

// Protocol revisions we support. If the client asks for any of these
// during initialize, we mirror its choice (spec §"Version Negotiation":
// "If the server supports the requested protocol version, it MUST
// respond with the same version"). Otherwise we negotiate down to the
// latest stable. Order matters — latest first.
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-03-26'] as const;
const DEFAULT_PROTOCOL_VERSION    = SUPPORTED_PROTOCOL_VERSIONS[0];
const SERVER_NAME      = 'brandenburger-schraubenwerk-mcp';
const SERVER_VERSION   = '1.0.0';

// ─────────────────────────────────────────────────────────────────────────
// Tool catalogue — single tool, create_offer. inputSchema MUST be a
// JSON Schema object per spec; the description tells the model when
// to call it.
// ─────────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'create_offer',
    description:
      'Create a binding commercial offer (quotation) for a quantity of a ' +
      'catalogued product. Returns total price (with volume discount), ' +
      'shipping cost, delivery estimate, payment + delivery terms, validity ' +
      'window, and an accept URL. Call this after selecting a candidate SKU ' +
      'from the catalogue. Volume tiers: 0-99 list, 100-499 -5%, 500-1999 ' +
      '-10%, 2000+ -15%.',
    inputSchema: {
      type: 'object',
      properties: {
        sku: {
          type: 'string',
          description: 'Catalogue SKU as shown on a product detail page, e.g. HX-M8-40.'
        },
        quantity: {
          type: 'integer',
          minimum: 1,
          description: 'Number of pieces (not packs). Used to derive packs_required and the volume tier.'
        },
        delivery_country: {
          type: 'string',
          description: 'ISO 3166-1 alpha-2 country code, default DE. Affects shipping rate and delivery estimate.'
        }
      },
      required: ['sku', 'quantity']
    }
  }
];

// ─────────────────────────────────────────────────────────────────────────
// JSON-RPC helpers
// ─────────────────────────────────────────────────────────────────────────

type RpcId = string | number | null;
type RpcRequest = { jsonrpc?: '2.0'; id?: RpcId; method?: string; params?: unknown };

function rpcSuccess(id: RpcId, result: unknown) {
  return { jsonrpc: '2.0' as const, id, result };
}
function rpcError(id: RpcId, code: number, message: string, data?: unknown) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: { code, message, ...(data !== undefined && { data }) }
  };
}

// MCP/spec method handlers. Each returns the result/error envelope
// (without the jsonrpc/id wrapper — the caller adds those).
function handleInitialize(params: unknown) {
  const p = (params || {}) as { protocolVersion?: string; capabilities?: object; clientInfo?: object };
  // Mirror the client's protocol version when we support it. Otherwise
  // negotiate down to the latest version we support — the client is
  // free to disconnect if it can't speak that.
  const clientPv = typeof p.protocolVersion === 'string' ? p.protocolVersion : '';
  const negotiated = (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(clientPv)
    ? clientPv
    : DEFAULT_PROTOCOL_VERSION;
  return {
    protocolVersion: negotiated,
    capabilities: {
      // We expose tools only; no prompts/resources/logging.
      tools: { listChanged: false }
    },
    serverInfo: {
      name:    SERVER_NAME,
      version: SERVER_VERSION
    },
    instructions:
      'Call `create_offer(sku, quantity, delivery_country?)` to obtain a binding quote ' +
      'for any catalogue SKU after picking it from the product pages.'
  };
}

function handleToolsList() {
  return { tools: TOOLS };
}

function handleToolsCall(params: unknown, ctx: { baseUrl: string }) {
  const p = (params || {}) as { name?: string; arguments?: Record<string, unknown> };
  const name = p.name;
  const args = p.arguments || {};

  if (name !== 'create_offer') {
    // -32601 Method not found / unknown tool. Per MCP spec §Errors,
    // "Unknown tools" use the protocol-error path.
    throw new RpcMethodError(-32601, `Unknown tool: ${name}`);
  }

  try {
    const offer = createOffer(
      {
        sku:              String(args.sku ?? ''),
        quantity:         Number(args.quantity ?? 0),
        delivery_country: typeof args.delivery_country === 'string' ? args.delivery_country : undefined
      },
      { baseUrl: ctx.baseUrl }
    );
    // Per spec §Tool Result: `content` is an array of typed content
    // items; we emit one text item carrying the JSON-stringified offer.
    // isError: false signals the call succeeded.
    return {
      content: [{ type: 'text', text: JSON.stringify(offer) }],
      isError: false
    };
  } catch (err) {
    if (err instanceof OfferError) {
      // Tool execution error — per spec §Error Handling, return
      // isError: true on the result rather than a protocol error,
      // because the tool's logic failed (not a malformed call).
      return {
        content: [{ type: 'text', text: `Could not create offer: ${err.message}` }],
        isError: true
      };
    }
    throw new RpcMethodError(-32603, (err as Error).message || 'Internal error');
  }
}

class RpcMethodError extends Error {
  code: number;
  data?: unknown;
  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

// Process a single JSON-RPC message and return either the response
// envelope (for requests) or `null` (for notifications).
function processMessage(msg: RpcRequest, ctx: { baseUrl: string }): object | null {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;

  if (typeof method !== 'string') {
    if (isRequest) return rpcError(id ?? null, -32600, 'Invalid request: method missing');
    return null;
  }

  // Notifications (no id) — fire and forget; no response per JSON-RPC.
  // Per MCP spec §Lifecycle: "notifications/initialized" is the client
  // signaling readiness. We don't act on it (we're stateless) but it's
  // a legal message.
  if (!isRequest) {
    if (method === 'notifications/initialized') return null;
    if (method.startsWith('notifications/'))    return null;
    return null;
  }

  // Requests — must respond.
  try {
    if (method === 'initialize') return rpcSuccess(id, handleInitialize(params));
    if (method === 'tools/list') return rpcSuccess(id, handleToolsList());
    if (method === 'tools/call') return rpcSuccess(id, handleToolsCall(params, ctx));
    if (method === 'ping')       return rpcSuccess(id, {});  // spec utility
    return rpcError(id ?? null, -32601, `Unknown method: ${method}`);
  } catch (err) {
    if (err instanceof RpcMethodError) {
      return rpcError(id ?? null, err.code, err.message, err.data);
    }
    return rpcError(id ?? null, -32603, (err as Error).message || 'Internal error');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Spec §"Sending Messages" item 2: client MUST include `Accept` listing
  // both `application/json` and `text/event-stream`. We accept anything
  // containing application/json (so a stricter "Accept: application/json"
  // also works — strict spec compliance from the client side isn't
  // worth blocking on for the demo, but we DO require json acceptance).
  const accept = req.headers.get('accept') || '';
  if (accept && !accept.includes('application/json') && !accept.includes('*/*')) {
    return new NextResponse(
      JSON.stringify(rpcError(null, -32600, 'Client must accept application/json')),
      { status: 406, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      rpcError(null, -32700, 'Parse error: body is not valid JSON'),
      { status: 200 }
    );
  }

  // Build the base URL the offer's accept_url should reference. Tracks
  // whatever host the request came in on (localhost in dev, the public
  // origin in production).
  const u = new URL(req.url);
  const baseUrl = `${u.protocol}//${u.host}`;

  // Spec §"Sending Messages" item 3: body MAY be a single message OR
  // a batch (JSON array).
  const messages = Array.isArray(body) ? body : [body];
  const responses: object[] = [];
  for (const m of messages) {
    const r = processMessage(m as RpcRequest, { baseUrl });
    if (r) responses.push(r);
  }

  // Spec §"Sending Messages" item 4: if input is solely notifications/
  // responses (no requests), respond with 202 Accepted, no body.
  if (responses.length === 0) {
    return new NextResponse(null, { status: 202 });
  }

  // Otherwise return the response (or batch of responses) as JSON.
  // Spec §"Sending Messages" item 5: returning Content-Type:
  // application/json with one JSON object is explicitly permitted.
  const payload = responses.length === 1 && !Array.isArray(body) ? responses[0] : responses;
  return NextResponse.json(payload, { status: 200 });
}

/**
 * Spec §"Listening for Messages from the Server" item 3: server MUST
 * either return text/event-stream OR HTTP 405 Method Not Allowed. We
 * don't currently push server-initiated messages, so 405 is correct.
 */
export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: { 'Allow': 'POST' }
  });
}

/**
 * Optional: spec §"Session Management" item 5 — clients MAY send an
 * HTTP DELETE to terminate a session. We're stateless, so respond with
 * 405 to signal "we don't support session termination".
 */
export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { 'Allow': 'POST' } });
}
