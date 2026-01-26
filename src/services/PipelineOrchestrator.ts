/**
 * Pipeline Orchestrator
 *
 * Coordinates the multi-stage layout generation pipeline:
 * Stage 1: Component Detection (Gemini)
 * Stage 2: Style Extraction (Gemini) - runs in parallel with Stage 3
 * Stage 3: Effect Detection (Gemini) - runs in parallel with Stage 2
 * Stage 4: Manifest Assembly (Deterministic)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LayoutManifest } from '@/types/schema';
import type { ColorPalette } from '@/utils/colorExtraction';
import { executeStage1 } from './stages/Stage1ComponentDetection';
import { executeStage2 } from './stages/Stage2StyleExtraction';
import { executeStage3 } from './stages/Stage3EffectDetection';
import { assembleManifest } from './stages/Stage4ManifestAssembly';

export interface PipelineInput {
  image: string;
  extractedColors?: ColorPalette;
  userPrompt?: string;
}

export interface PipelineMetadata {
  stage1Duration: number;
  stage2Duration: number;
  stage3Duration: number;
  stage4Duration: number;
  totalDuration: number;
  componentCount: number;
  effectCount: number;
}

export interface PipelineResult {
  manifest: LayoutManifest;
  metadata: PipelineMetadata;
}

export class PipelineOrchestrator {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async execute(input: PipelineInput): Promise<PipelineResult> {
    const startTime = Date.now();

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: { responseMimeType: 'application/json' },
    });

    // STAGE 1: Component Detection
    console.log('[Pipeline] Starting Stage 1: Component Detection');
    const stage1Start = Date.now();
    const stage1Result = await executeStage1(model, { image: input.image });
    const stage1Duration = Date.now() - stage1Start;
    console.log(
      `[Pipeline] Stage 1 complete: ${stage1Result.componentCount} components in ${stage1Duration}ms`
    );

    // STAGE 2 & 3: Run in PARALLEL for latency optimization
    console.log('[Pipeline] Starting Stages 2 & 3 in parallel');
    const parallelStart = Date.now();

    const [stage2Result, stage3Result] = await Promise.all([
      executeStage2(model, { image: input.image, components: stage1Result.components }),
      executeStage3(model, { image: input.image }),
    ]);

    const parallelDuration = Date.now() - parallelStart;
    console.log(`[Pipeline] Stages 2 & 3 complete in ${parallelDuration}ms`);

    // STAGE 4: Manifest Assembly (Deterministic - No AI)
    console.log('[Pipeline] Starting Stage 4: Manifest Assembly');
    const stage4Start = Date.now();
    const manifest = assembleManifest({
      stage1: stage1Result,
      stage2: stage2Result,
      stage3: stage3Result,
      extractedColors: input.extractedColors,
    });
    const stage4Duration = Date.now() - stage4Start;
    console.log(`[Pipeline] Stage 4 complete in ${stage4Duration}ms`);

    const totalDuration = Date.now() - startTime;

    return {
      manifest,
      metadata: {
        stage1Duration,
        stage2Duration: parallelDuration,
        stage3Duration: parallelDuration,
        stage4Duration,
        totalDuration,
        componentCount: stage1Result.componentCount,
        effectCount: stage3Result.effects.length,
      },
    };
  }
}
