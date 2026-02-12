/**
 * Tech Scout Service — The AI Research Agent
 *
 * Runs AFTER the Vision Board produces a plan and BEFORE the Titan Pipeline
 * starts building. Performs live web research to determine:
 *
 *   1. What AI models are best for the project's needs
 *   2. What frameworks/libraries are current and optimal
 *   3. What new capabilities exist that the plan should leverage
 *   4. What technologies are deprecated or outdated
 *
 * Uses Gemini 3 Pro for analysis + Tavily for live web search.
 * Falls back to LLM-only analysis if no search API key is available.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { tavilySearchService } from '@/services/TavilySearchService';
import { getGeminiApiKey, GEMINI_PRO_MODEL } from '@/services/titanPipeline/config';
import type { TechDossier, TechRecommendation } from '@/types/titanPipeline';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Maximum time for the entire scout process (ms) */
const SCOUT_TIMEOUT_MS = 30_000; // 30 seconds

/** Maximum number of parallel search queries to run */
const MAX_SEARCH_QUERIES = 6;

/** Maximum results per search query */
const RESULTS_PER_QUERY = 3;

// ============================================================================
// PROMPTS
// ============================================================================

const QUERY_EXTRACTION_PROMPT = `### Role
You are the **Tech Scout Query Generator** — an expert at identifying what technology research is needed for a software project.

### Input
You will receive a project description / build instructions.

### Task
Generate ${MAX_SEARCH_QUERIES} focused search queries to research the optimal technology stack for this project. Queries should cover:

1. **AI Models**: Which AI models (GPT, Claude, Gemini, Llama, Mistral, etc.) are best for the project's AI features. Query for comparison articles and benchmarks.
2. **Frameworks**: What frontend/backend frameworks are current, stable, and best for the described features. Query for "best X framework 2026" or "[framework] vs [framework] 2026".
3. **Libraries**: What specific libraries or packages handle the described features. Query for key npm/pip packages, their latest versions, and alternatives.
4. **APIs & Services**: What third-party APIs or cloud services would power the described features.
5. **Emerging**: Any new browser APIs, language features, or tools that could give this project an edge.
6. **Deprecations**: Check if any commonly-assumed technology is deprecated or has been replaced.

### Output Schema (JSON)
{
  "queries": [
    "best AI model for real-time chat 2026 comparison benchmark",
    "Next.js vs Remix vs Astro 2026 comparison production",
    "latest stable React version 2026 breaking changes",
    "stripe vs lemon squeezy payment processing 2026",
    "web push notification API browser support 2026",
    "deprecated npm packages alternatives 2026"
  ]
}

IMPORTANT: Return ONLY the JSON. No explanation. No markdown fences. The queries should be specific to the project described, not generic.`;

const SYNTHESIS_PROMPT = `### Role
You are the **Tech Scout Analyst** — an expert at evaluating technology options for software projects. You base your recommendations on CURRENT, VERIFIED information from web research, not on training data alone.

### Input
1. **Project Description**: What the user wants to build
2. **Search Results**: Live web research results about current technologies

### Task
Analyze the search results and produce a structured technology dossier. For each recommendation:
- Cite specific findings from the search results
- Verify version numbers against the search results (do NOT guess)
- Flag anything that appears deprecated or outdated
- Provide confidence levels: "high" (directly verified in search results), "medium" (inferred from multiple signals), "low" (based on training data, not verified)

### Output Schema (JSON)
{
  "aiModels": [
    {
      "name": "Model Name",
      "category": "ai-model",
      "recommendation": "Why this model is recommended for this project's needs, citing search findings",
      "latestVersion": "version if found",
      "alternatives": ["Alt Model 1", "Alt Model 2"],
      "confidence": "high"
    }
  ],
  "frameworks": [
    {
      "name": "Framework Name",
      "category": "framework",
      "recommendation": "Why this framework, citing search findings",
      "latestVersion": "version if found",
      "alternatives": ["Alt 1"],
      "confidence": "high"
    }
  ],
  "emergingCapabilities": [
    "Description of new capability or API that could benefit this project"
  ],
  "deprecationWarnings": [
    "Warning about deprecated tech that the project description might assume is current"
  ]
}

IMPORTANT:
- Return ONLY valid JSON. No explanation. No markdown fences.
- Every recommendation MUST cite evidence from the search results.
- If search results are empty or unavailable, set confidence to "low" and note this.
- Prefer STABLE releases over bleeding-edge beta versions.
- Include at least 2 AI model recommendations and 3 framework/library recommendations.`;

// ============================================================================
// SERVICE
// ============================================================================

export class TechScoutService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = getGeminiApiKey();
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Run the Tech Scout — research optimal technology for a project.
   *
   * @param instructions — The build instructions or flattened VisionDocument
   * @returns A structured TechDossier with verified recommendations
   */
  async scout(instructions: string): Promise<TechDossier> {
    const scoutStart = Date.now();
    console.log('[TechScout] Starting technology research...');

    try {
      // Race the entire scout against a timeout
      const result = await Promise.race([
        this._runResearch(instructions),
        this._timeout(),
      ]);

      const elapsed = Date.now() - scoutStart;
      console.log(
        `[TechScout] Research complete in ${elapsed}ms. ` +
        `AI models: ${result.aiModels.length}, ` +
        `Frameworks: ${result.frameworks.length}, ` +
        `Sources: ${result.sources.length}`
      );

      return result;
    } catch (error) {
      console.error('[TechScout] Research failed, returning empty dossier:', error);
      return this._emptyDossier();
    }
  }

  /**
   * Core research pipeline:
   * 1. Extract search queries from instructions
   * 2. Run parallel web searches
   * 3. Synthesize results into a TechDossier
   */
  private async _runResearch(instructions: string): Promise<TechDossier> {
    const model = this.genAI.getGenerativeModel({
      model: GEMINI_PRO_MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });

    // Step 1: Extract search queries
    console.log('[TechScout] Step 1/3: Extracting research queries...');
    const queryPrompt = `${QUERY_EXTRACTION_PROMPT}\n\n### Project Description\n${instructions}`;

    const queryResult = await withGeminiRetry(() => model.generateContent(queryPrompt));
    const queryText = queryResult.response.text();

    let queries: string[];
    try {
      const parsed = JSON.parse(queryText);
      queries = (parsed.queries || []).slice(0, MAX_SEARCH_QUERIES);
    } catch {
      console.warn('[TechScout] Query extraction failed, using fallback queries');
      queries = this._fallbackQueries(instructions);
    }

    console.log(`[TechScout] Generated ${queries.length} research queries`);

    // Step 2: Run parallel web searches
    console.log('[TechScout] Step 2/3: Searching the web...');
    const allResults: Array<{ query: string; results: Array<{ title: string; snippet: string; link: string }> }> = [];
    const sources: string[] = [];

    const searchPromises = queries.map(async (query) => {
      try {
        const results = await tavilySearchService.search(query, RESULTS_PER_QUERY);
        allResults.push({ query, results });
        results.forEach((r) => {
          if (r.link && !sources.includes(r.link)) {
            sources.push(r.link);
          }
        });
      } catch (e) {
        console.warn(`[TechScout] Search failed for query "${query}":`, e);
        allResults.push({ query, results: [] });
      }
    });

    await Promise.all(searchPromises);

    const totalResults = allResults.reduce((sum, r) => sum + r.results.length, 0);
    console.log(`[TechScout] Found ${totalResults} results across ${queries.length} queries`);

    // Step 3: Synthesize into a TechDossier
    console.log('[TechScout] Step 3/3: Synthesizing technology recommendations...');

    const searchContext = allResults
      .map(({ query, results }) => {
        const resultText = results.length > 0
          ? results.map((r) => `  - [${r.title}](${r.link}): ${r.snippet}`).join('\n')
          : '  (no results found)';
        return `Query: "${query}"\n${resultText}`;
      })
      .join('\n\n');

    const synthesisPrompt = `${SYNTHESIS_PROMPT}\n\n### Project Description\n${instructions}\n\n### Search Results\n${searchContext}`;

    const synthesisResult = await withGeminiRetry(() => model.generateContent(synthesisPrompt));
    const synthesisText = synthesisResult.response.text();

    try {
      const dossier = JSON.parse(synthesisText);

      return {
        aiModels: this._validateRecommendations(dossier.aiModels || []),
        frameworks: this._validateRecommendations(dossier.frameworks || []),
        emergingCapabilities: Array.isArray(dossier.emergingCapabilities)
          ? dossier.emergingCapabilities
          : [],
        deprecationWarnings: Array.isArray(dossier.deprecationWarnings)
          ? dossier.deprecationWarnings
          : [],
        sources,
        researchedAt: new Date().toISOString(),
      };
    } catch {
      console.warn('[TechScout] Synthesis parse failed, returning partial dossier');
      return {
        ...this._emptyDossier(),
        sources,
        researchedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate and normalize recommendations from the LLM output.
   */
  private _validateRecommendations(recs: unknown[]): TechRecommendation[] {
    if (!Array.isArray(recs)) return [];

    return recs
      .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map((r) => ({
        name: String(r.name || 'Unknown'),
        category: this._validateCategory(r.category),
        recommendation: String(r.recommendation || ''),
        latestVersion: r.latestVersion ? String(r.latestVersion) : undefined,
        alternatives: Array.isArray(r.alternatives)
          ? r.alternatives.map(String)
          : undefined,
        confidence: this._validateConfidence(r.confidence),
      }));
  }

  private _validateCategory(cat: unknown): TechRecommendation['category'] {
    const valid = ['ai-model', 'framework', 'library', 'api', 'service'] as const;
    if (typeof cat === 'string' && valid.includes(cat as typeof valid[number])) {
      return cat as TechRecommendation['category'];
    }
    return 'library';
  }

  private _validateConfidence(conf: unknown): TechRecommendation['confidence'] {
    const valid = ['high', 'medium', 'low'] as const;
    if (typeof conf === 'string' && valid.includes(conf as typeof valid[number])) {
      return conf as TechRecommendation['confidence'];
    }
    return 'medium';
  }

  /**
   * Fallback queries if Gemini can't parse the instructions.
   */
  private _fallbackQueries(instructions: string): string[] {
    const keywords = instructions.toLowerCase().split(/\s+/).filter((w) => w.length > 4).slice(0, 5);
    const keywordStr = keywords.join(' ');
    return [
      `best AI model for ${keywordStr} 2026`,
      `best React framework 2026 comparison`,
      `${keywordStr} npm packages latest version 2026`,
      `deprecated JavaScript libraries 2026 alternatives`,
    ];
  }

  /**
   * Timeout promise that resolves with an empty dossier.
   */
  private _timeout(): Promise<TechDossier> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`[TechScout] Timed out after ${SCOUT_TIMEOUT_MS}ms`);
        resolve(this._emptyDossier());
      }, SCOUT_TIMEOUT_MS);
    });
  }

  /**
   * Returns an empty dossier with no recommendations.
   */
  private _emptyDossier(): TechDossier {
    return {
      aiModels: [],
      frameworks: [],
      emergingCapabilities: [],
      deprecationWarnings: [],
      sources: [],
      researchedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: TechScoutService | null = null;

export function getTechScoutService(): TechScoutService {
  if (!_instance) {
    _instance = new TechScoutService();
  }
  return _instance;
}

/**
 * Serialize a TechDossier into a concise text block for prompt injection.
 * Designed to be appended to builder/architect instructions.
 */
export function serializeDossierForPrompt(dossier: TechDossier): string {
  const sections: string[] = [];

  sections.push('=== TECH SCOUT RESEARCH (verified ' + dossier.researchedAt + ') ===');

  if (dossier.aiModels.length > 0) {
    sections.push('\n## Recommended AI Models');
    for (const rec of dossier.aiModels) {
      const version = rec.latestVersion ? ` (v${rec.latestVersion})` : '';
      const confidence = ` [${rec.confidence} confidence]`;
      sections.push(`- **${rec.name}**${version}${confidence}: ${rec.recommendation}`);
      if (rec.alternatives?.length) {
        sections.push(`  Alternatives: ${rec.alternatives.join(', ')}`);
      }
    }
  }

  if (dossier.frameworks.length > 0) {
    sections.push('\n## Recommended Frameworks & Libraries');
    for (const rec of dossier.frameworks) {
      const version = rec.latestVersion ? ` (v${rec.latestVersion})` : '';
      const confidence = ` [${rec.confidence} confidence]`;
      sections.push(`- **${rec.name}**${version}${confidence}: ${rec.recommendation}`);
      if (rec.alternatives?.length) {
        sections.push(`  Alternatives: ${rec.alternatives.join(', ')}`);
      }
    }
  }

  if (dossier.emergingCapabilities.length > 0) {
    sections.push('\n## Emerging Capabilities');
    dossier.emergingCapabilities.forEach((cap) => sections.push(`- ${cap}`));
  }

  if (dossier.deprecationWarnings.length > 0) {
    sections.push('\n## ⚠️ Deprecation Warnings');
    dossier.deprecationWarnings.forEach((warn) => sections.push(`- ${warn}`));
  }

  if (dossier.sources.length > 0) {
    sections.push(`\n(Based on ${dossier.sources.length} live web sources)`);
  }

  sections.push('=== END TECH SCOUT ===');

  return sections.join('\n');
}

export type { TechScoutService as TechScoutServiceInstance };
