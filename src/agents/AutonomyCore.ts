/**
 * Autonomy Core — The Self-Teaching Orchestrator
 *
 * Entry point for solving unknown/complex problems.
 * When the standard pipeline can't handle a request, this system:
 *   1. Fabricates a specialized agent swarm
 *   2. Executes the swarm (research → architect → code)
 *   3. If it fails, analyzes the error and retries with adjusted strategy
 *
 * The self-correction loop ensures the system learns from failures
 * and adapts its approach until it succeeds or exhausts retries.
 */

import { AgentSwarmFactory } from './AgentSwarmFactory';
import { DynamicWorkflowEngine } from '@/services/DynamicWorkflowEngine';
import type { AutonomyGoal, AgentTaskResult } from '@/types/autonomy';

const MAX_RETRIES = 3;

export class AutonomyCore {
  private factory: AgentSwarmFactory;
  private engine: DynamicWorkflowEngine;

  constructor() {
    this.factory = new AgentSwarmFactory();
    this.engine = new DynamicWorkflowEngine();
  }

  /**
   * The entry point for "Self-Teaching".
   * Called when the standard pipeline encounters an unknown capability
   * or when the OmniChat AI classifies a request as 'autonomy'.
   *
   * Implements a self-correction loop:
   *   - On failure, the error is fed back as a constraint
   *   - A new swarm is fabricated with awareness of previous failures
   *   - This continues until success or MAX_RETRIES is reached
   */
  async solveUnknown(goal: AutonomyGoal): Promise<AgentTaskResult> {
    console.log('[AutonomyCore] Solving Unknown:', goal.description);

    let lastResult: AgentTaskResult | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const isRetry = attempt > 0;

      if (isRetry && lastResult) {
        console.log(`[AutonomyCore] Retry ${attempt}/${MAX_RETRIES} — previous error: ${lastResult.error}`);

        // Feed failure context back into the goal
        goal.context += `\n\n--- PREVIOUS ATTEMPT ${attempt} FAILED ---\nError: ${lastResult.error || 'Unknown error'}`;

        if (lastResult.retry_suggestion) {
          goal.context += `\nSuggested fix: ${lastResult.retry_suggestion}`;
        }

        // Add the error as a technical constraint so the new swarm avoids the same mistake
        goal.technical_constraints.push(
          `AVOID: ${lastResult.error || 'Previous approach failed'}`
        );
      }

      // 1. Fabricate a Swarm (new swarm each attempt, aware of failures)
      const swarm = await this.factory.fabricateSwarm(
        goal.description,
        `Context: ${goal.context}\nConstraints: ${goal.technical_constraints.join(', ')}`
      );

      console.log(
        `[AutonomyCore] Attempt ${attempt + 1}: Fabricated Swarm "${swarm.id}" with ${swarm.agents.length} agents`
      );

      // 2. Execute the Swarm
      const result = await this.engine.runSwarm(swarm, goal.description);

      // 3. Check result
      if (result.success) {
        console.log(
          `[AutonomyCore] Success on attempt ${attempt + 1}. Output length: ${result.output.length}`
        );
        return result;
      }

      // Failed — store result for next iteration's context
      lastResult = result;
      console.warn(
        `[AutonomyCore] Attempt ${attempt + 1} failed: ${result.error}`
      );
    }

    // All retries exhausted
    console.error(
      `[AutonomyCore] All ${MAX_RETRIES} attempts exhausted for: ${goal.description}`
    );

    return lastResult || {
      success: false,
      output: '',
      error: `Failed after ${MAX_RETRIES} attempts. The system could not solve: "${goal.description}"`,
    };
  }
}

export const autonomyCore = new AutonomyCore();
