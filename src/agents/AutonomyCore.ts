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
import { getSkillLibraryService } from '@/services/SkillLibraryService';

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
        // Server-side syntax validation via esbuild before returning
        const syntaxErrors = await this.quickSyntaxCheck(result.output);
        if (syntaxErrors) {
          console.warn(
            `[AutonomyCore] Code generated but has syntax errors: ${syntaxErrors}`
          );
          // Feed syntax errors back into retry loop instead of returning broken code
          lastResult = {
            success: false,
            output: result.output,
            error: `Syntax validation failed: ${syntaxErrors}`,
            retry_suggestion: 'Fix the syntax errors in the generated code.',
            reasoning_summary: result.reasoning_summary,
          };
          continue;
        }

        console.log(
          `[AutonomyCore] Success on attempt ${attempt + 1}. Output length: ${result.output.length}`
        );

        // Save validated solution to skill library (fire-and-forget)
        this.saveToSkillLibrary(goal, result).catch((err) => {
          console.warn('[AutonomyCore] Skill save failed (non-critical):', err);
        });

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

  /**
   * Quick server-side syntax check using esbuild.
   * Returns null if code is valid, or an error string if invalid.
   * Catches obvious syntax errors before code reaches the client.
   */
  private async quickSyntaxCheck(code: string): Promise<string | null> {
    try {
      const esbuild = await import('esbuild');
      await esbuild.transform(code, {
        loader: 'tsx',
        target: 'es2020',
        jsx: 'automatic',
      });
      return null; // Valid syntax
    } catch (e: unknown) {
      if (e instanceof Error) {
        // Extract just the first error message
        const firstLine = e.message.split('\n')[0];
        return firstLine || e.message;
      }
      return 'Unknown syntax error';
    }
  }

  /**
   * Save a successfully solved + validated solution to the skill library.
   * Runs asynchronously so it doesn't block the response to the user.
   */
  private async saveToSkillLibrary(
    goal: AutonomyGoal,
    result: AgentTaskResult
  ): Promise<void> {
    const skillLibrary = getSkillLibraryService();

    const tags = skillLibrary.extractTags(goal.description);

    await skillLibrary.saveSkill({
      goalDescription: goal.description,
      reasoningSummary: result.reasoning_summary || `Solved via autonomy swarm. Context: ${goal.context.slice(0, 500)}`,
      tags,
      solutionCode: result.output,
      solutionFiles: [{ path: '/src/App.tsx', content: result.output }],
    });

    console.log(`[AutonomyCore] Skill saved to library for: "${goal.description.slice(0, 80)}"`);
  }
}

export const autonomyCore = new AutonomyCore();
