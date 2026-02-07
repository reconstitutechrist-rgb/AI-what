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
import type { CritiqueResponse } from '@/types/visualCritic';
import { CritiqueRequestSchema } from '@/types/api-schemas';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = CritiqueRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message } satisfies CritiqueResponse,
        { status: 400 }
      );
    }

    const body = parsed.data;
    const critic = getVisualCriticService();

    const critique = await critic.evaluate(
      body.files,
      body.originalInstructions,
      body.appContext,
      undefined,
      body.is3D
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
