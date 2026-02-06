/**
 * Gemini Layout Service
 *
 * Core intelligence engine for the "Ultimate Layout Builder".
 * Uses Gemini 3 Flash for high-speed multimodal analysis of:
 * - Images (Layout Detection)
 * - Videos (Motion & Flow Extraction)
 * - Hybrid Inputs (Layout + Style mixing)
 *
 * Capabilities:
 * - "Vision Loop": Critiques generated layouts against originals
 * - "Motion Extraction": Analyzes video keyframes for animation configs
 * - "Zero-Preset": Detects arbitrary values (px, hex) for exact replication
 *
 * This thin orchestrator class delegates to specialized modules.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import type { DesignSpec } from '@/types/designSpec';
import type { LayoutAnalysisResult, LayoutCritiqueEnhanced } from '@/types/layoutAnalysis';
import type { VideoMotionAnalysis } from '@/types/motionConfig';
import {
  sanitizeComponents,
  inferContainerLayouts,
  resolveRootOverlaps,
} from '@/utils/layoutValidation';

// Import from decomposed modules
import { MODEL_FLASH, getDefaultDesignSpec, type LayoutCritique } from './config';
import { fileToPart, validateTypographyScaling } from './helpers';
import { extractDesignSpec as extractDesignSpecFn } from './extractDesignSpec';
import { buildComponentsFromSpec as buildComponentsFromSpecFn } from './buildComponents';
import { analyzeVideoFlow as analyzeVideoFlowFn } from './videoAnalysis';
import { critiqueLayout as critiqueLayoutFn, critiqueLayoutEnhanced as critiqueLayoutEnhancedFn } from './critique';
import { editComponent as editComponentFn } from './editComponent';

/**
 * GeminiLayoutService - Thin orchestrator class
 *
 * Delegates to specialized modules while preserving the singleton pattern
 * and maintaining backward compatibility with existing consumers.
 */
export class GeminiLayoutService {
  private client: GoogleGenerativeAI | null = null;
  private isAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      this.isAvailable = true;
    } else {
      console.warn('[GeminiLayoutService] API key not configured');
    }
  }

  /**
   * Check if the service is available
   */
  public checkAvailability(): boolean {
    return this.isAvailable;
  }

  // ==========================================================================
  // STAGE 1: The Architect
  // ==========================================================================

  /**
   * Extract high-level design specification (colors, fonts, structure)
   * This provides context for Stage 2 to build accurate components
   */
  async extractDesignSpec(imageBase64: string, instructions?: string): Promise<DesignSpec> {
    if (!this.client) throw new Error('Gemini API not configured');
    return extractDesignSpecFn(this.client, imageBase64, instructions);
  }

  // ==========================================================================
  // STAGE 2: The Engineer
  // ==========================================================================

  /**
   * Build specific component list using the DesignSpec from Stage 1
   * Colors are provided, so no guessing needed
   */
  async buildComponentsFromSpec(
    imageBase64: string,
    designSpec: DesignSpec,
    instructions?: string
  ): Promise<DetectedComponentEnhanced[]> {
    if (!this.client) throw new Error('Gemini API not configured');
    return buildComponentsFromSpecFn(this.client, imageBase64, designSpec, instructions);
  }

  // ==========================================================================
  // Two-Stage Analysis (Recommended)
  // ==========================================================================

  /**
   * Two-Stage Analysis: Extract DesignSpec, then build components
   * This is the new recommended approach
   *
   * Returns a structured result with both components AND designSpec
   * so the design system is preserved throughout the pipeline.
   */
  async analyzeImageTwoStage(
    imageBase64: string,
    instructions?: string
  ): Promise<LayoutAnalysisResult> {
    console.log('[GeminiLayoutService] Starting two-stage analysis...');

    const result: LayoutAnalysisResult = {
      success: false,
      components: [],
      designSpec: null,
      errors: [],
      warnings: [],
      metadata: {
        componentCount: 0,
        parseAttempts: 0,
        recoveredComponents: 0,
        designSpecExtracted: false,
        componentsBuilt: false,
      },
    };

    // Stage 1: Extract design specification
    console.log('[GeminiLayoutService] Stage 1: Extracting DesignSpec...');
    try {
      const designSpec = await this.extractDesignSpec(imageBase64, instructions);
      result.designSpec = designSpec;
      result.metadata.designSpecExtracted = true;
      console.log('[GeminiLayoutService] DesignSpec extracted:', {
        colors: designSpec.colorPalette.primary,
        structure: designSpec.structure.type,
        componentTypes: designSpec.componentTypes.length,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error extracting design spec';
      result.errors.push(`Stage 1 (DesignSpec): ${errorMsg}`);
      console.error('[GeminiLayoutService] Stage 1 failed:', errorMsg);
      // Continue to Stage 2 even if Stage 1 fails - components may still be extractable
    }

    // Stage 2: Build components using the spec
    console.log('[GeminiLayoutService] Stage 2: Building components from spec...');
    try {
      // Use default spec if Stage 1 failed
      const specForStage2 = result.designSpec || this.getDefaultDesignSpec();
      const components = await this.buildComponentsFromSpec(
        imageBase64,
        specForStage2,
        instructions
      );
      result.components = components;
      result.metadata.componentCount = components.length;
      result.metadata.componentsBuilt = true;
      console.log('[GeminiLayoutService] Built', components.length, 'components');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error building components';
      result.errors.push(`Stage 2 (Components): ${errorMsg}`);
      console.error('[GeminiLayoutService] Stage 2 failed:', errorMsg);
    }

    // Determine overall success
    result.success = result.metadata.componentsBuilt && result.components.length > 0;

    // Add warning if design spec extraction failed but components succeeded
    if (!result.metadata.designSpecExtracted && result.metadata.componentsBuilt) {
      result.warnings.push(
        'Design specification extraction failed; using default colors. Layout may not match original design precisely.'
      );
    }

    return result;
  }

  // ==========================================================================
  // Legacy Single-Stage Analysis
  // ==========================================================================

  /**
   * LEGACY: Single-stage analysis (kept for backward compatibility)
   * Analyze an image to extract pixel-perfect layout components
   * Uses Gemini 3 Flash for speed and high context window
   */
  async analyzeImage(
    imageBase64: string,
    instructions?: string
  ): Promise<DetectedComponentEnhanced[]> {
    if (!this.client) throw new Error('Gemini API not configured');

    const model = this.client.getGenerativeModel({
      model: MODEL_FLASH,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `
      You are an expert UI designer with pixel-perfect vision. Analyze this screenshot and create a complete JSON representation of EVERY visible UI element.

      USER INSTRUCTIONS: ${instructions || 'Create a pixel-perfect replica of this design.'}

      YOUR TASK:
      Return a JSON array where EACH visible element (text, button, image, icon, container, etc.) is a separate object.

      REQUIRED JSON SCHEMA FOR EACH COMPONENT:
      {
        "id": "unique-descriptive-id",
        "type": "header|sidebar|hero|cards|navigation|footer|form|logo|button|text|image|input|link|icon|badge|avatar|divider|unknown",
        "bounds": {
          "top": <number 0-100, percentage from top of viewport>,
          "left": <number 0-100, percentage from left edge>,
          "width": <number 0-100, percentage of viewport width>,
          "height": <number 0-100, percentage of viewport height>
        },
        "style": {
          "backgroundColor": "<exact hex color>",
          "textColor": "<exact hex color>",
          "fontSize": "<exact size like 48px, 16px>",
          "fontWeight": "<bold|normal|600|700>",
          "padding": "<exact value like 16px or 12px 24px>",
          "borderRadius": "<exact value like 8px, 12px>",
          "borderColor": "<hex color if bordered>",
          "borderWidth": "<1px, 2px etc>",
          "shadow": "<box-shadow value if present>",
          "customCSS": { "<any other CSS properties>": "<values>" }
        },
        "content": {
          "text": "<actual text content you can read>",
          "hasImage": true/false,
          "hasIcon": true/false
        },
        "confidence": <0.0-1.0>
      }

      CRITICAL REQUIREMENTS:
      1. **EXHAUSTIVE DETECTION**: Find 20-50+ components.
      2. **PIXEL-PERFECT BOUNDS**: Measure precisely where each element sits.
      3. **EXTRACT ACTUAL TEXT**: Read ALL visible text.
      4. **MEASURE ACTUAL COLORS**: Use exact hex codes.
      5. **USE EXACT CSS VALUES**: No Tailwind classes.
      6. **UNIQUE IDS**: Give each component a descriptive ID.

      Return ONLY the JSON array. No markdown, no explanation.
    `;

    const imagePart = fileToPart(imageBase64);
    const result = await withGeminiRetry(() => model.generateContent([prompt, imagePart]));
    const response = result.response;

    try {
      const rawData = JSON.parse(response.text());
      const { components: sanitizedComponents, errors } = sanitizeComponents(rawData);
      if (errors.length > 0) {
        console.warn('[GeminiLayoutService] Validation issues in analyzeImage:', errors);
      }
      // Infer layout for containers missing layout data
      const withInferredLayouts = inferContainerLayouts(sanitizedComponents);
      // Validate typography scaling to prevent font overflow
      const withValidatedTypography = validateTypographyScaling(withInferredLayouts);
      // Resolve root overlaps
      const components = resolveRootOverlaps(withValidatedTypography);
      return components;
    } catch (e) {
      console.error('Failed to parse Gemini response', e);
      return [];
    }
  }

  // ==========================================================================
  // Video Analysis
  // ==========================================================================

  /**
   * Analyze video keyframes to extract motion and flow
   * @param frames Array of base64 images (Start, Middle, End)
   */
  async analyzeVideoFlow(frames: string[], instructions?: string): Promise<VideoMotionAnalysis> {
    if (!this.client) throw new Error('Gemini API not configured');
    return analyzeVideoFlowFn(this.client, frames, instructions);
  }

  // ==========================================================================
  // Vision Loop Critique
  // ==========================================================================

  /**
   * The "Vision Loop" Critiquer (Legacy)
   * Compares the original reference vs. the generated output (screenshot)
   */
  async critiqueLayout(originalImage: string, generatedImage: string): Promise<LayoutCritique> {
    if (!this.client) throw new Error('Gemini API not configured');
    return critiqueLayoutFn(this.client, originalImage, generatedImage);
  }

  /**
   * Enhanced Vision Loop Critiquer for Self-Healing
   *
   * Compares original design vs generated layout and returns structured
   * corrections that can be automatically applied by the AutoFixEngine.
   */
  async critiqueLayoutEnhanced(
    originalImage: string,
    generatedImage: string,
    components: DetectedComponentEnhanced[],
    targetFidelity: number = 95
  ): Promise<LayoutCritiqueEnhanced> {
    if (!this.client) throw new Error('Gemini API not configured');
    return critiqueLayoutEnhancedFn(
      this.client,
      originalImage,
      generatedImage,
      components,
      targetFidelity
    );
  }

  // ==========================================================================
  // Component Editing
  // ==========================================================================

  /**
   * Edit a specific component based on User Instruction
   */
  async editComponent(
    component: DetectedComponentEnhanced,
    prompt: string
  ): Promise<DetectedComponentEnhanced> {
    if (!this.client) throw new Error('Gemini API not configured');
    return editComponentFn(this.client, component, prompt);
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Get default design spec for fallback scenarios
   */
  private getDefaultDesignSpec(): DesignSpec {
    return getDefaultDesignSpec();
  }

  /**
   * Convert base64 image to Gemini API part format
   */
  private fileToPart(base64: string) {
    return fileToPart(base64);
  }
}
