/**
 * Visual Critic Service
 *
 * AI-powered visual quality assessment. After code renders successfully:
 * 1. ReactToHtmlService converts AppFile[] to standalone HTML
 * 2. Puppeteer (via screenshot API) renders it to a PNG
 * 3. Gemini Flash vision model evaluates the screenshot against the request
 * 4. Returns a structured critique with score, issues, and verdict
 *
 * The quality score feeds back into the Skill Library.
 * Low scores trigger auto-refinement (up to 2 cycles).
 *
 * Server-side only — called from the /api/layout/critique route.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getReactToHtmlService } from './ReactToHtmlService';
import type { AppFile } from '@/types/railway';
import type {
  CritiqueResult,
  CritiqueVerdict,
  VisualIssue,
  QualityAssessment,
} from '@/types/visualCritic';

// ============================================================================
// CONFIGURATION
// ============================================================================

const VISION_MODEL = 'gemini-3-flash-preview';
const SCREENSHOT_VIEWPORT = { width: 1280, height: 800 };

/** Minimum score to accept without suggesting improvements */
const ACCEPT_THRESHOLD = 7;

/** Minimum score before suggesting full regeneration */
const REGENERATE_THRESHOLD = 4;

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

// ============================================================================
// VISION PROMPT
// ============================================================================

function buildCritiquePrompt(
  originalInstructions: string,
  appContext?: { name?: string; colorScheme?: string; style?: string },
  is3D?: boolean
): string {
  const contextInfo = appContext?.name
    ? `\nApp: ${appContext.name}. Color scheme: ${appContext.colorScheme || 'default'}. Style: ${appContext.style || 'modern'}.`
    : '';

  if (is3D) {
    return `You are a Visual Art Director and 3D Quality Critic evaluating a rendered 3D scene screenshot.

### Original Request
"${originalInstructions}"${contextInfo}

### 3D Scene Evaluation Criteria (score each 1-10)

#### Core Visual Quality
1. **Lighting Quality** — Is the scene properly lit? Three-point lighting visible (ambient + key + fill)? Shadows present and realistic? No pitch-black areas or overblown highlights?
2. **Material Realism** — Do materials look physically accurate? Metallic surfaces reflect environment? Roughness/smoothness appropriate? PBR materials used correctly?
3. **Camera & Composition** — Camera positioned well? Objects fully in frame? Good viewing angle? Appropriate field of view? Not too close or too far?

#### Advanced Features (evaluate only if applicable to the request)
4. **Physics Behavior** — Are physics objects visible? Do dynamic objects appear grounded or in natural motion? No objects floating unrealistically? Ground plane present for physics scenes?
5. **Model Loading** — Are GLTF/GLB models loaded and visible? Properly scaled and positioned? Textures applied?
6. **Terrain Quality** — Is procedural terrain visible with natural height variation? Ground material applied? Appropriate detail level?
7. **Environment/Skybox** — Is skybox or environment visible? Sky renders correctly (not black or pure white)? HDRI reflections visible on metallic materials?
8. **First-Person Setup** — Scene structured for first-person perspective? Player-centric camera?

#### Overall Assessment
9. **Scene Completeness** — All requested 3D objects/features present? Correct geometry types? Environment appropriate?
10. **Professional Quality** — Professional appearance? Post-processing if requested? Ground shadows? Environment lighting?

### Output Format
Respond with valid JSON only. No markdown fences.
{
  "overall_score": <number 1-10>,
  "layout_accuracy": <number 1-10>,
  "visual_polish": <number 1-10>,
  "completeness": <number 1-10>,
  "issues": [
    {
      "category": "lighting" | "materials" | "geometry" | "camera" | "performance" | "completeness" | "physics" | "terrain" | "environment",
      "severity": "minor" | "moderate" | "major",
      "description": "What's wrong and where"
    }
  ],
  "suggestions": ["Specific actionable improvement suggestions"],
  "verdict": "accept" | "needs_improvement" | "regenerate"
}

Rules:
- Score >= 7: verdict = "accept"
- Score 4-6: verdict = "needs_improvement"
- Score < 4: verdict = "regenerate"
- For 3D: Check the scene actually renders (not blank/black canvas)
- Check that lighting creates depth and dimension
- Check that objects are visible, properly positioned, and in frame
- Check that materials have visual depth (not flat colored)
- For physics: Check objects appear grounded or in natural motion
- For terrain: Check visible height variation and natural appearance
- For skybox: Check sky is visible (not default black background)
- **IMPORTANT**: Screenshots may show blank canvas due to rendering limitations. If canvas is blank but code structure appears correct, give moderate score (5-6) with verdict "needs_improvement"
- If the screenshot shows an error, blank page, or pure black canvas, score it 1`;
  }

  return `You are a Visual Art Director and Quality Critic evaluating a rendered web application screenshot.

### Original Request
"${originalInstructions}"${contextInfo}

### Evaluation Criteria (score each 1-10)
1. **Layout Accuracy** — Does the layout match what was requested? Proper spacing, alignment, hierarchy?
2. **Visual Polish** — Is it visually appealing? Good typography, colors, whitespace, consistency?
3. **Completeness** — Are all requested features/elements present? Nothing missing?
4. **Responsiveness** — Does it look properly sized and proportioned for the viewport?

### Output Format
Respond with valid JSON only. No markdown fences.
{
  "overall_score": <number 1-10>,
  "layout_accuracy": <number 1-10>,
  "visual_polish": <number 1-10>,
  "completeness": <number 1-10>,
  "issues": [
    {
      "category": "layout" | "styling" | "content" | "responsiveness" | "completeness" | "accessibility",
      "severity": "minor" | "moderate" | "major",
      "description": "What's wrong and where"
    }
  ],
  "suggestions": ["Specific actionable improvement suggestions"],
  "verdict": "accept" | "needs_improvement" | "regenerate"
}

Rules:
- Score >= 7: verdict = "accept"
- Score 4-6: verdict = "needs_improvement"
- Score < 4: verdict = "regenerate"
- Be honest but constructive
- Focus on what the USER asked for, not generic best practices
- If the screenshot shows an error or blank page, score it 1`;
}

// ============================================================================
// SERVICE
// ============================================================================

class VisualCriticServiceInstance {
  private genAI: GoogleGenerativeAI | null = null;

  private getGenAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(getApiKey());
    }
    return this.genAI;
  }

  /**
   * Evaluate the visual quality of generated code.
   *
   * Flow:
   * 1. Convert AppFile[] to standalone HTML via ReactToHtmlService
   * 2. Send HTML to screenshot API for Puppeteer rendering
   * 3. Send screenshot to Gemini Flash vision for critique
   * 4. Parse and return structured critique result
   */
  async evaluate(
    files: AppFile[],
    originalInstructions: string,
    appContext?: { name?: string; colorScheme?: string; style?: string },
    screenshotApiUrl?: string,
    is3D?: boolean
  ): Promise<CritiqueResult> {
    const startTime = Date.now();

    try {
      // 1. Convert to standalone HTML
      const htmlService = getReactToHtmlService();
      const standaloneHtml = htmlService.buildStandaloneHtml(files, SCREENSHOT_VIEWPORT);

      // 2. Capture screenshot via Puppeteer API
      const screenshotDataUri = await this.captureScreenshot(
        standaloneHtml,
        screenshotApiUrl
      );

      if (!screenshotDataUri) {
        return {
          overallScore: 0,
          verdict: 'regenerate',
          issues: [{ category: 'completeness', severity: 'major', description: 'Screenshot capture failed — unable to evaluate visually' }],
          suggestions: ['Ensure Puppeteer is available for visual critique'],
          duration: Date.now() - startTime,
        };
      }

      // Auto-detect 3D from file contents if not explicitly set
      const detect3D = is3D ?? files.some((f) =>
        f.content.includes('@react-three/fiber') ||
        f.content.includes("from 'three'") ||
        f.content.includes('from "three"')
      );

      // 3. Send to vision model for evaluation
      const assessment = await this.runVisionCritique(
        screenshotDataUri,
        originalInstructions,
        appContext,
        detect3D
      );

      // 4. Parse into CritiqueResult
      return this.buildCritiqueResult(assessment, screenshotDataUri, startTime);
    } catch (error) {
      console.error('[VisualCritic] Evaluation failed:', error);
      return {
        overallScore: 0,
        verdict: 'needs_improvement',
        issues: [{
          category: 'completeness',
          severity: 'major',
          description: `Critique failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        suggestions: [],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Capture a screenshot of HTML via the Puppeteer screenshot API.
   * Returns a base64 data URI, or null if capture fails.
   */
  private async captureScreenshot(
    html: string,
    apiUrl?: string
  ): Promise<string | null> {
    const url = apiUrl || this.getScreenshotApiUrl();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          viewport: SCREENSHOT_VIEWPORT,
        }),
      });

      if (!response.ok) {
        console.warn(`[VisualCritic] Screenshot API returned ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data.success && data.image) {
        return data.image;
      }

      console.warn('[VisualCritic] Screenshot API returned no image:', data.error);
      return null;
    } catch (error) {
      console.warn('[VisualCritic] Screenshot capture failed:', error);
      return null;
    }
  }

  /**
   * Send screenshot to Gemini Flash vision model for quality assessment.
   */
  private async runVisionCritique(
    screenshotDataUri: string,
    originalInstructions: string,
    appContext?: { name?: string; colorScheme?: string; style?: string },
    is3D?: boolean
  ): Promise<QualityAssessment> {
    const model = this.getGenAI().getGenerativeModel({
      model: VISION_MODEL,
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    });

    // Extract base64 data from data URI
    const base64Match = screenshotDataUri.match(/data:image\/(\w+);base64,(.+)/);
    if (!base64Match) {
      throw new Error('Invalid screenshot data URI format');
    }

    const [, mimeSubtype, base64Data] = base64Match;

    const prompt = buildCritiquePrompt(originalInstructions, appContext, is3D);

    const result = await withGeminiRetry(() =>
      model.generateContent([
        {
          inlineData: {
            mimeType: `image/${mimeSubtype}`,
            data: base64Data,
          },
        },
        { text: prompt },
      ])
    );

    const text = result.response.text();
    return this.parseAssessment(text);
  }

  /**
   * Parse the vision model's JSON response into a QualityAssessment.
   */
  private parseAssessment(text: string): QualityAssessment {
    // Try direct JSON parse
    try {
      return JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown or mixed output
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Fall through
        }
      }
    }

    // Fallback: return a neutral assessment
    console.warn('[VisualCritic] Could not parse vision model response:', text.slice(0, 200));
    return {
      overall_score: 5,
      layout_accuracy: 5,
      visual_polish: 5,
      completeness: 5,
      issues: [],
      suggestions: ['Vision model returned unparseable response'],
      verdict: 'needs_improvement',
    };
  }

  /**
   * Build the final CritiqueResult from the raw assessment.
   */
  private buildCritiqueResult(
    assessment: QualityAssessment,
    screenshotDataUri: string,
    startTime: number
  ): CritiqueResult {
    const score = Math.max(1, Math.min(10, Math.round(assessment.overall_score)));

    let verdict: CritiqueVerdict;
    if (score >= ACCEPT_THRESHOLD) {
      verdict = 'accept';
    } else if (score >= REGENERATE_THRESHOLD) {
      verdict = 'needs_improvement';
    } else {
      verdict = 'regenerate';
    }

    const issues: VisualIssue[] = (assessment.issues || []).map((issue) => ({
      category: this.normalizeCategory(issue.category),
      severity: this.normalizeSeverity(issue.severity),
      description: issue.description,
    }));

    return {
      overallScore: score,
      verdict,
      issues,
      suggestions: assessment.suggestions || [],
      screenshotDataUri,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Normalize issue category to known values.
   */
  private normalizeCategory(cat: string): VisualIssue['category'] {
    const valid: VisualIssue['category'][] = [
      'layout', 'styling', 'content', 'responsiveness', 'completeness', 'accessibility',
      'lighting', 'materials', 'geometry', 'camera', 'performance',
      'physics', 'terrain', 'environment',
    ];
    return valid.includes(cat as VisualIssue['category'])
      ? (cat as VisualIssue['category'])
      : 'layout';
  }

  /**
   * Normalize issue severity to known values.
   */
  private normalizeSeverity(sev: string): VisualIssue['severity'] {
    const valid: VisualIssue['severity'][] = ['minor', 'moderate', 'major'];
    return valid.includes(sev as VisualIssue['severity'])
      ? (sev as VisualIssue['severity'])
      : 'moderate';
  }

  /**
   * Get the screenshot API URL (internal API route).
   */
  private getScreenshotApiUrl(): string {
    // In server-side context, use absolute URL with localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/layout/screenshot`;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: VisualCriticServiceInstance | null = null;

export function getVisualCriticService(): VisualCriticServiceInstance {
  if (!_instance) {
    _instance = new VisualCriticServiceInstance();
  }
  return _instance;
}

export type { VisualCriticServiceInstance };
