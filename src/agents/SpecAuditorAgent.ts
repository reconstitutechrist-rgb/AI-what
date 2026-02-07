/**
 * Spec Auditor Agent — "The Project Manager"
 *
 * Reads a TITAN_SPEC.md file (or similar requirements doc) and compares it
 * against the current codebase to generate directed DreamGoals.
 *
 * Logic:
 * 1. Read the spec file content.
 * 2. Scan the file tree to see what currently exists.
 * 3. Use Gemini to perform a "Gap Analysis" (What is in the spec but missing in code?).
 * 4. Output a list of DreamGoals to build the missing features.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { AppFile } from '@/types/railway';
import type { DreamGoal } from '@/types/dream';

// ============================================================================
// CONFIGURATION
// ============================================================================

const AUDITOR_MODEL = 'gemini-3-flash-preview';

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

// ============================================================================
// SERVICE
// ============================================================================

class SpecAuditorAgentInstance {
  /**
   * Audit the repository against a specification file.
   *
   * @param specContent - The content of TITAN_SPEC.md or README.md
   * @param files - The current state of the codebase
   * @returns A list of new goals to build missing features
   */
  async auditSpec(specContent: string, files: AppFile[]): Promise<DreamGoal[]> {
    console.log('[SpecAuditor] Starting audit...');

    // 1. Summarize the codebase structure for the AI (to save tokens)
    // We only need paths to know what exists, not full content
    const fileStructure = files
      .map((f) => f.path)
      .filter((p) => !p.includes('node_modules') && !p.includes('.git'))
      .join('\n');

    // 2. Perform Gap Analysis
    const prompt = `You are a Senior Technical Project Manager. Compare the Requirements against the Codebase Structure.

### Requirements (The Spec)
${specContent}

### Current Codebase (File List)
${fileStructure}

### Task
Identify features listed in the Requirements that are **completely missing** or **likely incomplete** based on the file structure. 
Ignore features that seem to exist (e.g., if spec asks for "Login" and you see "auth/Login.tsx", ignore it).

For each missing feature, write a clear, actionable instruction (Directive).

### Output Format
Respond with valid JSON only:
{
  "missing_features": [
    {
      "instruction": "Specific instruction to build it (e.g., 'Create a UserDashboard component with charts')",
      "priority": "high" | "medium" | "low"
    }
  ]
}
If all features appear to exist, return { "missing_features": [] }.`;

    try {
      const apiKey = getApiKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: AUDITOR_MODEL,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await withGeminiRetry(() =>
        model.generateContent(prompt)
      );
      const response = JSON.parse(result.response.text());

      if (!response.missing_features) return [];

      // 3. Convert to DreamGoals
      const goals: DreamGoal[] = response.missing_features.map(
        (feat: { instruction: string; priority: string }) => ({
          id: `spec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          prompt: `[Spec Implementation] ${feat.instruction}`,
          status: 'PENDING' as const,
          source: 'spec' as const,
          createdAt: Date.now(),
        })
      );

      console.log(`[SpecAuditor] Audit complete. Found ${goals.length} gaps.`);
      return goals;
    } catch (error) {
      console.error('[SpecAuditor] Audit failed:', error);
      return [];
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: SpecAuditorAgentInstance | null = null;

export function getSpecAuditor(): SpecAuditorAgentInstance {
  if (!_instance) {
    _instance = new SpecAuditorAgentInstance();
  }
  return _instance;
}

export type { SpecAuditorAgentInstance };
