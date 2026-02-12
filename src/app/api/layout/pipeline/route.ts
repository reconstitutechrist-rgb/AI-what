/**
 * Titan Pipeline API Route
 *
 * Unified endpoint for the Universal Visual Editor pipeline.
 * Accepts dynamic Context Bundles (files[] + currentCode + instructions)
 * and returns generated code files.
 *
 * Actions:
 *   - 'pipeline' (default): Run the full Titan pipeline
 *   - 'live-edit': Lightweight code edit for FloatingEditBubble
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTitanPipelineService } from '@/services/TitanPipelineService';
import { getTechScoutService, serializeDossierForPrompt } from '@/services/TechScoutService';
import type { PipelineInput } from '@/types/titanPipeline';
import { PipelineRequestSchema } from '@/types/api-schemas';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = PipelineRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.message },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const { action } = body;

    const service = getTitanPipelineService();

    // --- Live Edit (lightweight, no full pipeline) ---
    if (action === 'live-edit') {
      const { currentCode, selectedDataId, instruction } = body;

      if (!currentCode || !instruction) {
        return NextResponse.json(
          { error: 'currentCode and instruction are required for live-edit' },
          { status: 400 }
        );
      }

      const result = await service.liveEdit(currentCode, selectedDataId || 'unknown', instruction);

      return NextResponse.json(result);
    }

    // --- Full Pipeline ---
    const { files, currentCode, instructions, appContext } = body;

    if (!instructions && (!files || files.length === 0) && !currentCode) {
      return NextResponse.json(
        { error: 'At least one of: instructions, files, or currentCode is required' },
        { status: 400 }
      );
    }

    const normalizedFiles = files ?? [];

    // --- Tech Scout: Research optimal technology before building ---
    let enrichedInstructions = instructions || '';
    let techDossier;

    if (enrichedInstructions.length > 0) {
      try {
        console.log('[Pipeline API] Running Tech Scout...');
        const scout = getTechScoutService();
        techDossier = await scout.scout(enrichedInstructions);

        // Append the dossier as context for the builder
        if (techDossier.aiModels.length > 0 || techDossier.frameworks.length > 0) {
          const dossierText = serializeDossierForPrompt(techDossier);
          enrichedInstructions = `${enrichedInstructions}\n\n${dossierText}`;
          console.log('[Pipeline API] Tech Scout enriched instructions with dossier');
        }
      } catch (error) {
        console.warn('[Pipeline API] Tech Scout failed (non-critical), continuing without:', error);
      }
    }

    const pipelineInput: PipelineInput = {
      files: normalizedFiles,
      currentCode: currentCode || null,
      instructions: enrichedInstructions,
      appContext: appContext || undefined,
      techDossier,
    };

    const result = await service.runPipeline(pipelineInput);

    // Strip screenshotDataUri from critique (too large for API response)
    const { critique, ...rest } = result;
    const sanitizedCritique = critique
      ? { ...critique, screenshotDataUri: undefined }
      : undefined;

    return NextResponse.json({
      ...rest,
      ...(sanitizedCritique && { critique: sanitizedCritique }),
    });
  } catch (error) {
    console.error('[Titan Pipeline API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
