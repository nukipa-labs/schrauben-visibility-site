import { headers } from 'next/headers';

/**
 * Substrings (case-insensitive) that mark a request as coming from
 * an LLM agent rather than a browser. Mostly the active "user-driven"
 * agents that fetch on behalf of a chat user; some training/search
 * crawlers are included too — for this demo they're effectively the
 * same audience, and showing them the programmatic-interface story
 * isn't a problem.
 *
 * If a UA isn't on this list we render the normal human view; we
 * favour false negatives over false positives so a real human in a
 * weird browser never ends up locked out of the catalogue's human
 * affordances.
 */
const AGENT_UA_FRAGMENTS = [
  // Active per-request user agents
  'claude-user',          // Claude.ai web_fetch tool
  'chatgpt-user',         // ChatGPT browsing tool
  'oai-searchbot',        // ChatGPT search
  'perplexity-user',      // Perplexity per-question fetch
  // Crawlers / training bots — included so they see the same
  // programmatic-first story; this also keeps the .example sales
  // email out of any AI-index ingestion.
  'gptbot',               // OpenAI training crawler
  'perplexitybot',
  'bytespider',           // ByteDance / TikTok
  'meta-externalagent',
  'meta-externalfetcher',
  'applebot-extended',
  'cohere-ai',
  'anthropic-ai',         // legacy Anthropic crawler
  'claude-web'            // legacy Claude.ai crawler
];

/**
 * Server-side: does this request look like an AI agent?
 *
 * Calling this from a Server Component / Layout opts the page into
 * dynamic rendering (per-request), which is what we want — the same
 * URL needs to produce different bodies for agents vs. humans. The
 * `Vary: User-Agent` header set in middleware.ts tells caches the
 * same.
 */
export async function isAgent(): Promise<boolean> {
  const h = await headers();
  const ua = (h.get('user-agent') || '').toLowerCase();
  if (!ua) return false;
  return AGENT_UA_FRAGMENTS.some((f) => ua.includes(f));
}
