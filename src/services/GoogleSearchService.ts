import { SearchResult } from '@/types/autonomy';

const SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

export class GoogleSearchService {
  private apiKey: string | undefined;
  private cx: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.cx = process.env.GOOGLE_SEARCH_CX; // Search Engine ID
  }

  /**
   * Performs a Google Search to find documentation or solutions.
   * Falls back to returning a "Simulated" result if no keys are present (for dev/demo).
   */
  async search(query: string, numResults: number = 5): Promise<SearchResult[]> {
    // 1. Check for keys
    if (!this.apiKey || !this.cx) {
      console.warn('Google Search API keys missing. Returning simulated results or failing.');
      return this.mockSearch(query);
    }

    try {
      // 2. Execute fetch
      const url = `${SEARCH_URL}?key=${this.apiKey}&cx=${this.cx}&q=${encodeURIComponent(query)}&num=${numResults}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Google Search API Error: ${response.status} ${err}`);
      }

      const data = await response.json();

      // 3. Map results
      if (!data.items) return [];

      return data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to mock if API fails/quota exceeded
      return this.mockSearch(query);
    }
  }

  /**
   * Mock search for when keys are missing. 
   * In a real autonomous loop, this is where we might ask the LLM to "hallucinate" 
   * a best-guess answer or tell the user to provide config.
   */
  private mockSearch(query: string): SearchResult[] {
    console.log(`[MOCK SEARCH] Query: "${query}"`);
    
    // Simple heuristic mocks for testing
    if (query.toLowerCase().includes('react')) {
      return [
        {
          title: 'React Documentation',
          link: 'https://react.dev',
          snippet: 'The library for web and native user interfaces.',
        },
        {
          title: 'React Hooks API',
          link: 'https://react.dev/reference/react',
          snippet: 'Reference documentation for built-in React Hooks.',
        }
      ];
    }
    
    return [
      {
        title: `Documentation for ${query}`,
        link: 'https://example.com/docs',
        snippet: `This is a simulated search result for "${query}". Please configure GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX to get real results.`,
      }
    ];
  }
}

export const googleSearchService = new GoogleSearchService();
