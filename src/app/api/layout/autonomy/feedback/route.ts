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
import type { AgentFeedback, SuspendedExecution } from '@/types/autonomy';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedback, suspendedState } = body as {
      feedback: AgentFeedback;
      suspendedState: SuspendedExecution
    };

    if (!feedback || !suspendedState) {
      return NextResponse.json(
        { error: 'Missing feedback or suspendedState' },
        { status: 400 }
      );
    }

    console.log(`[AvatarAPI] Received feedback for cmd ${feedback.commandId} (Exit: ${feedback.exitCode})`);

    // Create a fresh engine instance per request to avoid shared state corruption
    const engine = new DynamicWorkflowEngine();

    const result = await engine.resumeSwarm(
      suspendedState.swarm,
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
