/**
 * Workflow Auditor Agent — "The Time Machine"
 *
 * Discovers time-dependent business logic in the codebase (cron jobs,
 * trial expirations, scheduled emails, TTLs) and auto-generates
 * temporal workflow tests. Then executes them using the TimeTravelService
 * to simulate days/weeks passing in seconds.
 *
 * Flow:
 *   1. Scan codebase for temporal patterns (setTimeout, cron, expiration, TTL)
 *   2. Use Gemini to generate WorkflowDefinitions
 *   3. Execute each workflow step-by-step:
 *       - ActionStep  → run code via executeShell
 *       - WaitStep    → fast-forward via TimeTravelService
 *       - Assertion   → evaluate expression and check result
 *   4. Return WorkflowResult with per-step pass/fail
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getTimeTravelService } from '@/services/TimeTravelService';
import { getWebContainerService } from '@/services/WebContainerService';
import type { AppFile } from '@/types/railway';
import type {
  WorkflowDefinition,
  WorkflowResult,
  WorkflowStepResult,
} from '@/types/temporalWorkflow';

// ============================================================================
// CONFIGURATION
// ============================================================================

const AUDITOR_MODEL = 'gemini-3-flash-preview';

/** Regex patterns that indicate time-dependent logic */
const TEMPORAL_PATTERNS = [
  /setTimeout|setInterval/,
  /cron|schedule|recurring/i,
  /expir|ttl|timeout|deadline/i,
  /billing|subscription|trial/i,
  /reminder|notification|queue/i,
  /archive|cleanup|purge|sweep/i,
  /Date\.now|new Date/,
];

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

// ============================================================================
// SERVICE
// ============================================================================

class WorkflowAuditorInstance {
  /**
   * Scan the codebase for time-dependent logic and auto-generate
   * workflow definitions to test it.
   *
   * @param files - The current state of the codebase
   * @returns List of workflow definitions to simulate
   */
  async discoverWorkflows(files: AppFile[]): Promise<WorkflowDefinition[]> {
    console.log('[WorkflowAuditor] Scanning for temporal logic...');

    // 1. Find files containing temporal patterns (not just by filename)
    const temporalFiles = files.filter((f) => {
      // Skip non-source files
      if (f.path.includes('node_modules') || f.path.includes('.git')) return false;
      if (!f.path.match(/\.(ts|tsx|js|jsx)$/)) return false;

      // Check content for temporal patterns
      return TEMPORAL_PATTERNS.some((pattern) => pattern.test(f.content));
    });

    if (temporalFiles.length === 0) {
      console.log('[WorkflowAuditor] No temporal logic found in codebase.');
      return [];
    }

    console.log(`[WorkflowAuditor] Found ${temporalFiles.length} files with temporal patterns.`);

    // 2. Build context for the AI (truncate large files to save tokens)
    const context = temporalFiles
      .slice(0, 15) // Cap at 15 files to stay within token limits
      .map((f) => `── ${f.path} ──\n${f.content.slice(0, 3000)}`)
      .join('\n\n');

    // 3. Ask Gemini to generate workflow definitions
    const prompt = `You are a Senior QA Engineer specializing in "Temporal Testing" — finding bugs that only appear after time passes.

Analyze the following code for time-dependent logic: cron jobs, trial expirations, scheduled emails, subscription billing, TTLs, cleanup jobs, etc.

For each piece of temporal logic you find, generate a "Temporal Workflow" — a test that simulates the passage of time to verify the logic works correctly.

### Code Context
${context}

### Output Format
Respond with valid JSON only:
{
  "workflows": [
    {
      "name": "Human-readable workflow name (e.g., 'Free Trial Expiration')",
      "sourceFile": "path/to/file.ts",
      "steps": [
        { "type": "action", "description": "What this does", "code": "JavaScript to run" },
        { "type": "wait", "duration": "7d" },
        { "type": "assertion", "expression": "JavaScript boolean expression", "expected": true, "description": "What we're checking" }
      ]
    }
  ]
}

Rules:
- Each workflow MUST have at least one "wait" step (otherwise it's not temporal)
- Assertion expressions should be simple boolean checks
- Use realistic durations based on the code (don't guess — read the actual timeout values)
- If no temporal logic is found, return { "workflows": [] }`;

    try {
      const apiKey = getApiKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: AUDITOR_MODEL,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await withGeminiRetry(() =>
        model.generateContent(prompt)
      );
      const response = JSON.parse(result.response.text());

      if (!response.workflows || response.workflows.length === 0) {
        console.log('[WorkflowAuditor] No temporal workflows generated.');
        return [];
      }

      // Assign IDs using existing codebase convention
      const workflows: WorkflowDefinition[] = response.workflows.map(
        (w: { name: string; sourceFile?: string; steps: WorkflowDefinition['steps'] }) => ({
          id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: w.name,
          sourceFile: w.sourceFile,
          steps: w.steps,
        })
      );

      console.log(`[WorkflowAuditor] Generated ${workflows.length} temporal workflows.`);
      return workflows;
    } catch (error) {
      console.error('[WorkflowAuditor] Discovery failed:', error);
      return [];
    }
  }

  /**
   * Execute a single workflow simulation step-by-step.
   *
   * @param workflow - The workflow definition to simulate
   * @returns Detailed per-step results
   */
  async runWorkflow(workflow: WorkflowDefinition): Promise<WorkflowResult> {
    console.log(`[WorkflowAuditor] Running simulation: "${workflow.name}"`);
    const startTime = Date.now();

    const timeTravel = getTimeTravelService();
    const webContainer = getWebContainerService();
    const history: string[] = [];
    const stepResults: WorkflowStepResult[] = [];

    // Ensure the time mock is injected
    await timeTravel.injectTimeMock();

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      // ── Wait Step ─────────────────────────────────────────────────────
      if (step.type === 'wait') {
        const msg = `⏩ Fast-forwarding ${step.duration}...`;
        history.push(msg);

        const { fired, remaining } = await timeTravel.advanceTime(step.duration);
        history.push(`   ⏰ ${fired} timer(s) fired, ${remaining} remaining`);

        stepResults.push({
          stepIndex: i,
          passed: true,
          message: `Advanced time by ${step.duration} (${fired} timers fired)`,
        });
      }
      // ── Action Step ───────────────────────────────────────────────────
      else if (step.type === 'action') {
        history.push(`▶️ ${step.description}`);

        try {
          // Write the action code to a temp file and execute it
          // This ensures it runs in the same Node context with the time shim
          const actionScript = `
require('./__titan_time_shim.js');
try {
  ${step.code}
  console.log('__ACTION_OK__');
} catch (e) {
  console.error('__ACTION_FAIL__: ' + e.message);
  process.exit(1);
}`;
          await webContainer.writeFile('__titan_action.js', actionScript);
          const { output, exitCode } = await webContainer.executeShell(
            'node',
            ['__titan_action.js'],
            15_000
          );

          const passed = exitCode === 0 && output.includes('__ACTION_OK__');
          stepResults.push({
            stepIndex: i,
            passed,
            message: passed
              ? `Action completed: ${step.description}`
              : `Action failed: ${output.slice(0, 200)}`,
          });

          if (!passed) {
            history.push(`   ❌ Action failed: ${output.slice(0, 200)}`);
            return this.buildResult(workflow, false, stepResults, history, startTime,
              `Action step failed: ${step.description}`);
          }
          history.push('   ✅ Done');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          stepResults.push({ stepIndex: i, passed: false, message: `Action error: ${msg}` });
          history.push(`   ❌ Error: ${msg}`);
          return this.buildResult(workflow, false, stepResults, history, startTime,
            `Action step error: ${msg}`);
        }
      }
      // ── Assertion Step ────────────────────────────────────────────────
      else if (step.type === 'assertion') {
        history.push(`🔍 Checking: ${step.description}`);

        try {
          const assertScript = `
require('./__titan_time_shim.js');
try {
  const result = (${step.expression});
  console.log('__ASSERT_RESULT__:' + JSON.stringify(result));
} catch (e) {
  console.error('__ASSERT_ERROR__: ' + e.message);
  process.exit(1);
}`;
          await webContainer.writeFile('__titan_assert.js', assertScript);
          const { output, exitCode } = await webContainer.executeShell(
            'node',
            ['__titan_assert.js'],
            15_000
          );

          if (exitCode !== 0) {
            stepResults.push({
              stepIndex: i,
              passed: false,
              message: `Assertion error: ${output.slice(0, 200)}`,
              actualValue: 'ERROR',
            });
            history.push(`   ❌ Expression error: ${output.slice(0, 200)}`);
            return this.buildResult(workflow, false, stepResults, history, startTime,
              `Assertion "${step.description}" threw an error`);
          }

          // Parse the actual result
          const resultMatch = output.match(/__ASSERT_RESULT__:(.*)/);
          const actualValue = resultMatch ? resultMatch[1].trim() : undefined;
          const actual = actualValue ? JSON.parse(actualValue) : undefined;
          const passed = actual === step.expected;

          stepResults.push({
            stepIndex: i,
            passed,
            message: passed
              ? `Assertion passed: ${step.description}`
              : `Assertion failed: expected ${JSON.stringify(step.expected)}, got ${actualValue}`,
            actualValue: String(actualValue),
          });

          if (!passed) {
            history.push(`   ❌ FAILED — Expected: ${JSON.stringify(step.expected)}, Got: ${actualValue}`);
            return this.buildResult(workflow, false, stepResults, history, startTime,
              `Assertion failed: "${step.description}" — expected ${JSON.stringify(step.expected)}, got ${actualValue}`);
          }
          history.push(`   ✅ Passed (value: ${actualValue})`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          stepResults.push({ stepIndex: i, passed: false, message: `Assertion error: ${msg}` });
          history.push(`   ❌ Error: ${msg}`);
          return this.buildResult(workflow, false, stepResults, history, startTime,
            `Assertion error: ${msg}`);
        }
      }
    }

    // All steps passed
    history.push(`\n✅ Workflow "${workflow.name}" PASSED (${stepResults.length} steps)`);
    return this.buildResult(workflow, true, stepResults, history, startTime);
  }

  /**
   * Build a WorkflowResult from the current state.
   */
  private buildResult(
    workflow: WorkflowDefinition,
    success: boolean,
    stepResults: WorkflowStepResult[],
    history: string[],
    startTime: number,
    failureReason?: string
  ): WorkflowResult {
    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      success,
      stepsPassed: stepResults.filter((s) => s.passed).length,
      totalSteps: workflow.steps.length,
      failureReason,
      stepResults,
      history,
      duration: Date.now() - startTime,
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: WorkflowAuditorInstance | null = null;

export function getWorkflowAuditor(): WorkflowAuditorInstance {
  if (!_instance) {
    _instance = new WorkflowAuditorInstance();
  }
  return _instance;
}

export type { WorkflowAuditorInstance };
