/**
 * POST /api/skills/update-quality
 *
 * Updates a skill's quality score based on Visual Critic feedback.
 * Called after the critique completes to close the feedback loop
 * between the Visual Critic and the Skill Library.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillLibraryService } from '@/services/SkillLibraryService';
import { UpdateQualityRequestSchema } from '@/types/api-schemas';

interface UpdateQualityResponse {
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = UpdateQualityRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message } satisfies UpdateQualityResponse,
        { status: 400 }
      );
    }

    const body = parsed.data;
    const skillLibrary = getSkillLibraryService();
    await skillLibrary.updateQualityScore(body.skillId, body.qualityScore);

    return NextResponse.json({ success: true } satisfies UpdateQualityResponse);
  } catch (error) {
    console.error('[API /api/skills/update-quality] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies UpdateQualityResponse,
      { status: 500 }
    );
  }
}
