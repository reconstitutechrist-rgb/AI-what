/**
 * POST /api/skills/update-quality
 *
 * Updates a skill's quality score based on Visual Critic feedback.
 * Called after the critique completes to close the feedback loop
 * between the Visual Critic and the Skill Library.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillLibraryService } from '@/services/SkillLibraryService';

interface UpdateQualityRequest {
  skillId: string;
  /** Quality score from Visual Critic (1-10 scale) */
  qualityScore: number;
}

interface UpdateQualityResponse {
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateQualityRequest;

    if (!body.skillId || typeof body.skillId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "skillId"' } satisfies UpdateQualityResponse,
        { status: 400 }
      );
    }

    if (typeof body.qualityScore !== 'number' || body.qualityScore < 1 || body.qualityScore > 10) {
      return NextResponse.json(
        { success: false, error: '"qualityScore" must be a number between 1 and 10' } satisfies UpdateQualityResponse,
        { status: 400 }
      );
    }

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
