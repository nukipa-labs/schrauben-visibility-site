import { NextResponse } from 'next/server';
import { createOffer, OfferError } from '../../../data/offers';

/**
 * WebMCP endpoint — JSON-RPC 2.0 over HTTP POST.
 *
 * Supported methods:
 *   - tools/list  → returns the tool catalogue
 *   - tools/call  → invokes a named tool with arguments
 *
 * Currently exposes a single tool, `create_offer`. The result envelope
 * follows the MCP spec: `result.content` is an array of typed parts,
 * with a single text part carrying the JSON-stringified offer. The
 * supplier audit's `request_offer` tool parses that out.
 *
 * Errors use JSON-RPC error codes:
 *   -32600 invalid request, -32601 unknown method,
 *   -32602 invalid params, -32603 internal error.
 */

type RpcRequest = {
  jsonrpc?: '2.0';
  id?:      string | number | null;
  method?:  string;
  params?:  unknown;
};

function rpcError(id: RpcRequest['id'], code: number, message: string, data?: unknown) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id:      id ?? null,
    error:   { code, message, ...(data !== undefined && { data }) }
  }, { status: 200 });
}

function rpcResult(id: RpcRequest['id'], result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result }, { status: 200 });
}

const TOOLS = [
  {
    name: 'create_offer',
    description: 'Create a binding offer / quotation for a quantity of a catalogued product. Returns total price (with volume discount), delivery estimate, payment terms, and validity window.',
    inputSchema: {
      type: 'object',
      required: ['sku', 'quantity'],
      properties: {
        sku:              { type: 'string',  description: 'Catalogue SKU, e.g. HX-M8-40' },
        quantity:         { type: 'integer', minimum: 1, description: 'Pieces (not packs). Volume tiers 100/500/2000.' },
        delivery_country: { type: 'string',  description: 'ISO 3166 country, default DE.' }
      }
    }
  }
];

export async function POST(req: Request) {
  let body: RpcRequest;
  try {
    body = await req.json();
  } catch {
    return rpcError(null, -32700, 'Parse error: body is not valid JSON');
  }

  const { id, method, params } = body;
  if (typeof method !== 'string') return rpcError(id, -32600, 'Invalid request: method missing');

  if (method === 'tools/list') {
    return rpcResult(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const p = params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    const name = p?.name;
    const args = p?.arguments || {};
    if (name !== 'create_offer') return rpcError(id, -32601, `Unknown tool: ${name}`);

    try {
      const offer = createOffer({
        sku:              String(args.sku ?? ''),
        quantity:         Number(args.quantity ?? 0),
        delivery_country: typeof args.delivery_country === 'string' ? args.delivery_country : undefined
      });
      // MCP spec: tool results are wrapped as `content: [{type: "text"|"json", ...}]`.
      // We emit one text part with the JSON-stringified offer — every MCP
      // client (incl. our audit's request_offer executor) decodes that.
      return rpcResult(id, {
        content: [
          { type: 'text', text: JSON.stringify(offer) }
        ],
        // Mirror the structured offer on the envelope too so clients that
        // prefer not to re-parse the text part can pick it up directly.
        // Non-spec but harmless — MCP clients are required to tolerate
        // extra fields.
        structured: offer
      });
    } catch (err) {
      if (err instanceof OfferError) {
        return rpcError(id, -32602, err.message, { code: err.code });
      }
      return rpcError(id, -32603, (err as Error).message || 'Internal error');
    }
  }

  return rpcError(id, -32601, `Unknown method: ${method}`);
}

/**
 * GET on /api/mcp returns the tool catalogue as a convenience for
 * humans inspecting the endpoint in a browser. Agents use POST.
 */
export async function GET() {
  return NextResponse.json({
    name: 'Brandenburger Schraubenwerk MCP',
    transport: 'http',
    endpoint: '/api/mcp',
    tools: TOOLS,
    hint: 'POST a JSON-RPC 2.0 request with method=tools/call to invoke a tool.'
  });
}
