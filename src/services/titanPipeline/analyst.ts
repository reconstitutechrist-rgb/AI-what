/**
 * Repo Analyst — "The Archaeologist v2"
 *
 * Deep analysis of existing repositories to extract:
 * - Style Guide: coding conventions, import ordering, syntax preferences
 * - Pattern Library: reusable code templates from the repo
 * - Critical Files: high-centrality files that require extra care
 * - Tech Stack: detected frameworks and libraries
 *
 * This enables the "Ultimate Developer" behavior: generating code that
 * perfectly matches the existing codebase's style and patterns.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getDependencyGraphService } from '@/services/DependencyGraphService';
import type { AppFile } from '@/types/railway';
import type { RepoContext, PatternTemplate } from '@/types/titanPipeline';
import { getGeminiApiKey, GEMINI_FLASH_MODEL } from './config';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** File patterns that indicate "feature" files worth extracting patterns from */
const PATTERN_FILE_PATTERNS = [
  /Hook\.tsx?$/,
  /Service\.tsx?$/,
  /Provider\.tsx?$/,
  /Context\.tsx?$/,
  /Store\.tsx?$/,
  /utils?\.tsx?$/,
];

/** Max files to send to Gemini for style analysis (token control) */
const MAX_STYLE_SAMPLES = 5;

/** Max patterns to extract (cost control) */
const MAX_PATTERNS = 10;

/** Threshold for "critical" files (number of importers) */
const CRITICAL_THRESHOLD = 5;

// ============================================================================
// HASHING
// ============================================================================

/**
 * Generate a simple content hash for cache invalidation.
 * Uses a fast djb2 hash algorithm.
 */
function hashContent(files: AppFile[]): string {
  const combined = files.map((f) => `${f.path}:${f.content.length}`).join('|');
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 33) ^ combined.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// ============================================================================
// PROMPTS
// ============================================================================

const STYLE_EXTRACTION_PROMPT = `Analyze these code files and describe the coding style in a concise guide (max 200 words).

Cover:
- Indentation (spaces vs tabs, count)
- Quotes (single vs double)
- Semicolons (yes/no)
- Component syntax (function declarations vs arrow functions)
- Import ordering conventions
- Async patterns (async/await vs .then())
- Naming conventions (camelCase, PascalCase for what)
- Any other notable patterns

Be specific and actionable. Example output:
"Uses 2-space indentation, single quotes, no semicolons. Components are exported as const arrow functions. Imports ordered: React → external packages → internal @/ paths. Prefers async/await. Custom hooks start with 'use' prefix."

Respond with ONLY the style guide text, no markdown formatting.`;

const PATTERN_EXTRACTION_PROMPT = `Analyze this code file and extract a reusable template pattern.

Return JSON with:
{
  "name": "Brief pattern name",
  "codeSnippet": "The generalized code template with placeholders like COMPONENT_NAME, DATA_TYPE, etc."
}

Focus on the structural pattern, not the specific implementation.
If this file doesn't contain a reusable pattern, return {"name": "none", "codeSnippet": ""}.`;

const TECH_STACK_PROMPT = `Analyze these file paths and package.json content (if available) to identify the tech stack.

Return a JSON array of technology names. Examples:
["Next.js", "React", "TypeScript", "Tailwind CSS", "Prisma", "tRPC"]

Only include technologies you're confident about based on the evidence.
Return ONLY the JSON array, no explanation.`;

// ============================================================================
// ANALYZER
// ============================================================================

class RepoAnalystInstance {
  /**
   * Analyze a repository and extract context for code generation.
   *
   * @param files - All project files from RepoLoader
   * @returns RepoContext with style guide, patterns, and critical files
   */
  async analyzeRepo(files: AppFile[]): Promise<RepoContext> {
    const startTime = Date.now();
    console.log(`[RepoAnalyst] Starting analysis of ${files.length} files...`);

    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH_MODEL,
      generationConfig: { temperature: 0.1 },
    });

    // 1. Generate content hash for caching
    const contentHash = hashContent(files);

    // 2. Build dependency graph and find critical files
    const graphService = getDependencyGraphService();
    const graph = graphService.buildGraph(files);

    const criticalFiles: string[] = [];
    for (const [path, node] of graph.nodes) {
      if (node.importedBy.length >= CRITICAL_THRESHOLD) {
        criticalFiles.push(path);
      }
    }

    // 3. Detect tech stack
    const techStack = await this.detectTechStack(files, model);

    // 4. Extract style guide from representative files
    const styleGuide = await this.extractStyleGuide(files, model);

    // 5. Extract pattern library from feature files
    const patternLibrary = await this.extractPatterns(files, model);

    console.log(
      `[RepoAnalyst] Analysis complete in ${Date.now() - startTime}ms. ` +
        `Critical files: ${criticalFiles.length}, Patterns: ${patternLibrary.length}, ` +
        `Tech stack: ${techStack.join(', ')}`
    );

    return {
      contentHash,
      styleGuide,
      patternLibrary,
      criticalFiles,
      techStack,
      criticalFilesRequireTests: criticalFiles.length > 0,
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Detect the tech stack from file paths and package.json
   */
  private async detectTechStack(
    files: AppFile[],
    model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>
  ): Promise<string[]> {
    // Find package.json
    const packageJson = files.find((f) => f.path.endsWith('package.json'));
    const packageContent = packageJson?.content.slice(0, 2000) || '';

    // Sample file paths
    const pathSample = files
      .slice(0, 50)
      .map((f) => f.path)
      .join('\n');

    const prompt = `${TECH_STACK_PROMPT}

File paths:
${pathSample}

${packageContent ? `package.json (partial):\n${packageContent}` : ''}`;

    try {
      const result = await withGeminiRetry(() => model.generateContent(prompt));
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // Fallback: infer from file extensions and common patterns
      const stack: string[] = [];
      if (files.some((f) => f.path.includes('.tsx'))) stack.push('React', 'TypeScript');
      if (files.some((f) => f.path.includes('next.config'))) stack.push('Next.js');
      if (files.some((f) => f.path.includes('tailwind.config'))) stack.push('Tailwind CSS');
      if (files.some((f) => f.path.includes('prisma/schema'))) stack.push('Prisma');
      return stack.length > 0 ? stack : ['TypeScript'];
    }
  }

  /**
   * Extract a freeform style guide from representative files
   */
  private async extractStyleGuide(
    files: AppFile[],
    model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>
  ): Promise<string> {
    // Select representative code files
    const codeFiles = files.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f.path));
    const samples = codeFiles.slice(0, MAX_STYLE_SAMPLES);

    if (samples.length === 0) {
      return 'No code files found for style analysis.';
    }

    const fileContents = samples
      .map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 1500)}\n\`\`\``)
      .join('\n\n');

    const prompt = `${STYLE_EXTRACTION_PROMPT}

${fileContents}`;

    try {
      const result = await withGeminiRetry(() => model.generateContent(prompt));
      return result.response.text().trim();
    } catch {
      return 'Style analysis failed. Use standard TypeScript conventions.';
    }
  }

  /**
   * Extract reusable patterns from feature files
   */
  private async extractPatterns(
    files: AppFile[],
    model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>
  ): Promise<PatternTemplate[]> {
    // Find pattern-worthy files
    const patternFiles = files.filter((f) =>
      PATTERN_FILE_PATTERNS.some((p) => p.test(f.path))
    );

    const patterns: PatternTemplate[] = [];

    for (const file of patternFiles.slice(0, MAX_PATTERNS)) {
      try {
        const prompt = `${PATTERN_EXTRACTION_PROMPT}

File: ${file.path}
\`\`\`
${file.content.slice(0, 3000)}
\`\`\``;

        const result = await withGeminiRetry(() => model.generateContent(prompt));
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.name && parsed.name !== 'none' && parsed.codeSnippet) {
          patterns.push({
            name: parsed.name,
            sourceFile: file.path,
            codeSnippet: parsed.codeSnippet,
          });
        }
      } catch {
        // Skip files that fail pattern extraction
        console.warn(`[RepoAnalyst] Pattern extraction failed for ${file.path}`);
      }
    }

    return patterns;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: RepoAnalystInstance | null = null;

export function getRepoAnalyst(): RepoAnalystInstance {
  if (!_instance) {
    _instance = new RepoAnalystInstance();
  }
  return _instance;
}

export type { RepoAnalystInstance };
