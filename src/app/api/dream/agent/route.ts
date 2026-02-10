/**
 * Dream Mode Agent Proxy
 *
 * Unified server-side proxy for all Dream Mode AI agents.
 * MaintenanceCampaign runs in the browser but agents need process.env API keys.
 * This route dispatches to the correct agent on the server.
 *
 * Actions:
 *   - discovery.scan       → DiscoveryAgent.scanRepository()
 *   - discovery.goals      → DiscoveryAgent.generateWiringGoals()
 *   - spec.audit           → SpecAuditor.auditSpec()
 *   - workflow.discover    → WorkflowAuditor.discoverWorkflows()
 *   - workflow.run         → WorkflowAuditor.runWorkflow()
 *   - chaos.generateSuite  → QAChaosAgent.generateTestSuite()
 *   - chaos.generateTest   → QAChaosAgent.generateTestForFeature()
 *   - chaos.iframeScript   → QAChaosAgent.generateIframeScript()
 *   - autonomy.solve       → AutonomyCore.solveUnknown()
 *   - critic.evaluate      → VisualCriticService.evaluate()
 */

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120; // Allow up to 2 minutes for long agent runs

export async function POST(req: NextRequest) {
  try {
    const { action, payload } = await req.json();

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    switch (action) {
      // ── Discovery Agent ────────────────────────────────────────────
      case 'discovery.scan': {
        const { getDiscoveryAgent } = await import('@/agents/DiscoveryAgent');
        const agent = getDiscoveryAgent();
        const report = await agent.scanRepository(payload.files, payload.entryPoints);
        return NextResponse.json({ result: report });
      }

      case 'discovery.goals': {
        const { getDiscoveryAgent } = await import('@/agents/DiscoveryAgent');
        const agent = getDiscoveryAgent();
        const goals = agent.generateWiringGoals(payload.report);
        return NextResponse.json({ result: goals });
      }

      // ── Spec Auditor ───────────────────────────────────────────────
      case 'spec.audit': {
        const { getSpecAuditor } = await import('@/agents/SpecAuditorAgent');
        const auditor = getSpecAuditor();
        const goals = await auditor.auditSpec(payload.specContent, payload.files);
        return NextResponse.json({ result: goals });
      }

      // ── Workflow Auditor ───────────────────────────────────────────
      case 'workflow.discover': {
        const { getWorkflowAuditor } = await import('@/agents/WorkflowAuditor');
        const auditor = getWorkflowAuditor();
        const workflows = await auditor.discoverWorkflows(payload.files);
        return NextResponse.json({ result: workflows });
      }

      // NOTE: workflow.run is NOT proxied — it uses WebContainer (browser-only).
      // It runs client-side in MaintenanceCampaign via dynamic import.

      // ── QA Chaos Agent ─────────────────────────────────────────────
      case 'chaos.generateSuite': {
        const { getQAChaosAgent } = await import('@/agents/QA_ChaosAgent');
        const agent = getQAChaosAgent();
        const testCode = await agent.generateTestSuite(
          payload.elements,
          payload.files,
          payload.profile
        );
        return NextResponse.json({ result: testCode });
      }

      case 'chaos.generateTest': {
        const { getQAChaosAgent } = await import('@/agents/QA_ChaosAgent');
        const agent = getQAChaosAgent();
        const testCode = await agent.generateTestForFeature(
          payload.goalPrompt,
          payload.files
        );
        return NextResponse.json({ result: testCode });
      }

      case 'chaos.iframeScript': {
        const { getQAChaosAgent } = await import('@/agents/QA_ChaosAgent');
        const agent = getQAChaosAgent();
        const script = await agent.generateIframeScript(
          payload.elements,
          payload.profile
        );
        return NextResponse.json({ result: script });
      }

      // ── Autonomy Core ──────────────────────────────────────────────
      case 'autonomy.solve': {
        const { AutonomyCore } = await import('@/agents/AutonomyCore');
        const core = new AutonomyCore();
        const result = await core.solveUnknown(payload.goal);
        return NextResponse.json({ result });
      }

      // ── Visual Critic ──────────────────────────────────────────────
      case 'critic.evaluate': {
        const { getVisualCriticService } = await import(
          '@/services/VisualCriticService'
        );
        const critic = getVisualCriticService();
        const critique = await critic.evaluate(
          payload.files,
          payload.goalPrompt
        );
        return NextResponse.json({ result: critique });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Dream Agent Proxy] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
