import { AgentSwarmFactory } from './AgentSwarmFactory';
import { DynamicWorkflowEngine } from '@/services/DynamicWorkflowEngine';
import { AutonomyGoal, AgentTaskResult } from '@/types/autonomy';

export class AutonomyCore {
  private factory: AgentSwarmFactory;
  private engine: DynamicWorkflowEngine;

  constructor() {
    this.factory = new AgentSwarmFactory();
    this.engine = new DynamicWorkflowEngine();
  }

  /**
   * The entry point for "Self-Teaching".
   * call this when the standard pipeline fails or has low confidence.
   */
  async solveUnknown(goal: AutonomyGoal): Promise<AgentTaskResult> {
    console.log('[AutonomyCore] Solving Unknown:', goal.description);

    // 1. Fabricate a Swarm
    const swarm = await this.factory.fabricateSwarm(
      goal.description, 
      `Context: ${goal.context}\nConstraints: ${goal.technical_constraints.join(', ')}`
    );

    console.log(`[AutonomyCore] Fabricated Swarm: ${swarm.id} with ${swarm.agents.length} agents`);
    
    // 2. Execute the Swarm
    const result = await this.engine.runSwarm(swarm, goal.description);

    // 3. (Future) Self-Correction Loop
    // If result.success is false, we would ask a "Debugger" agent to analyze logs 
    // and re-run the swarm with modified prompts.

    return result;
  }
}

export const autonomyCore = new AutonomyCore();
