import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { tavilyResearchProvider } from './tavily';

describe('Tavily research adapter configuration boundary', () => {
  const original = process.env.TAVILY_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = original;
    vi.restoreAllMocks();
  });
  it('stops before fetch and logs a safe stage when the key is missing', async () => {
    delete process.env.TAVILY_API_KEY;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(tavilyResearchProvider.search('Acme', { maxResults: 1 })).rejects.toMatchObject({
      classification: 'research_configuration',
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith(
      'Opportunity research failed: stage=tavily_search classification=research_configuration',
    );
  });
});
