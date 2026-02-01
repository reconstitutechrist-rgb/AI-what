import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentSwarm, FabricatedAgent, WorkflowContext, AgentTaskResult } from '@/types/autonomy';
import { googleSearchService } from '@/services/GoogleSearchService';

const MODEL_NAME = 'gemini-3-pro-preview';

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

export class DynamicWorkflowEngine {
  private context: WorkflowContext = {
    memory: {},
    global_files: {},
    logs: []
  };

  /**
   * Executes a Swarm's mission step-by-step.
   * This is a simplified sequential execution. In a real DAG, we'd handle dependencies.
   */
  async runSwarm(swarm: AgentSwarm, initialInput: string): Promise<AgentTaskResult> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 1. Research Phase (if Researcher exists)
    const researchers = swarm.agents.filter(a => a.role === 'RESEARCHER');
    for (const agent of researchers) {
      await this.executeAgentStep(agent, model, initialInput, 'RESEARCH');
    }

    // 2. Planning/Architect Phase
    const architects = swarm.agents.filter(a => a.role === 'ARCHITECT');
    let plan = initialInput;
    for (const agent of architects) {
      const result = await this.executeAgentStep(agent, model, plan, 'PLANNING');
      plan += `\n\nArchitecture Plan:\n${result.output}`;
    }

    // 3. Coding Phase
    const coders = swarm.agents.filter(a => a.role === 'CODER');
    let finalCode = '';
    for (const agent of coders) {
      const result = await this.executeAgentStep(agent, model, plan, 'CODING');
      finalCode = result.output; // Assuming last coder produces final output for now
    }

    return {
      success: true,
      output: finalCode,
      artifacts: [this.context.global_files]
    };
  }

  private async executeAgentStep(
    agent: FabricatedAgent, 
    model: any, 
    input: string, 
    phase: string
  ): Promise<AgentTaskResult> {
    this.log(`[${phase}] Agent ${agent.name} starting...`);

    // 1. Check if tools are needed (Search)
    let searchContext = '';
    if (agent.capabilities.includes('google_search')) {
      // Ask agent what to search
      const searchPrompt = `${agent.system_prompt}\n\nTask: ${input}\n\nDetermine what to search for on Google to solve this. Return ONLY the search query. If no search needed, return "SKIP".`;
      const result = await model.generateContent(searchPrompt);
      const query = result.response.text().trim();
      
      if (query !== 'SKIP' && !query.includes('SKIP')) {
        this.log(`[${phase}] Searching: "${query}"`);
        const results = await googleSearchService.search(query);
        searchContext = `\n\n### Search Results\n${results.map(r => `- [${r.title}](${r.link}): ${r.snippet}`).join('\n')}`;
      }
    }

    // 2. Execute Core Task
    const executionPrompt = `
      ${agent.system_prompt}
      
      ### Context from Previous Steps
      ${JSON.stringify(this.context.memory)}

      ### Search Knowledge
      ${searchContext}

      ### Current Task Input
      ${input}

      ### Instruction
      Perform your role. Return the output.
    `;

    try {
      const result = await model.generateContent(executionPrompt);
      const output = result.response.text();
      
      // Update memory
      this.context.memory[agent.name] = output;
      this.context.logs.push(`[${agent.name}]: ${output.substring(0, 100)}...`);
      
      return { success: true, output };
    } catch (e: any) {
       this.log(`[${phase}] Error: ${e.message}`);
       return { success: false, output: '', error: e.message };
    }
  }

  private log(msg: string) {
    console.log(`[DynamicWorkflowEngine] ${msg}`);
    this.context.logs.push(msg);
  }
}

export const dynamicWorkflowEngine = new DynamicWorkflowEngine();
