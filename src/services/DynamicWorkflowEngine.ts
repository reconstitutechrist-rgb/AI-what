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
import type { AgentSwarm, FabricatedAgent, WorkflowContext, AgentTaskResult } from '@/types/autonomy';
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
   */
  async runSwarm(swarm: AgentSwarm, initialInput: string): Promise<AgentTaskResult> {
    // Reset context for each run
    this.context = { memory: {}, global_files: {}, logs: [] };

    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const codeModel = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: CODE_ONLY_SYSTEM_INSTRUCTION,
    });

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

      // 2. Execute Core Task — CODING phase uses a code-only prompt template
      //    to reinforce the systemInstruction and prevent conversational wrapping
      const isCoding = phase === 'CODING';
      const executionPrompt = isCoding
        ? `${agent.system_prompt}

### Architecture & Context (reference only — DO NOT include in output)
${JSON.stringify(this.context.memory)}
${searchContext ? `\n### Research Results\n${searchContext}` : ''}

### Requirements
${input}

### OUTPUT FORMAT
Respond with ONLY the complete TypeScript/React code file.
Start with import statements. End with export default.
Do NOT include any explanation, markdown, or conversational text.
Any non-code output will crash the build system.`
        : `${agent.system_prompt}

### Context from Previous Steps
${JSON.stringify(this.context.memory)}

### Search Knowledge
${searchContext}

### Current Task Input
${input}

### Instruction
Perform your role. Return the output.`;

      const result = await withGeminiRetry(() => model.generateContent(executionPrompt));
      const output = result.response.text();

      // Update shared memory
      this.context.memory[agent.name] = output;
      this.context.logs.push(`[${agent.name}]: ${output.substring(0, 100)}...`);

      return { success: true, output };
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
