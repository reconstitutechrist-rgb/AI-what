/**
 * POST /api/layout/critique
 *
 * Visual quality assessment endpoint.
 * Accepts generated code files + original instructions,
 * renders via Puppeteer, evaluates with vision model,
 * returns structured critique with score and suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVisualCriticService } from '@/services/VisualCriticService';
import type { CritiqueRequest, CritiqueResponse } from '@/types/visualCritic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CritiqueRequest;

    // Validate required fields
    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or empty "files" array' } satisfies CritiqueResponse,
        { status: 400 }
      );
    }
    if (!body.originalInstructions || typeof body.originalInstructions !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "originalInstructions"' } satisfies CritiqueResponse,
        { status: 400 }
      );
    }

    const critic = getVisualCriticService();

    const critique = await critic.evaluate(
      body.files,
      body.originalInstructions,
      body.appContext
    );

    const response: CritiqueResponse = {
      success: true,
      critique,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/layout/critique] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies CritiqueResponse,
      { status: 500 }
    );
  }
}
