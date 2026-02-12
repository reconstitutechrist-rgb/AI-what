/**
 * Vision Board API Route
 *
 * Endpoint for the "Planning Mode" brainstorming chat.
 * Connects the frontend to the VisionBoardService.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVisionBoardService } from '@/services/VisionBoardService';
import type { VisionBoardRequest } from '@/services/VisionBoardService';

export async function POST(req: NextRequest) {
  try {
    const body: VisionBoardRequest = await req.json();
    const { message, conversationHistory, currentVision } = body;

    // Validate inputs
    if (!message && (!conversationHistory || conversationHistory.length === 0)) {
      return NextResponse.json(
        { error: 'Message or history required' },
        { status: 400 }
      );
    }

    const service = getVisionBoardService();
    const response = await service.chat({
      message,
      conversationHistory,
      currentVision,
    });

    return NextResponse.json(response);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : 'No stack';
    console.error('[VisionBoard API] Error:', errMsg);
    console.error('[VisionBoard API] Stack:', errStack);
    return NextResponse.json(
      { error: `Vision Board Error: ${errMsg}` },
      { status: 500 }
    );
  }
}
