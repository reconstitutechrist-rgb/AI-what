/**
 * Discovery Agent — "The Archaeologist"
 *
 * Scans a loaded codebase to find orphaned, disconnected, or partially-wired
 * features and auto-populates the Dream Mode goal queue.
 *
 * Logic:
 *   1. Scan for "important" files: *Service.ts, *Manager.ts, *Provider.ts,
 *      *Hook.ts, *Agent.ts, *Engine.ts — these usually represent major features
 *   2. Build connectivity map using DependencyGraphService to check which files
 *      are reachable from entry points (App.tsx, page.tsx, layout.tsx, etc.)
 *   3. Classify status:
 *      - ACTIVE: Transitively reachable from an entry point
 *      - PARTIALLY_CONNECTED: Imported somewhere but not from an entry point
 *      - DISCONNECTED: Never imported by anything
 *   4. Infer purpose via Gemini (reads exports, comments, class/function names)
 *   5. Auto-populate goals for DISCONNECTED / PARTIALLY_CONNECTED features
 *
 * Used by MaintenanceCampaign at the start of each dream cycle.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getDependencyGraphService } from '@/services/DependencyGraphService';
import type { AppFile } from '@/types/railway';
import type {
  DiscoveredFeature,
  DiscoveryReport,
  FeatureStatus,
  DreamGoal,
  DependencyGraph,
} from '@/types/dream';

// ============================================================================
// CONFIGURATION
// ============================================================================

const INFERENCE_MODEL = 'gemini-3-flash-preview';

/**
 * File name patterns that indicate a "feature" worth discovering.
 * These naming conventions typically represent major capabilities.
 */
const FEATURE_PATTERNS = [
  /Service\.tsx?$/,
  /Manager\.tsx?$/,
  /Provider\.tsx?$/,
  /Engine\.tsx?$/,
  /Agent\.tsx?$/,
  /Controller\.tsx?$/,
  /Handler\.tsx?$/,
  /Workflow\.tsx?$/,
  /Store\.tsx?$/,
  /Hook\.tsx?$/,
];

/**
 * Paths to exclude from discovery scanning.
 * These are infrastructure files, not features.
 */
const EXCLUDED_PATHS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /\.d\.ts$/,
  /index\.ts$/,
];

/** Max files to infer purpose for (cost control) */
const MAX_INFERENCES = 30;

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

// ============================================================================
// SERVICE
// ============================================================================

class DiscoveryAgentInstance {
  /**
   * Scan a repository for orphaned and disconnected features.
   *
   * @param files - All project files loaded from the repo
   * @param entryPoints - Optional override for entry point paths.
   *                      If not provided, auto-detected from file patterns.
   * @returns A DiscoveryReport with all findings
   */
  async scanRepository(
    files: AppFile[],
    entryPoints?: string[]
  ): Promise<DiscoveryReport> {
    const startTime = Date.now();
    const graphService = getDependencyGraphService();

    // 1. Build the full dependency graph
    const graph = graphService.buildGraph(files);

    // 2. Find entry points (auto-detect if not provided)
    const entries = entryPoints ?? graphService.findEntryPoints(files);

    // 3. Find all reachable files from entry points
    const reachable = graphService.getReachableFiles(graph, entries);

    // 4. Identify "important" feature files
    const featureFiles = this.findFeatureFiles(files);

    // 5. Classify each feature file
    const discoveries: DiscoveredFeature[] = [];

    for (const file of featureFiles) {
      const status = this.classifyFile(file, graph, reachable);
      const consumers = this.getConsumers(file.path, graph);

      discoveries.push({
        file: file.path,
        inferredPurpose: '', // Populated in step 6
        status,
        consumers,
        suggestedAction: '', // Populated in step 7
      });
    }

    // 6. Infer purpose for non-active features using Gemini
    const needsInference = discoveries.filter((d) => d.status !== 'ACTIVE');
    const filesToInfer = needsInference.slice(0, MAX_INFERENCES);

    if (filesToInfer.length > 0) {
      // Build matched pairs, tracking which discoveries have a corresponding file
      const matchedPairs: { discovery: DiscoveredFeature; file: AppFile }[] = [];
      for (const d of filesToInfer) {
        const file = files.find((f) => f.path === d.file);
        if (file) {
          matchedPairs.push({ discovery: d, file });
        } else {
          d.inferredPurpose = 'Source file not found';
        }
      }

      if (matchedPairs.length > 0) {
        const purposes = await this.batchInferPurposes(
          matchedPairs.map((p) => p.file)
        );

        for (let i = 0; i < matchedPairs.length; i++) {
          matchedPairs[i].discovery.inferredPurpose = purposes[i] || 'Purpose could not be determined';
        }
      }
    }

    // For ACTIVE features, set a simple description
    for (const d of discoveries) {
      if (d.status === 'ACTIVE' && !d.inferredPurpose) {
        d.inferredPurpose = this.quickPurposeFromName(d.file);
      }
    }

    // 7. Generate suggested actions for non-active features
    for (const d of discoveries) {
      if (d.status === 'DISCONNECTED') {
        d.suggestedAction = `Wire ${this.getFileName(d.file)} into the application. ${d.inferredPurpose}`;
      } else if (d.status === 'PARTIALLY_CONNECTED') {
        d.suggestedAction = `Complete integration of ${this.getFileName(d.file)} — imported by ${d.consumers.length} file(s) but not reachable from any entry point.`;
      }
    }

    return {
      scannedFiles: files.length,
      discoveries,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    };
  }

  /**
   * Convert discovery report into actionable DreamGoal entries.
   * Only creates goals for DISCONNECTED and PARTIALLY_CONNECTED features.
   */
  generateWiringGoals(report: DiscoveryReport): DreamGoal[] {
    const goals: DreamGoal[] = [];

    for (const discovery of report.discoveries) {
      if (discovery.status === 'ACTIVE') continue;

      const fileName = this.getFileName(discovery.file);
      let prompt: string;

      if (discovery.status === 'DISCONNECTED') {
        prompt = `Wire the disconnected feature "${fileName}" into the application. ` +
          `Purpose: ${discovery.inferredPurpose}. ` +
          `This file is never imported by any other file in the project. ` +
          `Find the appropriate integration point and connect it.`;
      } else {
        prompt = `Complete the integration of "${fileName}". ` +
          `Purpose: ${discovery.inferredPurpose}. ` +
          `Currently imported by: ${discovery.consumers.join(', ')} ` +
          `but not reachable from any application entry point. ` +
          `Trace the import chain and connect the missing link.`;
      }

      goals.push({
        id: `discovery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        prompt,
        status: 'PENDING',
        source: 'discovery',
        createdAt: Date.now(),
      });
    }

    return goals;
  }

  /**
   * Infer the purpose of a single file using Gemini.
   * Reads exports, comments, and function/class names.
   */
  async inferPurpose(file: AppFile): Promise<string> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: INFERENCE_MODEL,
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    });

    // Truncate large files — we only need exports, comments, and signatures
    const truncatedContent = this.extractSignatures(file.content);

    const prompt = `Analyze this TypeScript/JavaScript file and infer its purpose in ONE sentence (max 20 words).
Focus on: exports, class/function names, JSDoc comments, and import patterns.

File: ${file.path}
\`\`\`
${truncatedContent}
\`\`\`

Respond with ONLY the one-sentence purpose. No markdown, no quotes.`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    return result.response.text().trim();
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Find files matching feature naming conventions.
   */
  private findFeatureFiles(files: AppFile[]): AppFile[] {
    return files.filter((file) => {
      // Must match a feature pattern
      const isFeature = FEATURE_PATTERNS.some((p) => p.test(file.path));
      if (!isFeature) return false;

      // Must not be excluded
      const isExcluded = EXCLUDED_PATHS.some((p) => p.test(file.path));
      return !isExcluded;
    });
  }

  /**
   * Classify a file's connectivity status.
   */
  private classifyFile(
    file: AppFile,
    graph: DependencyGraph,
    reachable: Set<string>
  ): FeatureStatus {
    // Check if reachable from entry points
    if (reachable.has(file.path)) {
      return 'ACTIVE';
    }

    // Check if imported by anything at all
    const node = graph.nodes.get(file.path);
    if (node && node.importedBy.length > 0) {
      return 'PARTIALLY_CONNECTED';
    }

    return 'DISCONNECTED';
  }

  /**
   * Get the list of files that import a given file.
   */
  private getConsumers(filePath: string, graph: DependencyGraph): string[] {
    const node = graph.nodes.get(filePath);
    return node ? [...node.importedBy] : [];
  }

  /**
   * Batch infer purposes for multiple files using Gemini.
   * Groups files into a single prompt to reduce API calls.
   */
  private async batchInferPurposes(files: AppFile[]): Promise<string[]> {
    if (files.length === 0) return [];

    // For small batches, infer individually
    if (files.length <= 3) {
      const results: string[] = [];
      for (const file of files) {
        try {
          const purpose = await this.inferPurpose(file);
          results.push(purpose);
        } catch {
          results.push('Purpose inference failed');
        }
      }
      return results;
    }

    // For larger batches, use a single prompt
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: INFERENCE_MODEL,
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    });

    const fileSummaries = files.map((f, i) => {
      const sigs = this.extractSignatures(f.content);
      return `### File ${i + 1}: ${f.path}\n\`\`\`\n${sigs}\n\`\`\``;
    }).join('\n\n');

    const prompt = `For each file below, provide a ONE sentence purpose description (max 20 words each).
Focus on exports, class/function names, JSDoc comments, and imports.

${fileSummaries}

Respond with EXACTLY ${files.length} lines, one purpose per line. No numbering, no markdown, no quotes.
Line 1 = File 1's purpose, Line 2 = File 2's purpose, etc.`;

    try {
      const result = await withGeminiRetry(() => model.generateContent(prompt));
      const text = result.response.text().trim();
      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

      // Pad with fallback if Gemini returned fewer lines than expected
      while (lines.length < files.length) {
        lines.push('Purpose could not be determined');
      }

      return lines.slice(0, files.length);
    } catch {
      return files.map(() => 'Purpose inference failed');
    }
  }

  /**
   * Extract key signatures from file content for purpose inference.
   * Returns exports, class declarations, function signatures, and top comments.
   * Truncates to ~2000 chars to stay within token limits.
   */
  private extractSignatures(content: string): string {
    const lines = content.split('\n');
    const significant: string[] = [];
    let charCount = 0;
    const maxChars = 2000;

    for (const line of lines) {
      const trimmed = line.trim();

      // Keep: exports, class/function declarations, interfaces, JSDoc, imports
      if (
        trimmed.startsWith('export ') ||
        trimmed.startsWith('class ') ||
        trimmed.startsWith('interface ') ||
        trimmed.startsWith('type ') ||
        trimmed.startsWith('function ') ||
        trimmed.startsWith('async function') ||
        trimmed.startsWith('const ') ||
        trimmed.startsWith('/**') ||
        trimmed.startsWith(' *') ||
        trimmed.startsWith('import ') ||
        trimmed.startsWith('// ==') ||
        trimmed.startsWith('// --')
      ) {
        significant.push(trimmed);
        charCount += trimmed.length;
        if (charCount > maxChars) break;
      }
    }

    return significant.join('\n');
  }

  /**
   * Quick purpose inference from just the file name (no AI).
   * Used for ACTIVE features where we don't need Gemini.
   */
  private quickPurposeFromName(filePath: string): string {
    const name = this.getFileName(filePath).replace(/\.(ts|tsx|js|jsx)$/, '');

    // Split camelCase/PascalCase
    const words = name.replace(/([A-Z])/g, ' $1').trim();

    return `${words} (active, fully connected)`;
  }

  /**
   * Extract just the filename from a path.
   */
  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: DiscoveryAgentInstance | null = null;

export function getDiscoveryAgent(): DiscoveryAgentInstance {
  if (!_instance) {
    _instance = new DiscoveryAgentInstance();
  }
  return _instance;
}

export type { DiscoveryAgentInstance };
