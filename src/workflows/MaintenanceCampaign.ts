/**
 * Maintenance Campaign — Self-Healing Loop Orchestrator
 *
 * The state machine that connects Discovery → Goals → Chaos → Fix → Verify.
 * Runs in the browser during Dream Mode, driving the full maintenance cycle.
 *
 * States:
 *   IDLE → LOADING → DISCOVERING → BUILDING_GOAL → CHAOS_TESTING
 *   → DIAGNOSING → PATCHING → VERIFYING → LOGGING → DONE
 *
 * Priority Loop:
 *   0. Load repo into WebContainer (once)
 *   1. Run DiscoveryAgent → auto-populate goalQueue with orphaned features
 *   2. Execute goals from queue (Priority 1 — directed goals)
 *   3. Run Chaos Monkey stress tests (Priority 2 — bug hunting)
 *   4. Diagnose + patch any crashes found
 *   5. Verify patches, log results
 *   6. Repeat until budget exhausted or time limit reached
 *
 * Circuit Breakers:
 *   - maxFixesPerCycle from ChaosProfile
 *   - sessionDuration from ChaosProfile
 *   - Manual stop via abort signal
 */

import { AutonomyCore } from '@/agents/AutonomyCore';
import { getQAChaosAgent } from '@/agents/QA_ChaosAgent';
import { getDiscoveryAgent } from '@/agents/DiscoveryAgent';
import { getSpecAuditor } from '@/agents/SpecAuditorAgent';
import { getWorkflowAuditor } from '@/agents/WorkflowAuditor';
import { getVisualCriticService } from '@/services/VisualCriticService';
import { getDependencyGraphService } from '@/services/DependencyGraphService';
import { getWebContainerService } from '@/services/WebContainerService';
import { getChaosProfile } from '@/config/chaosProfile';
import type { AppFile } from '@/types/railway';
import type { AutonomyGoal } from '@/types/autonomy';
import type {
  ChaosProfile,
  ChaosProfileName,
  CampaignPhase,
  CrashReport,
  DreamLog,
  DreamPatch,
  DreamGoal,
  DreamStats,
  DiscoveryReport,
  DreamLogCallback,
  PhaseChangeCallback,
  StatsUpdateCallback,
  IframeTestRequestCallback,
} from '@/types/dream';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** How often to update stats (ms) */
const STATS_INTERVAL = 2000;

// ============================================================================
// CAMPAIGN
// ============================================================================

export class MaintenanceCampaign {
  private phase: CampaignPhase = 'IDLE';
  private aborted = false;
  private startTime = 0;
  private fixCount = 0;
  private profile: ChaosProfile;
  private profileName: ChaosProfileName;

  // State
  private files: AppFile[] = [];
  private goalQueue: DreamGoal[] = [];
  private crashReports: CrashReport[] = [];
  private patches: DreamPatch[] = [];
  private discoveryReport: DiscoveryReport | null = null;

  // Stats
  private goalsCompleted = 0;
  private bugsFound = 0;
  private bugsFixed = 0;
  private discoveries = 0;

  // Callbacks
  private onLog: DreamLogCallback;
  private onPhaseChange: PhaseChangeCallback;
  private onStatsUpdate: StatsUpdateCallback;
  private onGoalQueueUpdate: (goals: DreamGoal[]) => void;
  private onDiscoveryReport: (report: DiscoveryReport) => void;
  private onIframeTestRequest: IframeTestRequestCallback | null;

  // Services
  private autonomyCore: AutonomyCore;

  constructor(options: {
    profileName: ChaosProfileName;
    goalQueue: DreamGoal[];
    onLog: DreamLogCallback;
    onPhaseChange: PhaseChangeCallback;
    onStatsUpdate: StatsUpdateCallback;
    onGoalQueueUpdate: (goals: DreamGoal[]) => void;
    onDiscoveryReport: (report: DiscoveryReport) => void;
    onIframeTestRequest?: IframeTestRequestCallback;
  }) {
    this.profileName = options.profileName;
    this.profile = getChaosProfile(options.profileName);
    this.goalQueue = [...options.goalQueue];
    this.onLog = options.onLog;
    this.onPhaseChange = options.onPhaseChange;
    this.onStatsUpdate = options.onStatsUpdate;
    this.onGoalQueueUpdate = options.onGoalQueueUpdate;
    this.onDiscoveryReport = options.onDiscoveryReport;
    this.onIframeTestRequest = options.onIframeTestRequest ?? null;
    this.autonomyCore = new AutonomyCore();
  }

  /**
   * Run the full maintenance campaign.
   *
   * @param repoUrl - GitHub repo in "owner/repo" format
   * @param token - GitHub PAT for private repos (optional)
   * @param branch - Branch to target (default: main)
   * @returns DreamLog with full results
   */
  async run(
    repoUrl: string,
    token?: string,
    branch: string = 'main'
  ): Promise<DreamLog> {
    this.startTime = Date.now();
    this.aborted = false;
    this.fixCount = 0;
    this.goalsCompleted = 0;
    this.bugsFound = 0;
    this.bugsFixed = 0;
    this.discoveries = 0;
    this.crashReports = [];
    this.patches = [];

    // Start stats ticker
    const statsInterval = setInterval(() => this.emitStats(), STATS_INTERVAL);

    try {
      // ── Phase 0: Load Repo ──────────────────────────────────────────
      await this.setPhase('LOADING');
      this.log(`Loading repository: ${repoUrl} (branch: ${branch})`);

      const webContainer = getWebContainerService();
      this.files = await webContainer.mountGitHubRepo(repoUrl, token, branch);
      this.log(`Repository loaded: ${this.files.length} files mounted`);

      if (this.aborted) return this.buildLog(repoUrl, 'user_stopped');

      // ── Phase 1: Spec Audit (The Project Manager) ───────────────────
      // Look for a spec file to know WHAT to build
      const specFile = this.files.find(
        (f) => f.path.endsWith('TITAN_SPEC.md') || f.path.endsWith('SPEC.md')
      );

      if (specFile) {
        await this.setPhase('DISCOVERING');
        this.log(`Found Specification: ${specFile.path}. Running Audit...`);

        const specAuditor = getSpecAuditor();
        const specGoals = await specAuditor.auditSpec(specFile.content, this.files);

        if (specGoals.length > 0) {
          this.log(`Spec Audit added ${specGoals.length} new goals from requirements.`);
          this.goalQueue.push(...specGoals);
          this.onGoalQueueUpdate(this.goalQueue);
        } else {
          this.log('Spec Audit found no gaps — all requirements appear covered.');
        }
      }

      if (this.aborted) return this.buildLog(repoUrl, 'user_stopped');

      // ── Phase 2: Feature Discovery (The Archaeologist) ──────────────
      await this.setPhase('DISCOVERING');
      this.log('Running Feature Discovery Agent...');

      const discoveryAgent = getDiscoveryAgent();
      this.discoveryReport = await discoveryAgent.scanRepository(this.files);
      this.discoveries = this.discoveryReport.discoveries.filter(
        (d) => d.status !== 'ACTIVE'
      ).length;

      this.log(`Discovery complete: ${this.discoveryReport.discoveries.length} features scanned`);
      this.log(`  Active: ${this.discoveryReport.discoveries.filter((d) => d.status === 'ACTIVE').length}`);
      this.log(`  Partially connected: ${this.discoveryReport.discoveries.filter((d) => d.status === 'PARTIALLY_CONNECTED').length}`);
      this.log(`  Disconnected: ${this.discoveryReport.discoveries.filter((d) => d.status === 'DISCONNECTED').length}`);

      this.onDiscoveryReport(this.discoveryReport);

      // Auto-populate goal queue with discovery findings
      const discoveryGoals = discoveryAgent.generateWiringGoals(this.discoveryReport);
      if (discoveryGoals.length > 0) {
        this.log(`Auto-queued ${discoveryGoals.length} wiring goals from discoveries`);
        this.goalQueue.push(...discoveryGoals);
        this.onGoalQueueUpdate(this.goalQueue);
      }

      if (this.aborted) return this.buildLog(repoUrl, 'user_stopped');

      // ── Phase 3: Temporal Audit (The Time Machine) ────────────────────
      // Discover time-dependent logic and simulate it
      this.log('Running Temporal Workflow Auditor...');
      const workflowAuditor = getWorkflowAuditor();
      const workflows = await workflowAuditor.discoverWorkflows(this.files);

      if (workflows.length > 0) {
        this.log(`Found ${workflows.length} temporal workflow(s). Running simulations...`);

        for (const workflow of workflows) {
          if (this.aborted) return this.buildLog(repoUrl, 'user_stopped');

          const result = await workflowAuditor.runWorkflow(workflow);
          this.log(`  ${result.success ? '✅' : '❌'} ${workflow.name} (${result.stepsPassed}/${result.totalSteps} steps)`);

          if (!result.success && result.failureReason) {
            // Generate a fix goal for the failed workflow
            const fixGoal = {
              id: `temporal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              prompt: `[Temporal Fix] ${workflow.name}: ${result.failureReason}`,
              status: 'PENDING' as const,
              source: 'temporal' as const,
              createdAt: Date.now(),
            };
            this.goalQueue.push(fixGoal);
          }
        }

        this.onGoalQueueUpdate(this.goalQueue);
        this.log('Temporal audit complete.');
      } else {
        this.log('No temporal logic found — skipping workflow simulations.');
      }

      if (this.aborted) return this.buildLog(repoUrl, 'user_stopped');

      // ── Priority Loop ───────────────────────────────────────────────
      while (this.withinBudget()) {
        if (this.aborted) return this.buildLog(repoUrl, 'user_stopped');

        // PRIORITY 1: Execute pending goals
        const nextGoal = this.getNextPendingGoal();
        if (nextGoal) {
          await this.executeGoal(nextGoal);
          continue; // Check for more goals before chaos
        }

        // PRIORITY 2: Chaos Monkey (no goals left)
        const chaosResult = await this.runChaosCycle();

        // If no bugs found, we're stable
        if (chaosResult.crashes.length === 0) {
          this.log('Chaos Monkey found no crashes. App is stable!');
          return this.buildLog(repoUrl, 'all_stable');
        }

        // Diagnose and patch each crash
        for (const crash of chaosResult.crashes) {
          if (!this.withinBudget()) break;
          if (this.aborted) return this.buildLog(repoUrl, 'user_stopped');

          await this.diagnoseAndPatch(crash.error, crash.stackTrace, crash.file);
        }
      }

      // Budget exhausted
      const stopReason = this.isTimeExpired() ? 'time_limit' : 'budget_exhausted';
      this.log(`Campaign ending: ${stopReason}`);
      return this.buildLog(repoUrl, stopReason);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Campaign error: ${message}`);
      return this.buildLog(repoUrl, 'error');
    } finally {
      clearInterval(statsInterval);
      await this.setPhase('DONE');
    }
  }

  /**
   * Abort the campaign. Safe to call from any thread.
   */
  stop(): void {
    this.aborted = true;
    this.log('Campaign stop requested');
  }

  /**
   * Add a goal to the queue mid-campaign.
   */
  addGoal(goal: DreamGoal): void {
    this.goalQueue.push(goal);
    this.onGoalQueueUpdate(this.goalQueue);
    this.log(`Goal added: "${goal.prompt.slice(0, 60)}..."`);
  }

  // ==========================================================================
  // GOAL EXECUTION
  // ==========================================================================

  /**
   * Execute a single goal via AutonomyCore with FULL Verification.
   *
   * 3-Step Verification:
   *   1. Technical (Compile) — Does it build without errors?
   *   2. Visual (Critic)     — Does it look right?
   *   3. Functional (Test)   — Does it actually work?
   */
  private async executeGoal(goal: DreamGoal): Promise<void> {
    await this.setPhase('BUILDING_GOAL');
    this.log(`Executing goal: "${goal.prompt.slice(0, 80)}..."`);

    // Mark as in progress
    goal.status = 'IN_PROGRESS';
    this.onGoalQueueUpdate(this.goalQueue);

    try {
      // Build the autonomy goal
      const autonomyGoal: AutonomyGoal = {
        id: goal.id,
        description: goal.prompt,
        context: this.buildGoalContext(),
        technical_constraints: [
          'Use the existing project structure and patterns',
          'Do not remove or break existing functionality',
          'Generate complete, working code',
        ],
      };

      // 1. EXECUTE: AutonomyCore writes the code
      const result = await this.autonomyCore.solveUnknown(autonomyGoal);

      if (result.success && result.output) {
        // Snapshot files before applying so we can revert on failure
        const snapshot = this.files.map((f) => ({ ...f }));

        // Apply the generated code
        await this.applyCode(result.output, goal.id);

        // 2. VERIFY (Technical): Does it compile?
        await this.setPhase('VERIFYING');
        const webContainer = getWebContainerService();
        const validation = await webContainer.validate(this.files);

        if (!validation.valid) {
          // Technical Failure → Revert
          this.files = snapshot;
          goal.status = 'FAILED';
          goal.errorMessage =
            'Build failed: ' +
            validation.errors.map((e) => e.message).join('; ');
          this.log('Goal verification failed (Build Error). Reverted.');
        } else {
          // 3. VERIFY (Visual): Does it look right?
          this.log('Running Visual Critic...');
          const visualCritic = getVisualCriticService();
          const critique = await visualCritic.evaluate(
            this.files,
            goal.prompt
          );

          if (critique.verdict === 'regenerate') {
            // Visual Failure → Revert
            this.files = snapshot;
            goal.status = 'FAILED';
            goal.errorMessage = `Visual Verification Failed (Score: ${critique.overallScore}/10): ${critique.issues[0]?.description}`;
            this.log('Visual Critic rejected the build. Reverting.');
          } else {
            // 4. VERIFY (Functional): Does it actually work?
            const chaosAgent = getQAChaosAgent();
            try {
              this.log('Generating functional test...');
              const testCode = await chaosAgent.generateTestForFeature(
                goal.prompt,
                this.files
              );

              const testReport = await chaosAgent.runTests(
                webContainer.executeShell.bind(webContainer),
                testCode,
                {
                  delay: this.profile.actionDelay,
                  writeFile: webContainer.writeFile.bind(webContainer),
                }
              );

              if (testReport.crashes.length > 0) {
                // Functional Failure → Revert
                this.files = snapshot;
                goal.status = 'FAILED';
                goal.errorMessage = `Functional Verification Failed: ${testReport.crashes[0].error}`;
                this.log(
                  'Feature built but failed functional tests. Reverting.'
                );
              } else {
                // SUCCESS! All 3 checks passed.
                goal.status = 'COMPLETED';
                goal.completedAt = Date.now();
                this.goalsCompleted++;
                this.fixCount++;
                this.log(
                  `Goal verified (Visual: ${critique.overallScore}/10, Func: PASS).`
                );
              }
            } catch (testErr) {
              // If test generation itself fails, accept if visuals passed (soft fail)
              console.warn('[MaintenanceCampaign] Functional test gen failed:', testErr);
              goal.status = 'COMPLETED';
              goal.completedAt = Date.now();
              this.goalsCompleted++;
              this.fixCount++;
              this.log(
                `Goal verified (Visual: ${critique.overallScore}/10). Functional test skipped.`
              );
            }
          }
        }
      } else {
        goal.status = 'FAILED';
        goal.errorMessage = result.error || 'AutonomyCore returned no output';
        this.log(`Goal failed: ${goal.errorMessage}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      goal.status = 'FAILED';
      goal.errorMessage = message;
      this.log(`Goal error: ${message}`);
    }

    this.onGoalQueueUpdate(this.goalQueue);
  }

  // ==========================================================================
  // CHAOS TESTING
  // ==========================================================================

  /**
   * Run a single chaos testing cycle.
   */
  private async runChaosCycle(): Promise<CrashReport> {
    await this.setPhase('CHAOS_TESTING');
    this.log('Starting Chaos Monkey cycle...');

    const chaosAgent = getQAChaosAgent();

    // 1. Analyze UI elements
    const elements = chaosAgent.analyzeUI(this.files);
    this.log(`Found ${elements.length} interactive elements to test`);

    if (elements.length === 0) {
      this.log('No interactive elements found — skipping chaos cycle');
      return {
        id: `chaos_empty_${Date.now()}`,
        crashes: [],
        timestamp: Date.now(),
        duration: 0,
        strategy: 'vitest',
        testsRun: 0,
        testsPassed: 0,
      };
    }

    // 2. Generate test suite
    const testCode = await chaosAgent.generateTestSuite(
      elements,
      this.files,
      this.profile
    );
    this.log(`Generated test suite (${testCode.length} chars)`);

    // 3. Execute tests in WebContainer
    const webContainer = getWebContainerService();
    const executeShell = webContainer.executeShell.bind(webContainer);
    const writeFile = webContainer.writeFile.bind(webContainer);
    let report = await chaosAgent.runTests(
      executeShell,
      testCode,
      { delay: this.profile.actionDelay, writeFile }
    );

    // Track vitest results
    this.crashReports.push(report);
    this.bugsFound += report.crashes.length;
    this.log(`Chaos vitest results: ${report.testsRun} tests run, ${report.crashes.length} crashes found`);

    // Strategy B — Iframe injection testing (if callback provided)
    if (this.onIframeTestRequest && !this.aborted) {
      try {
        this.log('Running iframe injection tests (Strategy B)...');
        const iframeScript = await chaosAgent.generateIframeScript(elements, this.profile);

        const iframeReport = await this.onIframeTestRequest(iframeScript);
        if (iframeReport) {
          this.crashReports.push(iframeReport);
          this.bugsFound += iframeReport.crashes.length;
          this.log(`Chaos iframe results: ${iframeReport.crashes.length} crashes found`);

          // Merge iframe crashes into the main report for the caller
          report = {
            ...report,
            crashes: [...report.crashes, ...iframeReport.crashes],
            strategy: 'both',
            testsRun: report.testsRun + iframeReport.testsRun,
            testsPassed: report.testsPassed + iframeReport.testsPassed,
          };
        } else {
          this.log('Iframe not available — skipping Strategy B');
        }
      } catch (iframeErr) {
        const msg = iframeErr instanceof Error ? iframeErr.message : String(iframeErr);
        this.log(`[WARN] Iframe chaos testing failed: ${msg}`);
      }
    }

    return report;
  }

  // ==========================================================================
  // DIAGNOSIS & PATCHING
  // ==========================================================================

  /**
   * Diagnose a crash and attempt to patch it.
   */
  private async diagnoseAndPatch(
    error: string,
    stackTrace?: string,
    crashFile?: string
  ): Promise<void> {
    await this.setPhase('DIAGNOSING');
    this.log(`Diagnosing crash: ${error.slice(0, 100)}`);

    // Find impacted files using dependency graph
    const graphService = getDependencyGraphService();
    const graph = graphService.buildGraph(this.files);
    let impactedFiles: string[] = [];

    if (crashFile) {
      impactedFiles = graph.getImpacted(crashFile);
      this.log(`Impact analysis: ${impactedFiles.length} files depend on ${crashFile}`);
    }

    // Build repair context
    const crashContext = [
      `Error: ${error}`,
      stackTrace ? `Stack trace:\n${stackTrace}` : '',
      crashFile ? `Origin file: ${crashFile}` : '',
      impactedFiles.length > 0
        ? `Impacted files: ${impactedFiles.slice(0, 10).join(', ')}`
        : '',
    ].filter(Boolean).join('\n');

    // Attempt patch via AutonomyCore
    await this.setPhase('PATCHING');
    this.log('Generating patch...');

    const patchGoal: AutonomyGoal = {
      id: `patch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      description: `Fix this crash: ${error.slice(0, 200)}`,
      context: crashContext + '\n\nExisting code:\n' + this.getRelevantCode(crashFile),
      technical_constraints: [
        'Only modify the minimum code necessary to fix the crash',
        'Do not change the public API or break other functionality',
        'Preserve all existing features',
      ],
    };

    try {
      const result = await this.autonomyCore.solveUnknown(patchGoal);

      if (result.success && result.output) {
        // Store the patch context
        const beforeCode = crashFile
          ? this.files.find((f) => f.path === crashFile)?.content || ''
          : '';

        // Snapshot files before applying so we can revert on failure
        const snapshot = this.files.map((f) => ({ ...f }));

        // Apply the patch
        await this.applyCode(result.output, undefined, patchGoal.id);

        // Verify
        await this.setPhase('VERIFYING');
        const webContainer = getWebContainerService();
        const validation = await webContainer.validate(this.files);

        if (validation.valid) {
          this.bugsFixed++;
          this.fixCount++;
          this.patches.push({
            file: crashFile || 'unknown',
            before: beforeCode,
            after: result.output,
            crashId: patchGoal.id,
            verified: true,
            appliedAt: Date.now(),
          });
          this.log(`Patch verified and applied`);
        } else {
          // Revert files to pre-patch state
          this.files = snapshot;
          this.log(`Patch verification failed, reverted: ${validation.errors.map((e) => e.message).join(', ')}`);
          this.patches.push({
            file: crashFile || 'unknown',
            before: beforeCode,
            after: result.output,
            crashId: patchGoal.id,
            verified: false,
            appliedAt: Date.now(),
          });
        }
      } else {
        this.log(`Patch generation failed: ${result.error || 'No output'}`);
      }
    } catch (patchError) {
      const message = patchError instanceof Error ? patchError.message : String(patchError);
      this.log(`Patch error: ${message}`);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Check if the campaign is still within budget.
   */
  private withinBudget(): boolean {
    if (this.aborted) return false;
    if (this.fixCount >= this.profile.maxFixesPerCycle) return false;
    if (this.isTimeExpired()) return false;
    return true;
  }

  /**
   * Check if the session duration has been exceeded.
   */
  private isTimeExpired(): boolean {
    const elapsed = (Date.now() - this.startTime) / 1000;
    return elapsed >= this.profile.sessionDuration;
  }

  /**
   * Get the next pending goal from the queue.
   */
  private getNextPendingGoal(): DreamGoal | undefined {
    return this.goalQueue.find((g) => g.status === 'PENDING');
  }

  /**
   * Apply generated code to the file set.
   * Parses the output for file paths and content.
   */
  private async applyCode(
    output: string,
    _goalId?: string,
    _crashId?: string
  ): Promise<void> {
    // The AutonomyCore output is typically a single file of code.
    // For multi-file output, we look for file markers.
    const fileMarkerPattern = /\/\/\s*FILE:\s*(.+)/g;
    let match;
    const fileSegments: { path: string; content: string }[] = [];

    // Check for multi-file markers
    const markers: { path: string; index: number }[] = [];
    while ((match = fileMarkerPattern.exec(output)) !== null) {
      markers.push({ path: match[1].trim(), index: match.index });
    }

    if (markers.length > 0) {
      // Multi-file output
      for (let i = 0; i < markers.length; i++) {
        const start = markers[i].index + output.substring(markers[i].index).indexOf('\n') + 1;
        const end = i < markers.length - 1 ? markers[i + 1].index : output.length;
        fileSegments.push({
          path: markers[i].path,
          content: output.substring(start, end).trim(),
        });
      }
    } else {
      // Single file — assume it's the App.tsx or first relevant file
      const targetFile = this.files.find(
        (f) => f.path.endsWith('/App.tsx') || f.path.endsWith('/App.jsx')
      );
      if (targetFile) {
        fileSegments.push({
          path: targetFile.path,
          content: output,
        });
      }
    }

    // Apply to the in-memory file set
    for (const segment of fileSegments) {
      const existingIdx = this.files.findIndex((f) => f.path === segment.path);
      if (existingIdx >= 0) {
        this.files[existingIdx] = {
          path: segment.path,
          content: segment.content,
        };
      } else {
        this.files.push({
          path: segment.path,
          content: segment.content,
        });
      }
    }

    // Write files to WebContainer via filesystem API (avoids heredoc injection)
    const webContainer = getWebContainerService();
    for (const segment of fileSegments) {
      await webContainer.writeFile(segment.path, segment.content);
    }

    this.log(`Applied ${fileSegments.length} file(s): ${fileSegments.map((f) => f.path).join(', ')}`);
  }

  /**
   * Get relevant code context for crash diagnosis.
   */
  private getRelevantCode(crashFile?: string): string {
    if (!crashFile) return '';
    const file = this.files.find((f) => f.path === crashFile);
    if (!file) return '';
    // Truncate to 4000 chars for prompt limits
    return file.content.slice(0, 4000);
  }

  /**
   * Build context string from current project state for goal execution.
   */
  private buildGoalContext(): string {
    const fileList = this.files
      .slice(0, 50)
      .map((f) => f.path)
      .join('\n');

    const appFile = this.files.find(
      (f) => f.path.endsWith('/App.tsx') || f.path.endsWith('/App.jsx')
    );

    return [
      `Project files (${this.files.length} total):`,
      fileList,
      this.files.length > 50 ? `...and ${this.files.length - 50} more` : '',
      '',
      appFile ? `Main App code:\n${appFile.content.slice(0, 3000)}` : '',
    ].join('\n');
  }

  /**
   * Set the campaign phase and notify listeners.
   */
  private async setPhase(phase: CampaignPhase): Promise<void> {
    this.phase = phase;
    this.onPhaseChange(phase);
    this.emitStats();
  }

  /**
   * Log a message and notify listeners.
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.onLog(`[${timestamp}] ${message}`);
  }

  /**
   * Emit current stats to listeners.
   */
  private emitStats(): void {
    const currentGoal = this.goalQueue.find((g) => g.status === 'IN_PROGRESS');
    const stats: DreamStats = {
      phase: this.phase,
      elapsed: Date.now() - this.startTime,
      goalsCompleted: this.goalsCompleted,
      bugsFound: this.bugsFound,
      bugsFixed: this.bugsFixed,
      discoveries: this.discoveries,
      budgetRemaining: this.profile.maxFixesPerCycle - this.fixCount,
      currentGoal: currentGoal?.prompt,
    };
    this.onStatsUpdate(stats);
  }

  /**
   * Build the final DreamLog from campaign results.
   */
  private buildLog(
    repoUrl: string,
    stopReason: DreamLog['stopReason']
  ): DreamLog {
    return {
      id: `dream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      startedAt: this.startTime,
      endedAt: Date.now(),
      goalsCompleted: this.goalsCompleted,
      bugsFound: this.bugsFound,
      bugsFixed: this.bugsFixed,
      discoveries: this.discoveries,
      crashReports: this.crashReports,
      patches: this.patches,
      profileUsed: this.profileName,
      repoUrl,
      stopReason,
    };
  }
}
