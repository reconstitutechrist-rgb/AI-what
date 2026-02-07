import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { AgentSwarm, FabricatedAgent, AgentRole } from '@/types/autonomy';

const GEMINI_MODEL = 'gemini-3-pro-preview';

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

const FACTORY_PROMPT = `### Role
You are the **Agent Swarm Architect**.
Your goal is to design a team of specialized AI agents to solve a complex problem.

### Input
Mission: "{MISSION}"
Context: "{CONTEXT}"

### Instructions
1. Analyze the mission.
2. Determine the optimal roles needed. Available roles:
   - RESEARCHER: Gathers information via search
   - ARCHITECT: Designs the solution structure
   - QA_ENGINEER: Writes tests BEFORE code (TDD - Test Driven Development)
   - CODER: Writes implementation code to pass the tests
   - REVIEWER: Reviews code quality
   - DEBUGGER: Fixes issues
3. **CRITICAL**: For ANY coding task, you MUST include a QA_ENGINEER agent.
   The QA_ENGINEER writes tests FIRST, then the CODER writes code to pass those tests.
4. For each agent, write a **System Prompt** that defines their persona, constraints, and specific job.
5. Assign a "temperature" (creativity) level.

### Output Schema (JSON)
{
  "swarm_id": "swarm_xyz",
  "mission": "Original mission string",
  "agents": [
    {
      "id": "agent_1",
      "name": "QuantPhysics_Researcher",
      "role": "RESEARCHER",
      "system_prompt": "You are an expert in Quantum Physics simulation algorithms...",
      "capabilities": ["google_search", "read_docs"],
      "temperature": 0.4
    },
    {
      "id": "agent_2",
      "name": "TDD_Test_Writer",
      "role": "QA_ENGINEER",
      "system_prompt": "You are a QA Engineer. Write comprehensive Vitest tests BEFORE code is written. Include edge cases: empty input, error states, boundary conditions. Output ONLY test file code.",
      "capabilities": ["write_code"],
      "temperature": 0.2
    },
    {
      "id": "agent_3",
      "name": "React_Canvas_Specialist",
      "role": "CODER",
      "system_prompt": "You are a Senior React Developer. Write code that passes the tests provided by the QA_ENGINEER...",
      "capabilities": ["write_code"],
      "temperature": 0.2
    }
  ]
}
`;

export class AgentSwarmFactory {
  async fabricateSwarm(mission: string, context: string = ''): Promise<AgentSwarm> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = FACTORY_PROMPT
      .replace('{MISSION}', mission)
      .replace('{CONTEXT}', context);

    try {
      const result = await withGeminiRetry(() => model.generateContent(prompt));
      const text = result.response.text();
      const data = JSON.parse(text);
      
      return {
        id: data.swarm_id || `swarm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        mission: data.mission || mission,
        agents: data.agents.map((a: any) => ({
            id: a.id,
            name: a.name,
            role: a.role as AgentRole,
            system_prompt: a.system_prompt,
            capabilities: a.capabilities,
            temperature: a.temperature || 0.5
        }))
      };
    } catch (error) {
      console.error('Swarm Fabrication Failed:', error);
      // Fallback: Return a single generic agent
      return {
        id: `swarm_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        mission,
        agents: [
          {
            id: 'agent_generic',
            name: 'General_Solver',
            role: 'CODER',
            system_prompt: 'You are a helpful coding assistant. Solve the user problem.',
            capabilities: ['write_code', 'google_search'],
            temperature: 0.5
          }
        ]
      };
    }
  }
}

export const agentSwarmFactory = new AgentSwarmFactory();
