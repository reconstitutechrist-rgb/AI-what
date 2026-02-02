/**
 * OmniChat API Route
 *
 * Conversational endpoint for the OmniChat interface.
 * Receives a message + conversation history + code context,
 * returns an AI response with intent classification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOmniChatService } from '@/services/OmniChatService';
import type { OmniChatRequest } from '@/types/titanPipeline';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<OmniChatRequest>;

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'message is required and must be a string' },
        { status: 400 }
      );
    }

    const service = getOmniChatService();

    const result = await service.chat({
      message: body.message,
      conversationHistory: Array.isArray(body.conversationHistory)
        ? body.conversationHistory
        : [],
      currentCode: body.currentCode ?? null,
      appContext: body.appContext,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[OmniChat API] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
