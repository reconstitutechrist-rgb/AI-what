/**
 * Layout Critique Module
 *
 * Vision Loop critiquers that compare original designs vs generated outputs
 * and produce structured corrections for auto-fixing.
 */

import type { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import type { LayoutCritiqueEnhanced, LayoutDiscrepancy } from '@/types/layoutAnalysis';
import { MODEL_FLASH, type LayoutCritique } from './config';
import { fileToPart } from './helpers';

/**
 * The "Vision Loop" Critiquer (Legacy)
 * Compares the original reference vs. the generated output (screenshot)
 */
export async function critiqueLayout(
  client: GoogleGenerativeAI,
  originalImage: string,
  generatedImage: string
): Promise<LayoutCritique> {
  const model = client.getGenerativeModel({
    model: MODEL_FLASH,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
    You are a QA Design Engineer.
    Image 1: Original Design Reference.
    Image 2: Current AI-Generated Output.

    Compare them pixel-by-pixel. Identify discrepancies in:
    - Padding/Margins (e.g., "Button padding is 10px too small")
    - Alignment (e.g., "Logo is not vertically centered")
    - Colors (e.g., "Background is #FFF, needs to be #F5F5F5")
    - Font Weights

    Return a 'LayoutCritique' JSON with specific, executable corrections.
  `;

  const originalPart = fileToPart(originalImage);
  const generatedPart = fileToPart(generatedImage);

  const result = await withGeminiRetry(() =>
    model.generateContent([prompt, originalPart, generatedPart])
  );
  const response = result.response;

  try {
    return JSON.parse(response.text()) as LayoutCritique;
  } catch (e) {
    console.error('[critiqueLayout] Failed to parse Critique response', e);
    return { score: 0, discrepancies: [] };
  }
}

/**
 * Enhanced Vision Loop Critiquer for Self-Healing
 *
 * Compares original design vs generated layout and returns structured
 * corrections that can be automatically applied by the AutoFixEngine.
 *
 * @param client GoogleGenerativeAI client instance
 * @param originalImage Base64 of original design
 * @param generatedImage Base64 of generated layout screenshot
 * @param components Current component array for ID matching
 * @param targetFidelity Target fidelity percentage (default 95)
 */
export async function critiqueLayoutEnhanced(
  client: GoogleGenerativeAI,
  originalImage: string,
  generatedImage: string,
  components: DetectedComponentEnhanced[],
  targetFidelity: number = 95
): Promise<LayoutCritiqueEnhanced> {
  const model = client.getGenerativeModel({
    model: MODEL_FLASH,
    generationConfig: { responseMimeType: 'application/json' },
  });

  // Build component ID list for matching
  const componentIds = components.map((c) => c.id);

  const prompt = `
    You are the "Vision Loop Critic" - an expert QA design engineer for AI-generated layouts.
    
    ## Images
    - Image 1: ORIGINAL DESIGN (the reference we're trying to match)
    - Image 2: GENERATED LAYOUT (current AI output to critique)

    ## Available Component IDs
    ${JSON.stringify(componentIds, null, 2)}

    ## Target Fidelity
    We need to achieve ${targetFidelity}% visual fidelity to the original.

    ## Your Task
    Perform a pixel-by-pixel comparison and identify ALL visual discrepancies.
    For each issue found, provide EXACT corrections that can be auto-applied.

    Return this JSON structure:
    {
      "fidelityScore": <0-100>,
      "overallAssessment": "<2-3 sentence summary of main discrepancies and quality>",
      "discrepancies": [
        {
          "componentId": "<matching ID from component list or 'global' or 'unknown'>",
          "issue": "<specific description of what's wrong - open-ended to allow novel issue types>",
          "severity": "minor|moderate|critical",
          "expected": "<what it should be - exact value from original>",
          "actual": "<what it currently is>",
          "correctionJSON": {
            "style": { "<CSS property>": "<correct value>" },
            "content": { "<content property>": "<value>" },
            "bounds": { "<bounds property>": <value> }
          }
        }
      ],
      "passesThreshold": <true if fidelityScore >= ${targetFidelity}>,
      "recommendation": "accept|refine|regenerate"
    }

    ## Severity Guidelines
    - "minor": Subtle differences that most users won't notice (1-2% impact)
    - "moderate": Noticeable but not breaking (3-5% impact)
    - "critical": Major visual issues that significantly impact the design (5%+ impact)

    ## Detection Guidelines

    ### Colors (CRITICAL)
    - Compare ALL colors including: backgrounds, text, borders, shadows, gradients
    - Use exact hex values (e.g., "#ffffff" not "white")
    - Check hover states if visible
    - Detect opacity differences

    ### Spacing
    - Compare padding values (inner spacing)
    - Compare margins (outer spacing)
    - Compare gaps between elements
    - Check alignment (left/center/right)

    ### Typography
    - Font size differences (in px)
    - Font weight (300, 400, 500, 600, 700)
    - Line height
    - Letter spacing
    - Text alignment

    ### Layout
    - Element positioning (top, left, width, height)
    - Flex/Grid alignment issues
    - Z-index stacking problems
    - Overflow clipping issues

    ### Borders & Shadows
    - Border radius differences
    - Border width/color
    - Box shadow values
    - Inset shadows

    ### Size & Position
    - Width/height mismatches
    - Position offsets
    - Aspect ratio differences

    ## Recommendation Logic
    - "accept": fidelityScore >= ${targetFidelity} OR only minor discrepancies
    - "refine": fidelityScore between 70-${targetFidelity - 1}, discrepancies are fixable
    - "regenerate": fidelityScore < 70, fundamental issues that require full regeneration

    ## Important Rules
    1. Match componentId EXACTLY to the provided list when possible
    2. Use "global" for page-level issues (overall background, etc.)
    3. Use "unknown" only when element doesn't match any ID
    4. Provide exact pixel/color values, not relative descriptions
    5. Focus on issues that have the most visual impact first
    6. Each correction should be immediately applicable

    Return ONLY valid JSON. No markdown, no explanation.
  `;

  const originalPart = fileToPart(originalImage);
  const generatedPart = fileToPart(generatedImage);

  const result = await withGeminiRetry(() =>
    model.generateContent([prompt, originalPart, generatedPart])
  );
  const response = result.response;

  try {
    const rawCritique = JSON.parse(response.text());

    // Map to the LayoutCritiqueEnhanced interface
    const discrepancies: LayoutDiscrepancy[] = (rawCritique.discrepancies || []).map(
      (d: Record<string, unknown>) => ({
        componentId: String(d.componentId || 'unknown'),
        issue: String(d.issue || 'Unknown issue'),
        severity: (['minor', 'moderate', 'critical'].includes(String(d.severity))
          ? d.severity
          : 'moderate') as 'minor' | 'moderate' | 'critical',
        expected: String(d.expected || ''),
        actual: String(d.actual || ''),
        correctionJSON: d.correctionJSON as LayoutDiscrepancy['correctionJSON'],
      })
    );

    const fidelityScore = typeof rawCritique.fidelityScore === 'number' ? rawCritique.fidelityScore : 0;
    const passesThreshold = fidelityScore >= targetFidelity;
    
    // Determine recommendation based on score
    let recommendation: 'accept' | 'refine' | 'regenerate' = 'refine';
    if (rawCritique.recommendation && ['accept', 'refine', 'regenerate'].includes(rawCritique.recommendation)) {
      recommendation = rawCritique.recommendation;
    } else if (passesThreshold || (discrepancies.length > 0 && discrepancies.every(d => d.severity === 'minor'))) {
      recommendation = 'accept';
    } else if (fidelityScore < 70) {
      recommendation = 'regenerate';
    }

    return {
      fidelityScore,
      overallAssessment: String(rawCritique.overallAssessment || rawCritique.summary || 'Unable to generate assessment'),
      discrepancies,
      passesThreshold,
      recommendation,
    };
  } catch (e) {
    console.error('[critiqueLayoutEnhanced] Failed to parse Enhanced Critique response', e);
    return {
      fidelityScore: 0,
      overallAssessment: 'Critique generation failed - AI response could not be parsed',
      discrepancies: [],
      passesThreshold: false,
      recommendation: 'regenerate',
    };
  }
}
