/**
 * Code Repair API Route
 *
 * Accepts broken code files and their validation errors,
 * then uses AI to fix the issues and return corrected code.
 *
 * Called by the client-side validation pipeline when
 * WebContainer detects errors in generated code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCodeRepairService } from '@/services/CodeRepairService';
import { RepairRequestSchema } from '@/types/api-schemas';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = RepairRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.message },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const service = getCodeRepairService();
    const result = await service.repair({
      files: body.files,
      errors: body.errors,
      originalInstructions: body.originalInstructions,
      attempt: body.attempt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Repair API] Error:', error);
    const message = error instanceof Error ? error.message : 'Repair failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
