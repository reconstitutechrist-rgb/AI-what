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
import type { RepairRequest } from '@/types/sandbox';

export async function POST(req: NextRequest) {
  try {
    const body: RepairRequest = await req.json();
    const { files, errors, originalInstructions, attempt } = body;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'files array is required' },
        { status: 400 }
      );
    }

    if (!errors || errors.length === 0) {
      return NextResponse.json(
        { error: 'errors array is required (nothing to repair)' },
        { status: 400 }
      );
    }

    const service = getCodeRepairService();
    const result = await service.repair({
      files,
      errors,
      originalInstructions: originalInstructions || '',
      attempt: attempt || 1,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Repair API] Error:', error);
    const message = error instanceof Error ? error.message : 'Repair failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
