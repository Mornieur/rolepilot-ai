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
      | 'tavily_configuration'
      | 'tavily_timeout'
      | 'tavily_http'
      | 'tavily_network'
      | 'tavily_extract',
    public httpStatus?: number,
  ) {
    super('A pesquisa externa está indisponível agora.');
  }
}
