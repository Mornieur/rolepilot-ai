import 'server-only';
import type {
  OpportunityResearchProvider,
  ResearchExtractedSource,
  ResearchSearchOptions,
  ResearchSearchResult,
} from './provider';
import { ResearchProviderError } from './provider';
const apiBase = 'https://api.tavily.com';
function domain(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}
function classify(error: unknown, extraction = false): ResearchProviderError {
  if (error instanceof DOMException && error.name === 'TimeoutError')
    return new ResearchProviderError('search_timeout');
  if (
    typeof error === 'object' &&
    error &&
    'status' in error &&
    (error as { status?: number }).status === 429
  )
    return new ResearchProviderError('search_rate_limit');
  return new ResearchProviderError(extraction ? 'source_extract_failure' : 'search_unavailable');
}
async function request(path: string, body: Record<string, unknown>, extraction = false) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn(
      `Opportunity research failed: stage=tavily_${extraction ? 'extract' : 'search'} classification=research_configuration`,
    );
    throw new ResearchProviderError('research_configuration');
  }
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const error = Object.assign(new Error('provider'), { status: response.status });
      throw error;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    throw classify(error, extraction);
  }
}
export const tavilyResearchProvider: OpportunityResearchProvider = {
  async search(query: string, options: ResearchSearchOptions): Promise<ResearchSearchResult[]> {
    const json = await request('/search', {
      query,
      max_results: Math.min(5, Math.max(1, options.maxResults)),
      include_answer: false,
      include_raw_content: false,
      ...(options.domains?.length ? { include_domains: options.domains.slice(0, 5) } : {}),
    });
    const results = Array.isArray(json.results) ? json.results : [];
    return results.flatMap((value): ResearchSearchResult[] => {
      if (!value || typeof value !== 'object') return [];
      const row = value as Record<string, unknown>;
      const url = typeof row.url === 'string' ? row.url : '';
      const host = domain(url);
      if (!url || !host) return [];
      return [
        {
          title: typeof row.title === 'string' ? row.title.slice(0, 300) : host,
          url,
          domain: host,
          snippet: typeof row.content === 'string' ? row.content.slice(0, 2400) : '',
          score: typeof row.score === 'number' ? row.score : null,
          publishedAt: typeof row.published_date === 'string' ? row.published_date : null,
        },
      ];
    });
  },
  async extract(urls: string[]): Promise<ResearchExtractedSource[]> {
    if (!urls.length) return [];
    const json = await request(
      '/extract',
      { urls: [...new Set(urls)].slice(0, 10), extract_depth: 'basic' },
      true,
    );
    const results = Array.isArray(json.results) ? json.results : [];
    return results.flatMap((value): ResearchExtractedSource[] => {
      if (!value || typeof value !== 'object') return [];
      const row = value as Record<string, unknown>;
      return typeof row.url === 'string' && typeof row.raw_content === 'string'
        ? [
            {
              url: row.url,
              text: row.raw_content,
              title: typeof row.title === 'string' ? row.title : null,
              publishedAt: typeof row.published_date === 'string' ? row.published_date : null,
            },
          ]
        : [];
    });
  },
};
