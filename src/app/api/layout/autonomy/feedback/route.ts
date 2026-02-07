/**
 * Avatar Feedback API
 *
 * Receives execution results (stdout, exit code, screenshots) from the client.
 * Resumes the server-side agent swarm to analyze the result and decide next steps.
 *
 * Response shapes:
 *   - Command chaining: { command, suspendedState }
 *   - Final success:    { files: AppFile[], success: true }
 *   - Failure:          { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamicWorkflowEngine } from '@/services/DynamicWorkflowEngine';
import { parseAutonomyOutput } from '@/services/TitanPipelineService';
import type { AgentSwarm, SuspendedExecution, AgentFeedback } from '@/types/autonomy';
import { AutonomyFeedbackRequestSchema } from '@/types/api-schemas';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = AutonomyFeedbackRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.message },
        { status: 400 }
      );
    }

    // Zod validates structure; cast to domain types for the engine
    // (these are serialized objects from a previous server round-trip)
    const feedback = parsed.data.feedback as AgentFeedback;
    const suspendedState = parsed.data.suspendedState as unknown as SuspendedExecution;

    console.log(`[AvatarAPI] Received feedback for cmd ${feedback.commandId} (Exit: ${feedback.exitCode})`);

    // Create a fresh engine instance per request to avoid shared state corruption
    const engine = new DynamicWorkflowEngine();

    const result = await engine.resumeSwarm(
      suspendedState.swarm as AgentSwarm,
      suspendedState,
      feedback
    );

    // Command chaining: agent wants another command executed
    if (result.command && result.suspendedState) {
      return NextResponse.json(result);
    }

    // Final success: parse raw code output into AppFile[] for the client
    if (result.success && result.output) {
      const files = parseAutonomyOutput(result.output);
      return NextResponse.json({ files, success: true });
    }

    // Failure: return error for the client to display
    return NextResponse.json({ error: result.error || 'Autonomy failed without details' });

  } catch (error) {
    console.error('[AvatarAPI] Error resuming swarm:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
