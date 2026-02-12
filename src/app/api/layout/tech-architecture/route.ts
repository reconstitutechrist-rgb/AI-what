/**
 * Tech Architecture API Route
 *
 * Pre-pipeline endpoint for Planning Mode.
 * Takes TechDossier + VisionDocument, returns comprehensive
 * TechArchitectureDocument with system layers, feature mapping,
 * data flows, and integration patterns.
 *
 * Called sequentially AFTER the tech-scout route completes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTechArchitectureService } from '@/services/TechArchitectureService';
import type { TechDossier, VisionDocument } from '@/types/titanPipeline';

export async function POST(req: NextRequest) {
  try {
    const { techDossier, vision } = await req.json();

    // Validate inputs
    if (!techDossier || typeof techDossier !== 'object') {
      return NextResponse.json(
        { error: 'techDossier (object) is required' },
        { status: 400 }
      );
    }

    if (!vision || typeof vision !== 'object') {
      return NextResponse.json(
        { error: 'vision (VisionDocument) is required' },
        { status: 400 }
      );
    }

    if (!vision.name || !vision.features || vision.features.length === 0) {
      return NextResponse.json(
        { error: 'Vision must have a name and at least one feature' },
        { status: 400 }
      );
    }

    console.log(
      `[TechArchitecture API] Starting analysis for "${vision.name}" ` +
      `with ${vision.features.length} features...`
    );

    const service = getTechArchitectureService();
    const architectureDocument = await service.analyze(
      techDossier as TechDossier,
      vision as VisionDocument
    );

    console.log(
      `[TechArchitecture API] Complete. ` +
      `Layers: ${architectureDocument.systemArchitecture?.layers.length ?? 0}, ` +
      `Features mapped: ${architectureDocument.featureTechMap?.length ?? 0}`
    );

    return NextResponse.json({ architectureDocument });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[TechArchitecture API] Error:', errMsg);
    return NextResponse.json(
      { error: `Tech Architecture analysis failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
