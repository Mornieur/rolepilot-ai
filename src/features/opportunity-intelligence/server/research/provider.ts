import 'server-only';
export type ResearchSearchResult = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  score: number | null;
  publishedAt: string | null;
};
export type ResearchExtractedSource = {
  url: string;
  text: string;
  title: string | null;
  publishedAt: string | null;
};
export type ResearchSearchOptions = { maxResults: number; domains?: string[] };
export interface OpportunityResearchProvider {
  search(query: string, options: ResearchSearchOptions): Promise<ResearchSearchResult[]>;
  extract(urls: string[]): Promise<ResearchExtractedSource[]>;
}
export class ResearchProviderError extends Error {
  constructor(
    public classification:
      | 'research_configuration'
      | 'search_timeout'
      | 'search_rate_limit'
      | 'search_unavailable'
      | 'source_extract_failure',
  ) {
    super('A pesquisa externa está indisponível agora.');
  }
}
