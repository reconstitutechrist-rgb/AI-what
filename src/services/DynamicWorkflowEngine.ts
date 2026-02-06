/**
 * Dynamic Workflow Engine
 *
 * Executes agent swarms in sequential phases: RESEARCH → ARCHITECT → CODE.
 * Each phase's output feeds into the next as context.
 *
 * Error handling:
 *   - Per-step errors are caught and logged
 *   - If a CODER agent fails, the entire run returns failure with error details
 *   - The AutonomyCore retry loop uses these errors to refine the next attempt
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { extractCode } from '@/utils/extractCode';
import type {
  AgentSwarm,
  FabricatedAgent,
  WorkflowContext,
  AgentTaskResult,
  AgentFeedback
} from '@/types/autonomy';
import type { RepoContext } from '@/types/titanPipeline';
import { googleSearchService } from '@/services/GoogleSearchService';

const MODEL_NAME = 'gemini-3-pro-preview';

const CODE_ONLY_SYSTEM_INSTRUCTION =
  'You are a code generator. Output ONLY valid TypeScript/React code. ' +
  'Never include explanations, markdown fences (```), or conversational text. ' +
  'Start directly with import statements or code. Any non-code text will break the build.';

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

export class DynamicWorkflowEngine {
  private context: WorkflowContext = {
    memory: {},
    global_files: {},
    logs: [],
  };

  /**
   * Executes a Swarm's mission step-by-step.
   * Phases run sequentially: RESEARCHERS → ARCHITECTS → CODERS.
   * If any critical phase fails, returns a structured error for the retry loop.
   *
   * @param swarm - The agent swarm to execute
   * @param initialInput - Initial task description
   * @param repoContext - Optional repo context for style matching and TDD enforcement
   */
  async runSwarm(
    swarm: AgentSwarm,
    initialInput: string,
    repoContext?: RepoContext
  ): Promise<AgentTaskResult> {
    // Reset context for each run
    this.context = { memory: {}, global_files: {}, logs: [] };

    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const codeModel = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: CODE_ONLY_SYSTEM_INSTRUCTION,
    });

    // Zero-Bug Integration: Check if task involves critical files
    let requiresTDD = false;
    if (repoContext?.criticalFilesRequireTests && repoContext.criticalFiles.length > 0) {
      // Check if any critical file is mentioned in the task
      const taskLower = initialInput.toLowerCase();
      requiresTDD = repoContext.criticalFiles.some((file) => {
        const fileName = file.split('/').pop()?.toLowerCase() || '';
        return taskLower.includes(fileName) || taskLower.includes(file.toLowerCase());
      });
      if (requiresTDD) {
        this.log('[ZERO-BUG] Critical files detected in task — TDD enforcement enabled');
      }
    }

    // Phase 1: Research (non-critical — failures are warnings, not blockers)
    const researchers = swarm.agents.filter((a) => a.role === 'RESEARCHER');
    for (const agent of researchers) {
      const result = await this.executeAgentStep(agent, model, initialInput, 'RESEARCH');
      if (!result.success) {
        this.log(`[RESEARCH] Agent ${agent.name} failed (non-critical): ${result.error}`);
        // Continue — research failures don't block the pipeline
      }
    }

    // Phase 2: Architecture / Planning
    const architects = swarm.agents.filter((a) => a.role === 'ARCHITECT');
    let plan = initialInput;
    let architectReasoning = '';
    for (const agent of architects) {
      const result = await this.executeAgentStep(agent, model, plan, 'PLANNING');
      if (!result.success) {
        this.log(`[PLANNING] Agent ${agent.name} failed: ${result.error}`);
        // Architecture failure is significant — return error for retry
        return {
          success: false,
          output: '',
          error: `Architecture phase failed (${agent.name}): ${result.error}`,
          retry_suggestion: 'Try a different architectural approach or simplify the design.',
        };
      }
      plan += `\n\nArchitecture Plan:\n${result.output}`;
      // Capture architect reasoning for the Skill Library
      architectReasoning += result.output + '\n';
    }

    // Phase 2.5: QA Engineering (TDD - Tests Written BEFORE Code)
    // The QA_ENGINEER writes test files based on the architecture plan.
    // These tests MUST fail initially (Red phase of TDD).
    // When requiresTDD is true (critical files involved), this phase is MANDATORY.
    const qaEngineers = swarm.agents.filter((a) => a.role === 'QA_ENGINEER');
    let testCode = '';
    for (const agent of qaEngineers) {
      const qaInput = `${plan}\n\n### INSTRUCTION\nWrite comprehensive tests for the above plan. Include edge cases. Output ONLY test file code.`;
      const result = await this.executeAgentStep(agent, codeModel, qaInput, 'QA_ENGINEERING');
      if (!result.success) {
        if (requiresTDD) {
          // Zero-Bug: TDD is mandatory for critical files — fail the task
          this.log(`[ZERO-BUG] QA_ENGINEERING failed and TDD is required: ${result.error}`);
          return {
            success: false,
            output: '',
            error: `[ZERO-BUG] Tests must be written before modifying critical files. QA failed: ${result.error}`,
            retry_suggestion: 'Ensure QA_ENGINEER agent can generate tests. Task involves critical files that require TDD.',
          };
        }
        this.log(`[QA_ENGINEERING] Agent ${agent.name} failed (non-critical): ${result.error}`);
        // QA failure is non-critical — we can still code without tests (fallback)
        continue;
      }
      const cleanedTests = extractCode(result.output);
      this.context.memory[`${agent.name}_tests`] = cleanedTests;
      testCode = cleanedTests;
      this.log(`[QA_ENGINEERING] Agent ${agent.name} generated tests: ${cleanedTests.length} chars`);
    }

    // Zero-Bug: If TDD is required but no tests were generated, fail
    if (requiresTDD && !testCode) {
      this.log('[ZERO-BUG] No tests generated but TDD is required for critical files');
      return {
        success: false,
        output: '',
        error: '[ZERO-BUG] No tests were generated, but this task modifies critical files. TDD is mandatory.',
        retry_suggestion: 'Add a QA_ENGINEER agent to the swarm or ensure it can generate tests.',
      };
    }

    // Inject test context into plan for coders to reference
    if (testCode) {
      plan += `\n\n### TESTS TO PASS (Your code MUST make these pass)\n\`\`\`typescript\n${testCode.slice(0, 3000)}\n\`\`\``;
    }

    // Phase 3: Coding (critical — failures are returned for retry)
    const coders = swarm.agents.filter((a) => a.role === 'CODER');
    let finalCode = '';
    for (const agent of coders) {
      const result = await this.executeAgentStep(agent, codeModel, plan, 'CODING');
      if (!result.success) {
        this.log(`[CODING] Agent ${agent.name} failed: ${result.error}`);
        return {
          success: false,
          output: '',
          error: `Code generation failed (${agent.name}): ${result.error}`,
          retry_suggestion: `The coding agent "${agent.name}" encountered an error. Consider breaking the task into smaller steps or using a different implementation approach.`,
        };
      }
      // Clean conversational wrapping from CODER output and update memory
      // so subsequent CODERs see clean code, not "Here's the implementation:..."
      const cleanedOutput = extractCode(result.output);
      this.context.memory[agent.name] = cleanedOutput;
      finalCode = cleanedOutput;
    }

    // Phase 4: Execution & Verification (The "Avatar" Loop)
    // Server agents command the client to run/test the code
    const testers = swarm.agents.filter((a) => a.role === 'DEBUGGER' || a.role === 'REVIEWER');
    for (const agent of testers) {
        // If we have code, let the tester verify it
        if (finalCode) {
            const verificationResult = await this.executeAgentStep(agent, model, finalCode, 'EXECUTION');
             
            // Check if agent requested a command execution (suspension)
            if (verificationResult.command) {
                this.log(`[EXECUTION] Agent ${agent.name} requested command: ${verificationResult.command.type}`);
                return {
                    success: false, // Not failures, just paused
                    output: finalCode,
                    command: verificationResult.command, // Return command to API -> Client
                    suspendedState: {
                        step: {
                            id: `exec_${Date.now()}`,
                            type: 'CODE', // Logical phase
                            description: 'Remote Execution',
                            dependencies: [],
                            status: 'RUNNING'
                        },
                        agentId: agent.id,
                        command: verificationResult.command,
                        swarmId: swarm.id,
                        swarm: swarm,
                        memory: this.context.memory
                    }
                };
            }

            if (!verificationResult.success) {
                this.log(`[EXECUTION] Verification failed: ${verificationResult.error}`);
                // If verification fails, return error to trigger AutonomyCore retry/healing
                return {
                    success: false,
                    output: finalCode,
                    error: `Verification failed (${agent.name}): ${verificationResult.error}`,
                    retry_suggestion: verificationResult.retry_suggestion
                };
            }
        }
    }

    // Validate that we actually got code output
    if (!finalCode || finalCode.trim().length < 10) {
      return {
        success: false,
        output: '',
        error: 'Coding phase produced empty or insufficient output.',
        retry_suggestion: 'The coders did not produce usable code. Try providing more specific instructions or examples.',
      };
    }

    this.log(`[COMPLETE] Swarm ${swarm.id} finished. Output: ${finalCode.length} chars`);

    return {
      success: true,
      output: finalCode,
      artifacts: [this.context.global_files],
      reasoning_summary: architectReasoning.trim() || undefined,
    };
  }

  /**
   * Resumes a suspended swarm execution with feedback from the client.
   * Called when the Avatar Protocol returns a result (e.g. test output).
   */
  async resumeSwarm(
    swarm: AgentSwarm, 
    suspendedState: NonNullable<AgentTaskResult['suspendedState']>, 
    feedback: AgentFeedback
  ): Promise<AgentTaskResult> {
      // 1. Restore Context
      this.context = {
          memory: suspendedState.memory,
          global_files: {}, // Re-hydrate if needed, or assume mostly stateless for now
          logs: []
      };
      
      const apiKey = getApiKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      // 2. Identify Resuming Agent
      const agent = swarm.agents.find(a => a.id === suspendedState.agentId);
      if (!agent) {
          return { success: false, output: '', error: 'Resuming agent not found in swarm' };
      }

      this.log(`[RESUME] resuming agent ${agent.name} with feedback...`);

      // 3. Construct Feedback Prompt (include code context so agent can reason about results)
      const lastCoderName = swarm.agents.filter(a => a.role === 'CODER').pop()?.name;
      const codeContext = lastCoderName && this.context.memory[lastCoderName]
        ? `\n### GENERATED CODE (for reference)\n\`\`\`tsx\n${this.context.memory[lastCoderName].slice(0, 4000)}\n\`\`\`\n`
        : '';

      const feedbackInput = `
### PREVIOUS COMMAND
Command: ${suspendedState.command.type}
Args: ${suspendedState.command.command}

### EXECUTION RESULT
Exit Code: ${feedback.exitCode}
Output:
\`\`\`
${feedback.output.slice(0, 5000)}
\`\`\`
${feedback.screenshot ? '\n(A screenshot was also captured and is available.)\n' : ''}${codeContext}
### INSTRUCTIONS
Analyze the result.
If the tests passed or the output is what you expected, return {"verdict": "pass"}.
If failed, return {"verdict": "fail"} and explain why.
You may also issue ANOTHER command if needed.
`;

      // 4. Re-run Agent Step with Feedback
      // We pass the feedback as "input" to the EXECUTION phase logic
      // The logic in executeAgentStep handles the JSON parsing
      const result = await this.executeAgentStep(agent, model, feedbackInput, 'EXECUTION_RESUME');

      // 5. Handle Result
      if (result.command) {
          // Agent wants to run *another* command (chaining commands)
           return {
                success: false,
                output: result.output,
                command: result.command,
                suspendedState: {
                    ...suspendedState,
                    command: result.command,
                    swarm: swarm, 
                    memory: this.context.memory
                }
            };
      }

      if (!result.success) {
           return {
              success: false,
              output: this.context.memory[agent.name] || '',
              error: `Verification failed after feedback: ${result.error}`,
              retry_suggestion: result.retry_suggestion
          };
      }

      // 6. If Agent satisfied, continue the Swarm (Rest of Testers)
      // Identify where we were in the tester list
      const testers = swarm.agents.filter((a) => a.role === 'DEBUGGER' || a.role === 'REVIEWER');
      const currentIndex = testers.findIndex(a => a.id === agent.id);
      const remainingTesters = testers.slice(currentIndex + 1);

      // We need 'finalCode' to pass to remaining testers
      // It should be in memory from the CODER phase
      // We can try to find the last CODER's output
      const coderName = swarm.agents.filter(a => a.role === 'CODER').pop()?.name;
      const finalCode = coderName ? this.context.memory[coderName] : '';

      if (!finalCode) {
          return { success: false, output: '', error: 'Could not recover code for remaining testers' };
      }

      for (const nextAgent of remainingTesters) {
           const nextResult = await this.executeAgentStep(nextAgent, model, finalCode, 'EXECUTION');
           if (nextResult.command) {
                return {
                    success: false, 
                    output: finalCode,
                    command: nextResult.command,
                    suspendedState: {
                        step: {
                            id: `exec_${Date.now()}`,
                            type: 'CODE',
                            description: 'Remote Execution',
                            dependencies: [],
                            status: 'RUNNING'
                        },
                        agentId: nextAgent.id,
                        command: nextResult.command,
                        swarmId: swarm.id,
                        swarm: swarm,
                        memory: this.context.memory
                    }
                };
           }
           if (!nextResult.success) {
               return nextResult;
           }
      }

      // All done!
      return {
          success: true,
          output: finalCode,
          artifacts: [this.context.global_files]
      };
  }

  private async executeAgentStep(
    agent: FabricatedAgent,
    model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
    input: string,
    phase: string
  ): Promise<AgentTaskResult> {
    this.log(`[${phase}] Agent ${agent.name} starting...`);

    try {
      // 1. Check if tools are needed (Search)
      let searchContext = '';
      if (agent.capabilities.includes('google_search')) {
        const searchPrompt = `${agent.system_prompt}\n\nTask: ${input}\n\nDetermine what to search for on Google to solve this. Return ONLY the search query. If no search needed, return "SKIP".`;
        const searchResult = await withGeminiRetry(() => model.generateContent(searchPrompt));
        const query = searchResult.response.text().trim();

        if (query !== 'SKIP' && !query.includes('SKIP')) {
          this.log(`[${phase}] Searching: "${query}"`);
          const results = await googleSearchService.search(query);
          searchContext = `\n\n### Search Results\n${results.map((r) => `- [${r.title}](${r.link}): ${r.snippet}`).join('\n')}`;
        }
      }

      // 2. Execute Core Task
      const isCoding = phase === 'CODING';
      const isExecution = phase === 'EXECUTION' || phase === 'EXECUTION_RESUME';

      let executionPrompt = '';

      if (isCoding) {
        executionPrompt = `${agent.system_prompt}

### Architecture & Context (reference only — DO NOT include in output)
${JSON.stringify(this.context.memory)}
${searchContext ? `\n### Research Results\n${searchContext}` : ''}

### Requirements
${input}

### OUTPUT FORMAT
Respond with ONLY the complete TypeScript/React code file.
Start with import statements. End with export default.
Do NOT include any explanation, markdown, or conversational text.`;
      } else if (isExecution) {
          if (phase === 'EXECUTION_RESUME') {
              // Direct Feedback injection (no code wrapping)
              executionPrompt = `${agent.system_prompt}\n\n${input}`;
          } else {
              // Initial Verification (Code needs wrapping)
              executionPrompt = `${agent.system_prompt}

### Current Code to Verify
\`\`\`tsx
${input.slice(0, 5000)} // Truncated for token limit
\`\`\`

### Instructions
You are physically running inside the user's browser via the Avatar Protocol.
To verify this code, you must issue a COMMAND.

Supported Commands:
- "shell": Run a terminal command (e.g., "npm test", "ls -la")
- "screenshot": Capture a screenshot of the rendered app
- "browser_log": Read the browser console logs

### OUTPUT FORMAT (JSON ONLY)
{
  "thought": "I need to run the tests to verify the counter increments.",
  "command": "shell",
  "arguments": "npm test"
}
OR if verification passes:
{
  "thought": "Tests passed and code looks correct.",
  "verdict": "pass"
}
OR if verification fails and you want to fail the task:
{
  "thought": "Tests failed.",
  "verdict": "fail",
  "error": "Test suite failed with exit code 1"
}`;
          }
      } else {
        // Standard (Research/Planning)
        executionPrompt = `${agent.system_prompt}

### Context from Previous Steps
${JSON.stringify(this.context.memory)}

### Search Knowledge
${searchContext}

### Current Task Input
${input}

### Instruction
Perform your role. Return the output.`;
      }

      const result = await withGeminiRetry(() => model.generateContent(executionPrompt));
      const text = result.response.text();

      // Handle Command Parsing for Execution Phase
      if (isExecution) {
          try {
              const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const json = JSON.parse(cleaned);
              
              if (json.command) {
                  return {
                      success: true,
                      output: json.thought,
                      command: {
                          id: `cmd_${Date.now()}`,
                          type: json.command,
                          command: json.arguments,
                          timeout: 30000
                      }
                  };
              } else if (json.verdict === 'fail') {
                  return {
                      success: false,
                      output: text,
                      error: json.error,
                      retry_suggestion: 'Fix the issues identified in verification.'
                  };
              } else {
                 return { success: true, output: text };
              }
          } catch (e) {
              this.log(`[EXECUTION] Failed to parse command JSON: ${e}`);
              return { success: false, output: text, error: 'Agent failed to issue valid JSON command' };
          }
      }

      // Update shared memory
      this.context.memory[agent.name] = text;
      this.context.logs.push(`[${agent.name}]: ${text.substring(0, 100)}...`);

      return { success: true, output: text };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown agent error';
      this.log(`[${phase}] Agent ${agent.name} error: ${errorMessage}`);
      return {
        success: false,
        output: '',
        error: errorMessage,
        retry_suggestion: `Agent "${agent.name}" in ${phase} phase threw: ${errorMessage}`,
      };
    }
  }

  private log(msg: string) {
    console.log(`[DynamicWorkflowEngine] ${msg}`);
    this.context.logs.push(msg);
  }
}

export const dynamicWorkflowEngine = new DynamicWorkflowEngine();
