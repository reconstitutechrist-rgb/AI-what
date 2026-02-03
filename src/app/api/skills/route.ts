/**
 * POST /api/skills
 *
 * Query the skill library for similar solutions.
 * Uses vector similarity search via pgvector.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillLibraryService } from '@/services/SkillLibraryService';
import type { SkillQueryRequest, SkillQueryResponse } from '@/types/skillLibrary';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SkillQueryRequest;

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "query" field' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const skillLibrary = getSkillLibraryService();

    const matches = await skillLibrary.findSimilarSkills({
      query: body.query,
      similarityThreshold: body.similarityThreshold,
      limit: body.limit,
      minQualityScore: body.minQualityScore,
    });

    const response: SkillQueryResponse = {
      matches,
      queryTime: Date.now() - startTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/skills] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
