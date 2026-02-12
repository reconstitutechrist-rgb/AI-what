/**
 * Tech Scout API Route
 *
 * Pre-pipeline endpoint for Planning Mode.
 * Runs TechScout web research and returns technology recommendations.
 * Called from LayoutBuilderView auto-trigger during vision building.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTechScoutService } from '@/services/TechScoutService';

export async function POST(req: NextRequest) {
  try {
    const { instructions } = await req.json();

    if (!instructions || typeof instructions !== 'string') {
      return NextResponse.json(
        { error: 'instructions (string) is required' },
        { status: 400 }
      );
    }

    console.log('[TechScout API] Starting research...');
    const service = getTechScoutService();
    const dossier = await service.scout(instructions);

    console.log(
      `[TechScout API] Complete. AI models: ${dossier.aiModels.length}, ` +
      `Frameworks: ${dossier.frameworks.length}`
    );

    return NextResponse.json({ dossier });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[TechScout API] Error:', errMsg);
    return NextResponse.json(
      { error: `Tech Scout failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
