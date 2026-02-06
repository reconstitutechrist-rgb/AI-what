/**
 * Tavily Search Service
 *
 * A simple, agent-optimized web search provider.
 * Requires only a single API key (TAVILY_API_KEY).
 *
 * Tavily returns LLM-friendly results out of the box —
 * no Custom Search Engine ID, no cloud console setup.
 *
 * Docs: https://docs.tavily.com/documentation/api-reference/endpoint/search
 */

import { SearchResult } from '@/types/autonomy';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

export class TavilySearchService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
  }

  /**
   * Performs a web search via the Tavily API.
   * Returns results in the same SearchResult shape used across the codebase.
   */
  async search(query: string, numResults: number = 5): Promise<SearchResult[]> {
    if (!this.apiKey) {
      console.warn(
        '[TavilySearch] TAVILY_API_KEY is not set. Returning empty results. ' +
        'Get a free key at https://tavily.com'
      );
      return [];
    }

    try {
      const response = await fetch(TAVILY_SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          api_key: this.apiKey,
          max_results: numResults,
          search_depth: 'basic',         // 'basic' is fast; 'advanced' is deeper
          include_answer: false,          // We just need the result links/snippets
          include_raw_content: false,     // Keep payload small
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Tavily API Error: ${response.status} ${errText}`);
      }

      const data = await response.json();

      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((item: { title?: string; url?: string; content?: string }) => ({
        title: item.title || 'Untitled',
        link: item.url || '',
        snippet: item.content || '',
      }));

    } catch (error) {
      console.error('[TavilySearch] Search failed:', error);
      return [];
    }
  }
}

export const tavilySearchService = new TavilySearchService();
