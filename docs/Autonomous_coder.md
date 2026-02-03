# Dream Mode + Maintainer System — Implementation Plan

## Overview

Build a browser-side autonomous maintenance system that runs in a dedicated "Dream" tab. The system ingests external repositories, discovers orphaned features, builds queued directives, finds bugs via a Chaos Monkey agent, and fixes them in a self-healing loop — all using the existing WebContainer as the execution engine.

**Runtime:** Browser-side dedicated tab with Wake Lock (no server infra needed)
**Repo Ingestion:** GitHub API zip download → JSZip → WebContainer mount
**Chaos Aggression:** REM profile default (250ms delay, 10 fixes/cycle, 30min sessions)

---

## Architecture Diagram

```
Settings Toggle (isDreaming) → /app/dream page
    ↓
MaintenanceCampaign (orchestrator loop)
    ↓
┌──────────────────────────────────────────────────────┐
│  PRIORITY LOOP:                                      │
│                                                      │
│  0. RepoLoader → mount repo in WebContainer         │
│  1. DiscoveryAgent → scan for orphaned features      │
│     → auto-populate goalQueue with wiring tasks      │
│                                                      │
│  2. CHECK goalQueue (Priority 1 — Directed Goals):   │
│     If goals pending:                                │
│       → AutonomyCore.researchAndBuild(goal)          │
│       → WebContainer rebuild + verify                │
│       → Write test for new feature                   │
│       → Mark goal COMPLETED, log, optionally commit  │
│       → Loop back to step 2                          │
│                                                      │
│  3. RUN CHAOS MONKEY (Priority 2 — Bug Hunting):    │
│     → QA_ChaosAgent stress test                      │
│     → DependencyGraph impact analysis                │
│     → AutonomyCore write patches                     │
│     → WebContainer rebuild + verify                  │
│     → Log, optionally commit                         │
│     → Repeat until budget exhausted                  │
└──────────────────────────────────────────────────────┘
    ↓
DreamLog (results stored in useAppStore)
```

---

## Files to Create (12 new files)

### 1. `src/types/dream.ts` — Dream Mode types
All type definitions for the dream system.

```typescript
// Core types:
ChaosProfile { actionDelay, sessionDuration, maxFixesPerCycle, concurrentGremlins }
CrashReport { id, crashes: CrashEntry[], timestamp, duration }
CrashEntry { error, stackTrace, stepsToReproduce, severity, file?, line? }
DreamLog { id, startedAt, endedAt, goalsCompleted, bugsFound, bugsFixed, discoveries, crashReports, patches }
DreamPatch { file, before, after, crashId?, goalId?, verified }
DependencyNode { file, imports: string[], importedBy: string[] }
DependencyGraph { nodes: Map<string, DependencyNode>, getImpacted(file): string[] }

// Directive Queue (Module 5):
DreamGoal { id, prompt, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED', source: 'user' | 'discovery', createdAt, completedAt? }

// Feature Discovery (Module 7):
DiscoveryReport { scannedFiles, discoveries: DiscoveredFeature[] }
DiscoveredFeature { file, inferredPurpose, status: 'ACTIVE' | 'PARTIALLY_CONNECTED' | 'DISCONNECTED', consumers: string[], suggestedAction }

// Settings:
DreamSettings { enabled, repoUrl?, githubToken?, chaosProfile, autoCommit, goalQueue: DreamGoal[] }
```

### 2. `src/config/chaosProfile.ts` — Chaos Monkey profiles
Three preset profiles (NAP, REM, NIGHTMARE) with configurable thresholds.

```typescript
NAP:       { actionDelay: 1000, sessionDuration: 300,  maxFixesPerCycle: 2,  concurrentGremlins: 1 }
REM:       { actionDelay: 250,  sessionDuration: 1800, maxFixesPerCycle: 10, concurrentGremlins: 1 }
NIGHTMARE: { actionDelay: 50,   sessionDuration: 3600, maxFixesPerCycle: 50, concurrentGremlins: 1 }
```

### 3. `src/services/RepoLoaderService.ts` — GitHub repo ingestion
Downloads repo as ZIP via GitHub API, extracts with JSZip, builds WebContainer `FileSystemTree`.

- `loadRepo(repoUrl: string, token?: string): Promise<FileSystemTree>`
- Skips `node_modules`, `.git`, hidden files
- Strips GitHub's root folder wrapper from zip paths
- Singleton pattern matching existing services

### 4. `src/services/DependencyGraphService.ts` — Project graph analysis
Scans all loaded files for `import ... from` statements, builds a directed dependency graph.

- `buildGraph(files: AppFile[]): DependencyGraph`
- `getImpactedFiles(graph, changedFile): string[]` — BFS traversal of reverse edges
- Handles relative imports, `@/` aliases, and npm packages
- Returns both direct and transitive dependents

### 5. `src/agents/QA_ChaosAgent.ts` — Chaos Monkey testing agent
Generates and executes integration tests to find bugs in the loaded codebase.

**Critical Constraint:** WebContainers cannot run Puppeteer/Playwright because they cannot launch a browser binary inside a browser. The Chaos Agent uses a dual-strategy approach instead.

**Strategy A — Vitest + happy-dom (Primary):**
Generates vitest integration tests that run purely in Node.js inside the WebContainer. Uses `happy-dom` (or `jsdom`) to simulate a DOM environment for component rendering, click simulation, form submission, and event handling — no real browser needed.

**Strategy B — Iframe Injection (Secondary):**
For tests requiring a real rendered DOM (visual regressions, CSS interactions), the agent injects test scripts into the LayoutCanvas iframe from the parent Dream page window via `postMessage`. The iframe runs the actual app; the injected script clicks elements, fills inputs, and reports back errors.

- `analyzeUI(files: AppFile[]): InteractableElement[]` — Parse React code for buttons, inputs, links, forms
- `generateTestSuite(elements: InteractableElement[], profile: ChaosProfile): string` — AI-generated vitest test file with happy-dom environment
- `generateIframeScript(elements: InteractableElement[], profile: ChaosProfile): string` — AI-generated script for iframe injection (Strategy B)
- `runTests(webContainer: WebContainer, options: { delay: number }): Promise<CrashReport>` — Install vitest+happy-dom, execute test suite, parse results
- `runIframeTests(iframe: HTMLIFrameElement, script: string): Promise<CrashReport>` — Inject and execute in live app iframe
- Captures test failures, uncaught exceptions, component render errors
- Returns structured `CrashReport` with steps to reproduce

**Test Generation Examples (vitest + happy-dom):**
```typescript
// Generated test: rapid form submission with empty fields
import { render, fireEvent } from '@testing-library/react';
import App from './App';

test('form handles empty submit without crashing', () => {
  const { getByRole } = render(<App />);
  const submitBtn = getByRole('button', { name: /submit/i });
  // Rapid-fire 10 clicks
  for (let i = 0; i < 10; i++) fireEvent.click(submitBtn);
});

test('input handles overflow text', () => {
  const { getByRole } = render(<App />);
  const input = getByRole('textbox');
  fireEvent.change(input, { target: { value: 'A'.repeat(100000) } });
});
```

### 6. `src/agents/DiscoveryAgent.ts` — Feature Discovery ("The Archaeologist")
Scans the loaded codebase to find orphaned, disconnected, or partially-wired features and auto-populates the goal queue.

**Logic:**
1. **Scan for "important" files**: Find `*Service.ts`, `*Manager.ts`, `*Provider.ts`, `*Hook.ts`, `*Agent.ts`, `*Engine.ts` — these usually represent major features
2. **Build connectivity map**: Using DependencyGraphService, check which of these files are actually imported/used in the main application flow (entry points like `App.tsx`, `layout.tsx`, `page.tsx`, route files)
3. **Classify status**:
   - `ACTIVE` — File is imported transitively from an entry point
   - `PARTIALLY_CONNECTED` — File is imported somewhere but not reachable from any entry point
   - `DISCONNECTED` — File is never imported by anything
4. **Infer purpose**: Use Gemini to read the file's exports, comments, and class/function names to generate a one-line description of intended behavior
5. **Auto-populate goals**: For each DISCONNECTED or PARTIALLY_CONNECTED feature, create a `DreamGoal` with `source: 'discovery'` describing the wiring task

- `scanRepository(files: AppFile[], entryPoints: string[]): Promise<DiscoveryReport>`
- `inferPurpose(file: AppFile): Promise<string>` — AI-powered purpose inference
- `generateWiringGoals(report: DiscoveryReport): DreamGoal[]` — Convert discoveries to actionable goals
- Outputs a structured `DiscoveryReport` logged to the Dream terminal

**Example output:**
```
Discovery Report:
  ACTIVE: TitanPipelineService.ts (Core code generation pipeline)
  PARTIAL: ThemeGenerator.ts (Dark mode theme generation — imported but not called from UI)
  DISCONNECTED: SecurityValidator.ts (Build-time security checks — commented out import in middleware.ts)

Auto-queued 2 goals:
  → "Wire ThemeGenerator into the settings UI with a dark mode toggle"
  → "Uncomment and fix SecurityValidator integration in middleware.ts"
```

### 7. `src/workflows/MaintenanceCampaign.ts` — Self-healing loop orchestrator
The state machine that connects Discovery → Goals → Chaos → Fix → Verify.

```
States: IDLE → LOADING → DISCOVERING → BUILDING_GOAL → CHAOS_TESTING → DIAGNOSING → PATCHING → VERIFYING → LOGGING → DONE
```

**Priority loop logic:**
```typescript
async runLoop() {
  // 0. Load repo into WebContainer
  // 1. Run DiscoveryAgent → auto-populate goalQueue with orphaned features

  while (withinBudget) {
    // PRIORITY 1: Check goalQueue (user directives + discovery goals)
    const nextGoal = this.getNextPendingGoal();
    if (nextGoal) {
      log(`Executing directive: ${nextGoal.prompt}`);
      markGoalInProgress(nextGoal.id);
      await autonomyCore.researchAndBuild({ description: nextGoal.prompt, context: repoContext });
      // Write a test for the new feature
      await chaosAgent.generateTestForFeature(nextGoal.prompt, files);
      // Rebuild + verify
      await webContainer.build();
      markGoalComplete(nextGoal.id);
      continue; // Check for more goals before chaos
    }

    // PRIORITY 2: Chaos Monkey (no goals left)
    await this.runChaosCycle();
  }
}
```

- Circuit breakers: maxFixesPerCycle, sessionDuration (from ChaosProfile)
- `onLog` callback for real-time UI updates
- Yields `DreamLog` entries for persistence
- Goals count toward the fix budget (each goal = 1 fix count)

### 8. `src/hooks/useWakeLock.ts` — Screen Wake Lock API hook
Prevents browser tab throttling and machine sleep during dream cycles.

- `useWakeLock(enabled: boolean): { isActive: boolean }`
- Re-acquires lock on visibility change (user tabs away and back)
- Graceful degradation if Wake Lock API unsupported

### 9. `src/hooks/useDreamMode.ts` — Dream Mode orchestration hook
Connects the UI to the MaintenanceCampaign workflow.

- Reads/writes dream settings from useAppStore
- Manages campaign lifecycle (start, pause, stop)
- Manages goalQueue (add, remove, reorder goals)
- Collects and persists dream logs
- Exposes `{ isDreaming, logs, stats, goalQueue, addGoal, removeGoal, start, stop, currentPhase, discoveryReport }`

### 10. `src/app/(protected)/app/dream/page.tsx` — Dream Mode UI page
Dedicated "Dream Room" with minimal overhead.

- **Terminal log** (green-on-black) showing real-time activity
- **Phase indicator** (Loading → Discovering → Building Feature → Testing → Fixing → Verifying)
- **Stats dashboard**: goals completed, bugs found, bugs fixed, discoveries, time elapsed
- **Directive Queue panel**:
  - "Add Dream Directive" input + Add button
  - List showing PENDING / IN_PROGRESS / COMPLETED / FAILED goals
  - User goals vs Discovery goals distinguished visually
  - Drag to reorder, click to remove
- **Discovery Report panel**: Shows ACTIVE / PARTIAL / DISCONNECTED features found
- Pause/Resume/Stop controls
- Hidden LayoutCanvas for WebContainer rendering + iframe testing
- Uses Wake Lock hook

### 11. `src/components/dream/DreamToggle.tsx` — Settings toggle component
Toggle switch for Dream Mode in the Settings page.

- Repo URL input field
- GitHub token (PAT) input (masked)
- Chaos profile selector (NAP / REM / NIGHTMARE)
- Auto-commit toggle
- Links to /app/dream when enabled

### 12. `src/components/dream/DirectiveQueue.tsx` — Goal queue UI component
Reusable queue component used in both Dream page and Settings.

- Text input for new directives
- Sortable list with status badges (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- Visual distinction between `source: 'user'` and `source: 'discovery'` goals
- Remove/reorder controls

---

## Files to Modify (6 existing files)

### 1. `src/types/settings.ts`
Add `DreamSettings` to `AppSettings`:

```typescript
// Add to AppSettings interface:
dream: DreamSettings;

// Add to DEFAULT_SETTINGS:
dream: {
  enabled: false,
  repoUrl: '',
  githubToken: '',
  chaosProfile: 'REM',
  autoCommit: false,
  goalQueue: [],
}

// Add 'dream' to SettingsSection type
```

### 2. `src/hooks/useSettings.ts`
Add `updateDreamSettings` to the `UseSettings` interface and implementation.

### 3. `src/contexts/SettingsContext.tsx`
Add `updateDreamSettings` handler following the existing pattern for other settings sections.

### 4. `src/components/SettingsPage.tsx`
Add "Dream Mode" section to the settings page with the DreamToggle component. New nav item in sidebar.

### 5. `src/services/WebContainerService.ts`
Add `mountGitHubRepo()` method:

```typescript
async mountGitHubRepo(repoOwnerAndName: string, token?: string): Promise<void> {
  const tree = await repoLoaderService.loadRepo(repoOwnerAndName, token);
  const instance = await this.boot();
  await instance.mount(tree);
  // Run npm install after mounting
  await this.executeShell('npm', ['install', '--no-audit', '--no-fund']);
}
```

### 6. `src/store/useAppStore.ts`
Add dream state slice:

```typescript
// New state:
dreamLogs: DreamLog[];
isDreaming: boolean;
goalQueue: DreamGoal[];
discoveryReport: DiscoveryReport | null;

// New actions:
addDreamLog(log: DreamLog): void;
setIsDreaming(value: boolean): void;
clearDreamLogs(): void;
addGoal(goal: DreamGoal): void;
removeGoal(goalId: string): void;
updateGoalStatus(goalId: string, status: DreamGoal['status']): void;
reorderGoals(goalIds: string[]): void;
setDiscoveryReport(report: DiscoveryReport): void;
```

Persist `dreamLogs`, `isDreaming`, `goalQueue` in the persist config.

---

## New Dependencies

```bash
npm install jszip
```

**Note:** `vitest`, `happy-dom`, and `@testing-library/react` are NOT installed in the host project. They are installed dynamically inside the WebContainer when the Chaos Agent runs (via `webContainer.executeShell('npm', ['install', '-D', 'vitest', 'happy-dom', '@testing-library/react'])`). This keeps the host project clean — the test deps only exist in the sandboxed WebContainer during dream cycles.

---

## Implementation Order

Execute in this order to build incrementally with testable milestones:

### Phase 1: Foundation (Types + Config)
1. `src/types/dream.ts` — All type definitions (including DreamGoal, DiscoveredFeature)
2. `src/config/chaosProfile.ts` — Chaos profiles
3. Modify `src/types/settings.ts` — Add DreamSettings with goalQueue

### Phase 2: Services (Core Logic)
4. `src/services/RepoLoaderService.ts` — GitHub zip download + mount
5. `src/services/DependencyGraphService.ts` — Import scanning + graph
6. Modify `src/services/WebContainerService.ts` — Add `mountGitHubRepo()`

### Phase 3: Agents + Workflow
7. `src/agents/QA_ChaosAgent.ts` — Chaos Monkey agent
8. `src/agents/DiscoveryAgent.ts` — Feature Discovery agent
9. `src/workflows/MaintenanceCampaign.ts` — Priority loop (Goals → Chaos)

### Phase 4: UI + Integration
10. `src/hooks/useWakeLock.ts` — Wake Lock hook
11. `src/hooks/useDreamMode.ts` — Dream Mode hook (with goal queue management)
12. Modify `src/store/useAppStore.ts` — Dream state slice + goal queue
13. Modify `src/hooks/useSettings.ts` + `src/contexts/SettingsContext.tsx` — Dream settings
14. `src/components/dream/DreamToggle.tsx` — Settings toggle
15. `src/components/dream/DirectiveQueue.tsx` — Goal queue component
16. Modify `src/components/SettingsPage.tsx` — Add dream section
17. `src/app/(protected)/app/dream/page.tsx` — Dream Room page

---

## Key Design Decisions

### Dream Loop Priority System
The MaintenanceCampaign follows a strict priority order:

1. **Discovery** (runs once at start): DiscoveryAgent scans the repo, finds orphaned features, auto-populates the goal queue
2. **Directed Goals** (Priority 1): User-queued directives AND discovery-generated wiring tasks. Titan builds features before hunting bugs.
3. **Chaos Monkey** (Priority 2): Only runs when the goal queue is empty. Stress tests the app and auto-fixes crashes.

This means: You queue "Add dark mode" + "Fix sidebar" → Titan builds both → then starts chaos testing the results.

### Feature Discovery Strategy
The DiscoveryAgent acts as a "Code Archaeologist":

1. Identifies "important" files by naming convention (`*Service`, `*Manager`, `*Provider`, `*Engine`, `*Agent`)
2. Uses DependencyGraphService to trace whether each file is reachable from entry points
3. Classifies as ACTIVE / PARTIALLY_CONNECTED / DISCONNECTED
4. Uses Gemini to infer purpose from file contents (exports, comments, class names)
5. Auto-creates DreamGoal entries for disconnected features with `source: 'discovery'`
6. Discovery goals appear in the queue with a distinct visual badge so the user can review/remove them before Titan acts

### Chaos Monkey Strategy
**Constraint:** WebContainers cannot run Puppeteer/Playwright (no browser binary inside a browser).

The QA_ChaosAgent uses a dual-strategy approach:

**Strategy A — Vitest + happy-dom (Primary, runs in WebContainer):**
1. **Static analysis**: Parse React code (regex-based) to find interactive elements (buttons, inputs, forms, links with onClick/onSubmit/onChange)
2. **AI test generation**: Feed the element list to Gemini to generate a vitest test suite using `@testing-library/react` + `happy-dom` environment — tests render components, simulate clicks/inputs/submits, and assert no crashes
3. **Execution**: WebContainer installs `vitest`, `happy-dom`, `@testing-library/react` as devDeps, runs `npx vitest run --reporter=json`, parses JSON output for failures
4. **Crash extraction**: Failed tests → structured CrashReport with component name, action, error message, stack trace

**Strategy B — Iframe Injection (Secondary, for real DOM testing):**
1. The Dream page renders the app in a hidden LayoutCanvas iframe
2. The agent generates a vanilla JS test script (no test framework needed)
3. Script is injected into the iframe via `postMessage` from the parent window
4. Script clicks buttons, fills inputs, navigates — reports errors back via `postMessage`
5. Parent window collects errors into CrashReport

**Why dual strategy:** Strategy A catches logic errors, missing error boundaries, and component crashes. Strategy B catches runtime CSS issues, event handler bugs that only manifest in a real browser DOM, and interaction timing bugs.

### Patching Strategy
When the Chaos Monkey finds a crash:
1. DependencyGraph identifies the crashed file + all files that import it
2. The CrashReport (error + stack trace + repro steps) is passed to AutonomyCore.solveUnknown()
3. AutonomyCore fabricates a targeted repair swarm (RESEARCHER reads crash, CODER writes patch)
4. WebContainer rebuilds, Chaos Monkey re-runs the same test to verify
5. If verified: log the patch, optionally auto-commit

### Auto-Commit (Optional)
When `autoCommit` is enabled in dream settings:
- Uses isomorphic-git or GitHub API to commit patches back to the repo
- Each commit message follows: `fix(dream): [description]` for bug fixes, `feat(dream): [description]` for goal completions
- This is a stretch goal — initial version logs patches without committing

### Cost Control
- REM profile default: max 10 fixes per 30-min session
- Each fix OR goal completion = 1 count toward the budget
- Estimated cost per dream cycle: $2-5 at REM profile
- NIGHTMARE profile explicitly warns about cost in UI
- Discovery agent runs once per cycle (1 Gemini call per orphaned file for purpose inference)

---

## Verification Plan

### Unit Testing
- `DependencyGraphService`: Test with mock AppFile[] containing known import chains
- `RepoLoaderService`: Test with a small public repo zip
- `QA_ChaosAgent.analyzeUI`: Test element detection against sample React code
- `DiscoveryAgent`: Test with mock files containing known orphaned services
- `MaintenanceCampaign`: Test priority logic (goals before chaos), circuit breakers

### Integration Testing
1. **Repo Loading**: Load a small public GitHub repo → verify files appear in WebContainer
2. **Dependency Graph**: Build graph from loaded repo → verify import relationships
3. **Discovery**: Run DiscoveryAgent on loaded repo → verify it finds known disconnected features
4. **Goal Execution**: Add a goal → verify MaintenanceCampaign builds it before running chaos
5. **Chaos Monkey**: Run against a known-buggy component → verify crash detection
6. **Full Loop**: Load repo → discover → build goals → chaos test → find bug → fix → verify
7. **Settings Integration**: Toggle dream mode → verify settings persist → navigate to dream page

### Manual Testing
1. Open Settings → Dream Mode section → configure repo URL + token
2. Add 2 directives: "Add a reset button" and "Refactor color palette"
3. Enable Dream Mode → redirect to /app/dream
4. Verify Wake Lock is active (screen stays on)
5. Watch Discovery phase: verify it finds orphaned features and queues them
6. Watch Goal phase: verify directives execute before chaos testing
7. Watch Chaos phase: verify it only starts after all goals complete
8. Verify circuit breakers: session stops after maxFixesPerCycle or sessionDuration
9. Run `npm run typecheck` — must pass
10. Run `npm run lint` — must pass
11. Run `npm test` — must pass
