import { GoogleGenerativeAI } from '@google/generative-ai';
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
2. Determine the optimal roles needed (e.g., Researcher, Architect, Coder, Debugger).
3. For each agent, write a **System Prompt** that defines their persona, constraints, and specific job.
4. Assign a "temperature" (creativity) level.

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
      "name": "React_Canvas_Specialist",
      "role": "CODER",
      "system_prompt": "You are a Senior React Developer specializing in HTML5 Canvas...",
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
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = JSON.parse(text);
      
      return {
        id: data.swarm_id || `swarm_${Date.now()}`,
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
        id: `swarm_fallback_${Date.now()}`,
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
