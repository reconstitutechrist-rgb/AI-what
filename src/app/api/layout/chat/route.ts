/**
 * OmniChat API Route
 *
 * Conversational endpoint for the OmniChat interface.
 * Receives a message + conversation history + code context,
 * returns an AI response with intent classification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOmniChatService } from '@/services/OmniChatService';
import { ChatRequestSchema } from '@/types/api-schemas';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = ChatRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.message },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const service = getOmniChatService();

    const result = await service.chat({
      message: body.message,
      conversationHistory: body.conversationHistory,
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
