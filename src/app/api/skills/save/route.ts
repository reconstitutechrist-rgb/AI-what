/**
 * POST /api/skills/save
 *
 * Save a new skill to the library after successful generation + validation.
 * Generates a vector embedding and stores in Supabase pgvector.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillLibraryService } from '@/services/SkillLibraryService';
import type { SkillSaveResponse } from '@/types/skillLibrary';
import { SkillSaveRequestSchema } from '@/types/api-schemas';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = SkillSaveRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { saved: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const skillLibrary = getSkillLibraryService();

    // Auto-extract tags if not provided
    const tags = body.tags && body.tags.length > 0
      ? body.tags
      : skillLibrary.extractTags(body.goalDescription);

    const result = await skillLibrary.saveSkill({
      goalDescription: body.goalDescription,
      reasoningSummary: body.reasoningSummary,
      tags,
      solutionCode: body.solutionCode,
      solutionFiles: body.solutionFiles,
      qualityScore: body.qualityScore,
    });

    if (!result) {
      return NextResponse.json(
        { saved: false, error: 'Failed to save skill (auth or DB error)' } satisfies SkillSaveResponse,
        { status: 500 }
      );
    }

    const response: SkillSaveResponse = {
      saved: true,
      skillId: result.skillId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/skills/save] Error:', error);
    return NextResponse.json(
      {
        saved: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies SkillSaveResponse,
      { status: 500 }
    );
  }
}
