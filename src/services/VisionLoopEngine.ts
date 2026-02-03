/**
 * Vision Loop Engine
 *
 * Post-generation validation loop that screenshots rendered code,
 * compares with the original reference image, and iterates until
 * visual fidelity meets the target threshold.
 *
 * Two-phase healing per iteration:
 *   Phase A (surgical): Apply LayoutAutoFixEngine patches to the component
 *     tree, convert to code, and verify improvement.
 *   Phase B (fallback): If patching didn't help, regenerate full code
 *     via the Builder with critique context.
 */

import type { AppFile } from '@/types/railway';
import type { VisualManifest, MergeStrategy, MotionPhysics } from '@/types/titanPipeline';
import type { LayoutCritiqueEnhanced, SelfHealingConfig, SelfHealingIteration } from '@/types/layoutAnalysis';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { getReactToHtmlService } from '@/services/ReactToHtmlService';
import { getGeminiLayoutService } from '@/services/GeminiLayoutService';
import { getLayoutAutoFixEngine } from '@/services/LayoutAutoFixEngine';
import { componentsToReactCode } from '@/utils/componentsToReactCode';

// ============================================================================
// TYPES
// ============================================================================

export interface HealingLoopInput {
  /** Generated code files from the Builder */
  files: AppFile[];
  /** Original reference image as base64 data URI */
  originalImageBase64: string;
  /** Pipeline context for regeneration */
  manifests: VisualManifest[];
  physics: MotionPhysics | null;
  strategy: MergeStrategy;
  currentCode: string | null;
  instructions: string;
  assets: Record<string, string>;
  /** Regeneration function (assembleCode) */
  regenerate: (critiqueContext: string) => Promise<AppFile[]>;
  /** Component array for surgical patching (from dom_tree conversion) */
  components?: DetectedComponentEnhanced[];
  /** Canvas background for code generation */
  canvasBackground?: string;
}

export interface HealingLoopResult {
  /** Final files (potentially improved) */
  files: AppFile[];
  /** Final fidelity score achieved */
  fidelityScore: number;
  /** Number of iterations performed */
  iterations: number;
  /** Why the loop stopped */
  stopReason: 'target_reached' | 'max_iterations' | 'diminishing_returns' | 'screenshot_failed' | 'error';
  /** History of each iteration */
  history: SelfHealingIteration[];
  /** Whether component-level patching was used (vs full regeneration) */
  usedPatching: boolean;
  /** Updated component array after patching (for downstream use) */
  patchedComponents?: DetectedComponentEnhanced[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: SelfHealingConfig = {
  maxIterations: 2,
  targetFidelity: 90,
  minImprovementThreshold: 3,
  saveSnapshots: false,
};

const SCREENSHOT_VIEWPORT = { width: 1280, height: 800 };

// ============================================================================
// ENGINE
// ============================================================================

class VisionLoopEngine {
  private config: SelfHealingConfig;

  constructor(config?: Partial<SelfHealingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run the healing loop on generated code.
   * Iterates up to maxIterations times, stopping early if target fidelity
   * is reached or improvement stalls.
   */
  async runLoop(input: HealingLoopInput): Promise<HealingLoopResult> {
    const history: SelfHealingIteration[] = [];
    let currentFiles = input.files;
    let currentComponents = input.components ? [...input.components] : undefined;
    let lastScore = 0;
    let usedPatching = false;

    for (let i = 1; i <= this.config.maxIterations; i++) {
      console.log(`[VisionLoop] Iteration ${i}/${this.config.maxIterations}`);

      try {
        // 1. Screenshot the current code
        const screenshot = await this.captureScreenshot(currentFiles);
        if (!screenshot) {
          console.warn('[VisionLoop] Screenshot failed, stopping loop');
          return {
            files: currentFiles,
            fidelityScore: lastScore,
            iterations: i,
            stopReason: 'screenshot_failed',
            history,
            usedPatching,
            patchedComponents: currentComponents,
          };
        }

        // 2. Critique vs original (pass component array for better context)
        const critique = await this.runCritique(
          input.originalImageBase64,
          screenshot,
          currentComponents
        );

        console.log(`[VisionLoop] Iteration ${i}: fidelity=${critique.fidelityScore}, discrepancies=${critique.discrepancies.length}`);

        const improvement = critique.fidelityScore - lastScore;
        history.push({
          iteration: i,
          fidelityScore: critique.fidelityScore,
          improvement: i === 1 ? 0 : improvement,
          changesApplied: critique.discrepancies.length,
          modifiedComponentIds: critique.discrepancies.map((d) => d.componentId),
        });

        lastScore = critique.fidelityScore;

        // 3. Check if we've reached target
        if (critique.fidelityScore >= this.config.targetFidelity) {
          console.log(`[VisionLoop] Target reached: ${critique.fidelityScore}%`);
          return {
            files: currentFiles,
            fidelityScore: critique.fidelityScore,
            iterations: i,
            stopReason: 'target_reached',
            history,
            usedPatching,
            patchedComponents: currentComponents,
          };
        }

        // 4. Check for diminishing returns (only after first iteration)
        if (i > 1 && improvement < this.config.minImprovementThreshold) {
          console.log(`[VisionLoop] Diminishing returns: +${improvement}% < ${this.config.minImprovementThreshold}%`);
          return {
            files: currentFiles,
            fidelityScore: critique.fidelityScore,
            iterations: i,
            stopReason: 'diminishing_returns',
            history,
            usedPatching,
            patchedComponents: currentComponents,
          };
        }

        // 5. Don't regenerate on last iteration
        if (i === this.config.maxIterations) {
          return {
            files: currentFiles,
            fidelityScore: critique.fidelityScore,
            iterations: i,
            stopReason: 'max_iterations',
            history,
            usedPatching,
            patchedComponents: currentComponents,
          };
        }

        // 6. Two-phase healing: try patching first, then fall back to regeneration
        let improved = false;

        // Phase A: Surgical component patching
        if (currentComponents && critique.discrepancies.length > 0) {
          const patchResult = await this.tryComponentPatching(
            currentComponents,
            critique,
            input
          );

          if (patchResult) {
            currentFiles = patchResult.files;
            currentComponents = patchResult.components;
            usedPatching = true;
            improved = true;
            console.log(`[VisionLoop] Patching applied ${patchResult.appliedCount} fixes, new fidelity=${patchResult.fidelityScore}%`);
          }
        }

        // Phase B: Fall back to full regeneration
        if (!improved) {
          console.log('[VisionLoop] Falling back to full regeneration');
          const critiqueContext = this.formatCritiqueForBuilder(critique);
          currentFiles = await input.regenerate(critiqueContext);
        }

      } catch (error) {
        console.error(`[VisionLoop] Error in iteration ${i}:`, error);
        return {
          files: currentFiles,
          fidelityScore: lastScore,
          iterations: i,
          stopReason: 'error',
          history,
          usedPatching,
          patchedComponents: currentComponents,
        };
      }
    }

    return {
      files: currentFiles,
      fidelityScore: lastScore,
      iterations: this.config.maxIterations,
      stopReason: 'max_iterations',
      history,
      usedPatching,
      patchedComponents: currentComponents,
    };
  }

  /**
   * Attempt to fix components via LayoutAutoFixEngine and verify improvement.
   * Returns null if patching didn't improve fidelity.
   */
  private async tryComponentPatching(
    components: DetectedComponentEnhanced[],
    critique: LayoutCritiqueEnhanced,
    input: HealingLoopInput
  ): Promise<{
    files: AppFile[];
    components: DetectedComponentEnhanced[];
    appliedCount: number;
    fidelityScore: number;
  } | null> {
    try {
      const autoFix = getLayoutAutoFixEngine();
      const fixResult = autoFix.applyFixes(components, critique.discrepancies);

      if (fixResult.appliedCount === 0) {
        console.log('[VisionLoop] No patches applicable, skipping Phase A');
        return null;
      }

      // Convert patched components to code
      const patchedFiles = componentsToReactCode(fixResult.components, {
        canvasBackground: input.canvasBackground,
        includeDataIds: true,
      });

      // Screenshot and verify improvement
      const patchedScreenshot = await this.captureScreenshot(patchedFiles);
      if (!patchedScreenshot) {
        console.warn('[VisionLoop] Patched screenshot failed, skipping Phase A');
        return null;
      }

      const patchedCritique = await this.runCritique(
        input.originalImageBase64,
        patchedScreenshot,
        fixResult.components
      );

      // Only accept if patching actually improved fidelity
      if (patchedCritique.fidelityScore > critique.fidelityScore) {
        return {
          files: patchedFiles,
          components: fixResult.components,
          appliedCount: fixResult.appliedCount,
          fidelityScore: patchedCritique.fidelityScore,
        };
      }

      console.log(`[VisionLoop] Patching did not improve fidelity (${patchedCritique.fidelityScore} <= ${critique.fidelityScore})`);
      return null;
    } catch (error) {
      console.error('[VisionLoop] Component patching error:', error);
      return null;
    }
  }

  /**
   * Convert files to HTML and capture a screenshot via the screenshot API.
   */
  private async captureScreenshot(files: AppFile[]): Promise<string | null> {
    try {
      const htmlService = getReactToHtmlService();
      const html = htmlService.buildStandaloneHtml(files, SCREENSHOT_VIEWPORT);

      const screenshotUrl = this.getScreenshotApiUrl();
      const response = await fetch(screenshotUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, viewport: SCREENSHOT_VIEWPORT }),
      });

      if (!response.ok) {
        console.error('[VisionLoop] Screenshot API returned', response.status);
        return null;
      }

      const result = await response.json();
      return result.success ? result.image : null;
    } catch (error) {
      console.error('[VisionLoop] Screenshot capture error:', error);
      return null;
    }
  }

  /**
   * Run visual critique comparing original and generated images.
   */
  private async runCritique(
    originalImage: string,
    generatedImage: string,
    components?: DetectedComponentEnhanced[]
  ): Promise<LayoutCritiqueEnhanced> {
    const layoutService = getGeminiLayoutService();
    return layoutService.critiqueLayoutEnhanced(
      originalImage,
      generatedImage,
      components || [],
      this.config.targetFidelity
    );
  }

  /**
   * Format critique discrepancies into a text context that the Builder
   * can use to improve the code.
   */
  private formatCritiqueForBuilder(critique: LayoutCritiqueEnhanced): string {
    if (critique.discrepancies.length === 0) {
      return `Visual critique score: ${critique.fidelityScore}/100. ${critique.overallAssessment}`;
    }

    const fixes = critique.discrepancies
      .filter((d) => d.severity === 'critical' || d.severity === 'moderate')
      .map((d) => {
        let fix = `- [${d.severity}] ${d.issue}: expected "${d.expected}", actual "${d.actual}"`;
        if (d.correctionJSON?.style) {
          fix += ` → fix: ${JSON.stringify(d.correctionJSON.style)}`;
        }
        if (d.correctionJSON?.content) {
          fix += ` → content fix: ${JSON.stringify(d.correctionJSON.content)}`;
        }
        return fix;
      })
      .join('\n');

    return `### VISUAL CRITIQUE (Score: ${critique.fidelityScore}/100)
${critique.overallAssessment}

### REQUIRED FIXES:
${fixes}

Apply these corrections to improve visual fidelity. Do NOT change elements that are already correct.`;
  }

  /**
   * Get the screenshot API URL from environment or default.
   */
  private getScreenshotApiUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/layout/screenshot`;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let instance: VisionLoopEngine | null = null;

export function getVisionLoopEngine(config?: Partial<SelfHealingConfig>): VisionLoopEngine {
  if (!instance || config) {
    instance = new VisionLoopEngine(config);
  }
  return instance;
}
