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
import { serializeArchitectureForPrompt } from '@/services/TechArchitectureService';
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
    const {
      files, currentCode, instructions, appContext,
      techDossier: cachedDossier, techArchitectureDocument,
    } = body;

    if (!instructions && (!files || files.length === 0) && !currentCode) {
      return NextResponse.json(
        { error: 'At least one of: instructions, files, or currentCode is required' },
        { status: 400 }
      );
    }

    const normalizedFiles = files ?? [];

    // --- Tech Scout: Skip if cached dossier provided from Planning Mode ---
    let enrichedInstructions = instructions || '';
    let techDossier = cachedDossier;

    if (!techDossier && enrichedInstructions.length > 0) {
      // No cached dossier → run TechScout fresh (Building Mode without Planning)
      try {
        console.log('[Pipeline API] No cached TechDossier, running Tech Scout...');
        const scout = getTechScoutService();
        techDossier = await scout.scout(enrichedInstructions);
      } catch (error) {
        console.warn('[Pipeline API] Tech Scout failed (non-critical), continuing without:', error);
      }
    } else if (techDossier) {
      console.log('[Pipeline API] Using cached TechDossier from Planning Mode');
    }

    // Enrich instructions with dossier
    if (techDossier && (techDossier.aiModels?.length > 0 || techDossier.frameworks?.length > 0)) {
      const dossierText = serializeDossierForPrompt(techDossier);
      enrichedInstructions = `${enrichedInstructions}\n\n${dossierText}`;
      console.log('[Pipeline API] Enriched instructions with Tech Dossier');
    }

    // Enrich instructions with architecture (if available from Planning Mode)
    if (techArchitectureDocument) {
      console.log('[Pipeline API] Using cached TechArchitectureDocument from Planning Mode');
      const archText = serializeArchitectureForPrompt(techArchitectureDocument);
      enrichedInstructions = `${enrichedInstructions}\n\n${archText}`;
      console.log('[Pipeline API] Enriched instructions with Tech Architecture');
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
