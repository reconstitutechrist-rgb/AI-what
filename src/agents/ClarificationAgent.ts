/**
 * Clarification Agent
 *
 * Pre-planning agent that identifies ambiguity in user requests
 * and generates structured questions to resolve them.
 *
 * This is a critical component of the "Zero-Bug" architecture:
 * Most "bugs" are actually misunderstandings. This agent catches
 * them at the cheapest possible stage — before any code is written.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';

const MODEL_NAME = 'gemini-3-pro-preview';

// ============================================================================
// TYPES
// ============================================================================

export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[]; // For multiple-choice questions
  defaultOption?: string; // Pre-selected option if user skips
  priority: 'critical' | 'recommended' | 'optional';
  category: 'scope' | 'design' | 'behavior' | 'data' | 'integration';
}

export interface ClarificationAnalysis {
  requestClarity: number; // 0-100, how clear the request is
  ambiguities: string[]; // List of identified ambiguities
  questions: ClarificationQuestion[];
  canProceedWithDefaults: boolean; // True if defaults are reasonable
}

export interface ClarificationResponse {
  questionId: string;
  answer: string;
}

// ============================================================================
// PROMPTS
// ============================================================================

const CLARIFICATION_PROMPT = `### Role
You are a **Requirements Analyst**. Your job is to identify ambiguity in user requests BEFORE coding begins.

### User Request
"{REQUEST}"

### Task
1. Analyze the request for ambiguity.
2. Identify what's unclear or could be interpreted multiple ways.
3. Generate specific questions that MUST be answered before coding.
4. For each question, provide multiple-choice options when possible.

### Rules
- Focus on questions that affect implementation (not cosmetic details).
- Limit to 3-5 questions max (respect user's time).
- Prioritize questions that could cause major rework if answered wrong.

### Output Format (JSON)
{
  "requestClarity": 65,
  "ambiguities": [
    "Unclear if login should support social auth",
    "No specification for mobile responsiveness"
  ],
  "questions": [
    {
      "id": "q1",
      "question": "Which authentication method do you want?",
      "options": ["Email/Password only", "Include Social Login (Google, GitHub)", "Magic Link (passwordless)"],
      "defaultOption": "Email/Password only",
      "priority": "critical",
      "category": "behavior"
    }
  ],
  "canProceedWithDefaults": true
}`;

// ============================================================================
// AGENT
// ============================================================================

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

class ClarificationAgent {
  /**
   * Analyze a user request for ambiguity.
   * Returns questions that should be answered before proceeding.
   */
  async analyzeRequest(request: string): Promise<ClarificationAnalysis> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = CLARIFICATION_PROMPT.replace('{REQUEST}', request);

    try {
      const result = await withGeminiRetry(() => model.generateContent(prompt));
      const text = result.response.text();
      const data = JSON.parse(text);

      return {
        requestClarity: data.requestClarity ?? 50,
        ambiguities: data.ambiguities ?? [],
        questions: (data.questions ?? []).map((q: ClarificationQuestion, i: number) => ({
          id: q.id || `q${i + 1}`,
          question: q.question,
          options: q.options,
          defaultOption: q.defaultOption,
          priority: q.priority || 'recommended',
          category: q.category || 'behavior',
        })),
        canProceedWithDefaults: data.canProceedWithDefaults ?? true,
      };
    } catch (error) {
      console.error('[ClarificationAgent] Analysis failed:', error);
      // Fallback: assume request is clear enough
      return {
        requestClarity: 80,
        ambiguities: [],
        questions: [],
        canProceedWithDefaults: true,
      };
    }
  }

  /**
   * Refine the original request with user's answers.
   * Returns an enhanced, unambiguous request string.
   */
  refineRequest(
    originalRequest: string,
    analysis: ClarificationAnalysis,
    responses: ClarificationResponse[]
  ): string {
    if (responses.length === 0) {
      return originalRequest;
    }

    const refinements = responses.map((r) => {
      const question = analysis.questions.find((q) => q.id === r.questionId);
      return question ? `${question.question} → ${r.answer}` : null;
    }).filter(Boolean);

    return `${originalRequest}

### Clarifications Provided:
${refinements.map((r) => `- ${r}`).join('\n')}`;
  }

  /**
   * Apply default answers for all questions (auto-proceed mode).
   */
  applyDefaults(
    originalRequest: string,
    analysis: ClarificationAnalysis
  ): string {
    const defaults = analysis.questions
      .filter((q) => q.defaultOption)
      .map((q) => `${q.question} → ${q.defaultOption} (default)`);

    if (defaults.length === 0) {
      return originalRequest;
    }

    return `${originalRequest}

### Auto-Applied Defaults:
${defaults.map((d) => `- ${d}`).join('\n')}`;
  }

  /**
   * Determine if clarification is needed based on request clarity.
   */
  needsClarification(analysis: ClarificationAnalysis): boolean {
    // Require clarification if:
    // 1. Clarity is below 70%
    // 2. There are critical questions
    // 3. Cannot proceed with defaults
    const hasCriticalQuestions = analysis.questions.some((q) => q.priority === 'critical');
    return analysis.requestClarity < 70 || hasCriticalQuestions || !analysis.canProceedWithDefaults;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let instance: ClarificationAgent | null = null;

export function getClarificationAgent(): ClarificationAgent {
  if (!instance) {
    instance = new ClarificationAgent();
  }
  return instance;
}
