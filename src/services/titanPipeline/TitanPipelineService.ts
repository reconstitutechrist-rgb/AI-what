/**
 * Titan Pipeline Service
 *
 * Main orchestrator for the full agentic pipeline:
 * - Router (Traffic Control)
 * - Surveyor (Vision Analysis)
 * - Architect (Structure via Claude)
 * - Physicist (Animation Math)
 * - Builder (Code Synthesis)
 * - Live Editor (Refinement)
 *
 * This is a thin orchestrator that delegates to specialized modules.
 */

import type { AppFile } from '@/types/railway';
import type {
  PipelineInput,
  PipelineResult,
  LiveEditResult,
  VisualManifest,
  MotionPhysics,
} from '@/types/titanPipeline';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { geminiImageService } from '@/services/GeminiImageService';
import { getAssetExtractionService } from '@/services/AssetExtractionService';
import { getVisionLoopEngine } from '@/services/VisionLoopEngine';
import { domTreeToComponents } from '@/utils/domTreeToComponents';
import { autonomyCore } from '@/agents/AutonomyCore';

// Import from decomposed modules
import { parseAutonomyOutput } from './helpers';
import { routeIntent } from './router';
import { surveyLayout } from './surveyor';
import { buildStructure } from './architect';
import { extractPhysics } from './physicist';
import { assembleCode } from './builder';
import { liveEdit } from './liveEditor';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Maximum wall-clock time for the entire pipeline before aborting (ms) */
const PIPELINE_TIMEOUT_MS = 120_000; // 2 minutes

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Run the full pipeline - from input to generated code
 */
export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const warnings: string[] = [];
  const stepTimings: Record<string, number> = {};
  const pipelineStart = Date.now();

  /** Throws if the cumulative pipeline time exceeds PIPELINE_TIMEOUT_MS */
  const checkTimeout = (stepName: string) => {
    const elapsed = Date.now() - pipelineStart;
    if (elapsed > PIPELINE_TIMEOUT_MS) {
      throw new Error(
        `Pipeline timeout: ${stepName} aborted after ${Math.round(elapsed / 1000)}s ` +
        `(limit ${Math.round(PIPELINE_TIMEOUT_MS / 1000)}s)`
      );
    }
  };

  const routeStart = Date.now();
  const strategy = await routeIntent(input);
  stepTimings.router = Date.now() - routeStart;

  // AUTOPOIETIC/LEARNING PATH
  if (strategy.mode === 'RESEARCH_AND_BUILD') {
    console.log('[TitanPipeline] Triggering Autonomy Core for Unknown Task...');
    const autonomyStart = Date.now();
    const result = await autonomyCore.solveUnknown({
      id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      description: input.instructions,
      context: `Files: ${input.files.length}${input.currentCode ? '\nExisting code present.' : ''}`,
      technical_constraints: [],
    });
    stepTimings.autonomy = Date.now() - autonomyStart;

    // Parse autonomy output into multiple files if markers are present
    const autonomyFiles = parseAutonomyOutput(result.output);

    return {
      files: autonomyFiles,
      strategy,
      manifests: [],
      physics: null,
      warnings: result.success ? [] : [result.error || 'Autonomy failed'],
      stepTimings,
      command: result.command,
      suspendedState: result.suspendedState,
    };
  }

  const manifests: VisualManifest[] = [];
  let physics: MotionPhysics | null = null;
  const generatedAssets: Record<string, string> = {};

  checkTimeout('parallel stages');

  // Run parallel stages with error isolation — one stage failing shouldn't kill others
  const parallelStart = Date.now();
  const parallelResults = await Promise.allSettled([
    // Surveyor
    (async () => {
      if (strategy.execution_plan.measure_pixels.length && input.files.length > 0) {
        manifests.push(await surveyLayout(input.files[0], 0));
      }
    })(),
    // Physicist
    (async () => {
      if (strategy.execution_plan.extract_physics.length) {
        const videoFiles = input.files.filter((f) => f.mimeType.startsWith('video'));
        physics = await extractPhysics(videoFiles, strategy);
      }
    })(),
    // Photographer
    (async () => {
      if (strategy.execution_plan.generate_assets) {
        for (const asset of strategy.execution_plan.generate_assets) {
          // Skip HDRI/environment assets — not supported by image generator yet
          // Builder uses drei Environment presets instead
          if (asset.type === 'hdri' || asset.type === 'environment') {
            continue;
          }
          try {
            const result = await geminiImageService.generateBackgroundFromReference({
              vibe: asset.vibe || 'photorealistic',
              vibeKeywords: [asset.description],
              referenceImage: '',
              targetElement: asset.name,
            });
            if (result.imageUrl) generatedAssets[asset.name] = result.imageUrl;
          } catch (e) {
            console.error('Asset generation failed', e);
          }
        }
      }
    })(),
  ]);

  stepTimings.parallel = Date.now() - parallelStart;

  // Log any stage failures without aborting the pipeline
  const stageNames = ['Surveyor', 'Physicist', 'Photographer'];
  parallelResults.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[TitanPipeline] ${stageNames[i]} stage failed:`, result.reason);
      warnings.push(`${stageNames[i]} stage failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    }
  });

  checkTimeout('asset extraction');

  // Asset Extraction: crop custom visuals from original image
  // Extracted assets override generated ones (fidelity > hallucination)
  if (manifests.length > 0 && input.files.length > 0) {
    const extractStart = Date.now();
    try {
      const domTree = manifests[0]?.global_theme?.dom_tree;
      if (domTree) {
        const extractor = getAssetExtractionService();
        const extractedAssets = await extractor.extractFromDomTree(
          domTree,
          input.files[0].base64
        );
        // Extracted assets take priority over generated ones
        Object.assign(generatedAssets, extractedAssets);
        if (Object.keys(extractedAssets).length > 0) {
          warnings.push(
            `Extracted ${Object.keys(extractedAssets).length} custom visuals from reference`
          );
        }
      }
    } catch (e) {
      console.error('[TitanPipeline] Asset extraction failed:', e);
      warnings.push('Asset extraction failed, using generated assets only');
    }
    stepTimings.extraction = Date.now() - extractStart;
  }

  checkTimeout('architect');

  const structStart = Date.now();
  const structure = await buildStructure(manifests, strategy, input.instructions);
  stepTimings.architect = Date.now() - structStart;

  checkTimeout('builder');

  const buildStart = Date.now();
  let files = await assembleCode(
    structure,
    manifests,
    physics,
    strategy,
    input.currentCode,
    input.instructions,
    generatedAssets,
    input.repoContext
  );
  stepTimings.builder = Date.now() - buildStart;

  // Convert dom_tree to DetectedComponentEnhanced[] for component-level healing
  let domTreeComponents: DetectedComponentEnhanced[] | undefined;
  if (manifests.length > 0 && manifests[0]?.global_theme?.dom_tree) {
    try {
      const conversionResult = domTreeToComponents(
        manifests[0].global_theme.dom_tree,
        manifests[0].canvas
      );
      domTreeComponents = conversionResult.components;
      if (conversionResult.warnings.length > 0) {
        warnings.push(
          ...conversionResult.warnings.map((w) => `[domTreeConversion] ${w}`)
        );
      }
      if (domTreeComponents.length > 0) {
        console.log(`[TitanPipeline] Converted dom_tree to ${domTreeComponents.length} components`);
      }
    } catch (e) {
      console.error('[TitanPipeline] dom_tree conversion failed:', e);
      warnings.push('dom_tree conversion failed, healing loop will use regeneration only');
    }
  }

  checkTimeout('healing loop');

  // Vision Healing Loop: screenshot → critique → patch/regenerate
  // Only runs when we have a reference image to compare against
  let healingResult: PipelineResult['healingResult'] | undefined;
  if (!input.skipHealing && input.files.length > 0 && manifests.length > 0) {
    const healStart = Date.now();
    try {
      const visionLoop = getVisionLoopEngine();
      const loopResult = await visionLoop.runLoop({
        files,
        originalImageBase64: `data:${input.files[0].mimeType};base64,${input.files[0].base64}`,
        manifests,
        physics,
        strategy,
        currentCode: input.currentCode,
        instructions: input.instructions,
        assets: generatedAssets,
        components: domTreeComponents,
        canvasBackground: manifests[0]?.canvas?.background,
        regenerate: async (critiqueContext: string) => {
          // Regenerate code with critique feedback appended to instructions
          return assembleCode(
            structure,
            manifests,
            physics,
            strategy,
            input.currentCode,
            `${input.instructions}\n\n${critiqueContext}`,
            generatedAssets,
            input.repoContext
          );
        },
      });

      files = loopResult.files;
      healingResult = {
        fidelityScore: loopResult.fidelityScore,
        iterations: loopResult.iterations,
        stopReason: loopResult.stopReason,
        usedPatching: loopResult.usedPatching,
      };
      warnings.push(
        `Healing loop: ${loopResult.stopReason} after ${loopResult.iterations} iteration(s), fidelity=${loopResult.fidelityScore}%${loopResult.usedPatching ? ' (used component patching)' : ''}`
      );
    } catch (e) {
      console.error('[TitanPipeline] Healing loop error:', e);
      warnings.push('Healing loop encountered an error but pipeline continued');
    }
    stepTimings.healing = Date.now() - healStart;
  }

  return { files, strategy, manifests, physics, warnings, stepTimings, healingResult };
}

// ============================================================================
// SINGLETON CLASS
// ============================================================================

/**
 * TitanPipelineService class - thin wrapper for singleton pattern
 */
export class TitanPipelineServiceInstance {
  async runPipeline(input: PipelineInput): Promise<PipelineResult> {
    return runPipeline(input);
  }

  async liveEdit(
    currentCode: string,
    selectedDataId: string,
    instruction: string
  ): Promise<LiveEditResult> {
    return liveEdit(currentCode, selectedDataId, instruction);
  }
}
