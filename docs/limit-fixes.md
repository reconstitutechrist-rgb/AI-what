# OmniChat Pipeline - Deep Analysis

## Overview

OmniChat is the conversational AI brain of the Virtual World Engine. It uses **Claude Sonnet 4.5** for intent classification and routes user requests through one of four action paths: **pipeline**, **autonomy**, **live-edit**, or **none**. Its core philosophy: *"ANYTHING is possible. There are no impossible requests."*

---

## Architecture Summary

```
User Input (OmniChat UI)
    │
    ├── Media attached? ──→ Skip chat, go directly to Pipeline
    │
    └── Text only ──→ Planning Mode? ──→ VisionBoardService (PRD building)
                       │
                       └── Building Mode ──→ OmniChatService (intent classification)
                                                │
                            ┌───────────────────┼───────────────────┐
                            ↓                   ↓                   ↓
                        'pipeline'          'autonomy'          'live-edit'
                            │                   │                   │
                            └───────┬───────────┘                   │
                                    ↓                               ↓
                            Titan Pipeline                  refineComponent()
                            (Router detects mode)           (quick code edit)
                                    │
                                    ↓
                            WebContainer Validation
                                    │
                            Auto-Repair Loop (max 5)
                                    │
                            Visual Critique (async)
                                    │
                            Skill Library Feedback
                                    │
                            Sandpack Preview
```

---

## Core Files & Responsibilities

### 1. UI Layer

| File | Lines | Role |
|------|-------|------|
| [OmniChat.tsx](src/components/interface/OmniChat.tsx) | ~428 | Chat UI — text input, media uploads, message display, status indicators |
| [LayoutBuilderView.tsx](src/components/LayoutBuilderView.tsx) | ~500 | Main orchestrator — connects OmniChat to useLayoutBuilder, routes messages |

### 2. Business Logic

| File | Lines | Role |
|------|-------|------|
| [OmniChatService.ts](src/services/OmniChatService.ts) | ~392 | AI brain — Claude Sonnet 4.5 intent classification + Skill Library integration |
| [useLayoutBuilder.ts](src/hooks/useLayoutBuilder.ts) | ~903 | Pipeline orchestration hook — sendChatMessage, executeAction, runPipeline, validateAndRepair |
| [TitanPipelineService.ts](src/services/titanPipeline/TitanPipelineService.ts) | Large | Code generation — Router → Surveyor → Builder stages |

### 3. Supporting Services

| File | Role |
|------|------|
| [SkillLibraryService.ts](src/services/SkillLibraryService.ts) | Vector cache — pgvector similarity search, quality feedback loop |
| [VisionBoardService.ts](src/services/VisionBoardService.ts) | Planning Mode — Claude-powered PRD building |
| [TechScoutService.ts](src/services/TechScoutService.ts) | Web research — Tavily search for optimal tech stack |
| [BlueprintPlannerService.ts](src/services/BlueprintPlannerService.ts) | Build planning — phased decomposition with self-review |
| [WebContainerService.ts](src/services/WebContainerService.ts) | Sandbox validation — in-browser Node.js (npm install + build) |
| [CodeRepairService.ts](src/services/CodeRepairService.ts) | Auto-repair — Gemini Pro with tiered strategies (SURGICAL / IMPORT_FIX / REBUILD) |
| [VisualCriticService.ts](src/services/VisualCriticService.ts) | Quality gate — Puppeteer screenshot → Gemini Flash evaluation |
| [DynamicWorkflowEngine.ts](src/services/DynamicWorkflowEngine.ts) | Agent swarms — RESEARCH → ARCHITECT → QA → CODER → DEBUGGER phases |

### 4. State Management

| File | Role |
|------|------|
| [useChatStore.ts](src/store/useChatStore.ts) | Persistent message history (Zustand + persist) |
| [useAppStore.ts](src/store/useAppStore.ts) | Central app state — generatedFiles, visionDocument, chatMode, appConcept |

### 5. API Routes

| Endpoint | Route File | Purpose |
|----------|-----------|---------|
| `/api/layout/chat` | [chat/route.ts](src/app/api/layout/chat/route.ts) | OmniChat intent classification |
| `/api/layout/pipeline` | [pipeline/route.ts](src/app/api/layout/pipeline/route.ts) | Titan Pipeline code generation |
| `/api/layout/repair` | repair/route.ts | CodeRepairService auto-fix |
| `/api/layout/critique` | critique/route.ts | VisualCritic evaluation |
| `/api/layout/screenshot` | screenshot/route.ts | Puppeteer screenshot capture |
| `/api/layout/vision` | vision/route.ts | VisionBoard planning mode |
| `/api/skills/*` | skills routes | Skill Library CRUD |

---

## Detailed Workflows

### Workflow 1: Standard Chat → Pipeline Generation

```
1. User types in OmniChat.tsx
2. OmniChat calls onSendMessage(text, media)
3. LayoutBuilderView.handleSendMessage()
   └── Adds user message to useChatStore
   └── Calls useLayoutBuilder.sendChatMessage()
4. POST /api/layout/chat
5. OmniChatService.chat():
   a. Query SkillLibrary (similarity > 0.78, quality > 0.4)
   b. Build system prompt with: code context, app context, skill context
   c. Call Claude Sonnet 4.5 (max 2048 tokens)
   d. Parse JSON: { reply, action: 'pipeline', actionPayload: { instructions } }
   e. If skill reused → fire-and-forget incrementUsage()
6. Response returned to LayoutBuilderView
7. Display assistant reply in OmniChat
8. executeAction('pipeline', instructions, cachedSkillId)
9. runPipeline([], instructions, appContext, cachedSkillId)
10. POST /api/layout/pipeline
    a. TechScout researches tech (15s timeout)
    b. Router determines mode: CREATE / EDIT / MERGE / WORLD_BUILD
    c. BlueprintPlanner decomposes into phases with self-review
    d. Parallel: Surveyor (vision) + Physicist (motion) + Photographer (assets)
    e. Builder synthesizes code → AppFile[]
    f. Vision Healing Loop (optional)
11. Client receives AppFile[]
12. validateAndRepair():
    a. WebContainer.validate(files) — install + build
    b. If errors → CodeRepairService (up to 5 attempts, tiered strategy)
    c. Return validated files
13. Update state: generatedFiles → useAppStore (persisted) + undo history
14. Sandpack renders live preview
15. Fire-and-forget: VisualCritic screenshots & scores (1-10)
16. If cachedSkillId → update quality score in SkillLibrary
```

### Workflow 2: Autonomy Mode (Self-Teaching)

```
1-8. Same as Workflow 1, but OmniChat returns action: 'autonomy'
9. runPipeline() — same entry point
10. POST /api/layout/pipeline
    a. Router detects RESEARCH_AND_BUILD mode
    b. DynamicWorkflowEngine.runSwarm() activated
    c. Agent phases:
       - RESEARCH: Web search agents (Tavily)
       - ARCHITECT: Solution design agents
       - QA_ENGINEER: TDD test writing (mandatory for critical files)
       - CODER: Code generation agents
       - DEBUGGER/REVIEWER: Verification agents
    d. Avatar Protocol: agents can issue commands
       - { type: 'shell', command: 'npm test' }
       - { type: 'screenshot' }
       - { type: 'browser_log' }
    e. Returns { files?, command?, suspendedState? }
11. If suspended (command issued):
    a. Client executes command in WebContainer
    b. Sends feedback to /api/layout/autonomy/feedback
    c. DynamicWorkflowEngine.resumeSwarm()
    d. Agent analyzes → verdict or next command
    e. Repeat (max 10 iterations)
12. Once files returned → same validation/critique flow
```

### Workflow 3: Planning Mode (Vision Board)

```
1. User is in chatMode: 'planning'
2. Message routed to VisionBoardService (NOT OmniChat)
3. POST /api/layout/vision
4. VisionBoardService.chat() uses Claude Sonnet 4.5:
   - Creative PRD building prompt
   - Returns { reply, visionUpdate? }
   - visionUpdate is partial VisionDocument merge
5. VisionDocument accumulates in useAppStore
6. User reviews VisionPreview component
7. When user says "build it":
   a. Switch chatMode → 'building'
   b. Flatten VisionDocument into instructions
   c. TechScout researches tech stack
   d. Enter standard pipeline flow
```

### Workflow 4: Live Edit (Quick Code Tweaks)

```
1-7. Same as Workflow 1, but OmniChat returns action: 'live-edit'
8. executeAction('live-edit', instructions, selectedDataId)
9. refineComponent(selectedDataId, instructions, outerHTML)
10. Lightweight pipeline call — code-in → code-out
11. Update specific component in generatedFiles
```

---

## Key Types

### OmniChat Types (from [titanPipeline.ts](src/types/titanPipeline.ts))

```typescript
type OmniChatAction = 'pipeline' | 'autonomy' | 'live-edit' | 'none'

interface OmniChatRequest {
  message: string
  conversationHistory: OmniConversationMessage[]
  currentCode: string | null
  appContext?: AppContext
}

interface OmniChatResponse {
  reply: string
  action: OmniChatAction
  actionPayload?: {
    instructions: string
    selectedDataId?: string   // live-edit target
    cachedSkillId?: string    // skill library feedback
  }
}

interface OmniConversationMessage {
  role: 'user' | 'assistant'
  content: string
}
```

### ChatMessage (from [useChatStore.ts](src/store/useChatStore.ts))

```typescript
interface ChatMessage {
  id: string                 // msg_{timestamp}_{random9}
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: {
    context?: string         // "Selected Component: #header"
    relatedFile?: string
  }
}
```

---

## Design Patterns

### 1. Singleton Services
All services use lazy `get*Service()` initialization — one instance per runtime.

### 2. Fire-and-Forget
Non-critical async ops don't block the main flow:
- Skill Library queries (fails gracefully → proceed without cache)
- Skill usage increments
- Quality score updates
- Visual critique (runs in background after preview)

### 3. Graceful Degradation
- Skill Library unavailable → proceed without cache
- JSON parsing fails → treat response as plain text, action='none'
- Auth missing → return empty results (not an error)
- TechScout timeout → return empty dossier

### 4. Context Window Management
- **Pin first message** — original user intent always included
- **Truncate code** — 200 lines max for code context
- **Truncate skills** — 2000 chars with smart function boundaries
- **Limit history** — 20 messages max in Claude context

### 5. Self-Healing Loop
Pipeline output → WebContainer validation → if errors → CodeRepairService → re-validate (max 5 attempts) with escalating strategies (SURGICAL → IMPORT_FIX → REBUILD).

### 6. Quality Feedback Loop
```
OmniChat → SkillLibrary match → Pipeline generates → Visual Critic scores
  → Score updates cached skill quality → Future queries filter by quality
```

---

## Timeouts & Limits

| Operation | Timeout/Limit |
|-----------|--------------|
| Claude chat response | 2048 max tokens |
| Conversation history | 20 messages |
| WebContainer npm install | 45s |
| WebContainer build | 45s |
| Auto-repair attempts | 5 max |
| Avatar Protocol iterations | 10 max |
| TechScout research | 15s |
| Skill similarity threshold | 0.78 |
| Skill duplicate threshold | 0.88 |
| Skill min quality | 0.4 |
| Pipeline API total | 120s |

---

## State Flow

```
┌─ useChatStore (persisted) ─────────────────────────────┐
│  messages: ChatMessage[]  (full conversation history)   │
│  isThinking: boolean                                     │
└─────────────────────────────────────────────────────────┘

┌─ useAppStore (persisted) ──────────────────────────────┐
│  chatMode: 'planning' | 'building'                      │
│  visionDocument: VisionDocument | null                   │
│  generatedFiles: AppFile[]  (synced from hook)          │
│  appConcept: AppConcept | null                           │
│  isDreaming: boolean                                     │
└─────────────────────────────────────────────────────────┘

┌─ useLayoutBuilder (transient) ─────────────────────────┐
│  generatedFiles: AppFile[]  (synced TO store)           │
│  isProcessing, isChatting, isValidating, isCritiquing   │
│  pipelineProgress: PipelineProgress | null              │
│  errors[], warnings[], validationErrors[]               │
│  critiqueScore: number | null                            │
│  history[], future[]  (undo/redo stacks)                │
└─────────────────────────────────────────────────────────┘
```

Bidirectional sync between `useLayoutBuilder.generatedFiles` and `useAppStore.generatedFiles` via useEffect watchers — hook writes to store on pipeline completion, store changes (project switching) hydrate the hook.

---

## Critical Integration Points

1. **OmniChat → LayoutBuilderView** — Props: `onSendMessage`, `isProcessing`, `isChatting`, `pipelineProgress`, `activeAction`
2. **LayoutBuilderView → useLayoutBuilder** — `sendChatMessage()`, `executeAction()`, `runPipeline()`
3. **OmniChatService → SkillLibrary** — `findSimilarSkills()` before Claude call, `incrementUsage()` after
4. **useLayoutBuilder → WebContainer** — `validateAndRepair()` after pipeline
5. **VisualCritic → SkillLibrary** — `updateQualityScore()` after critique
6. **DynamicWorkflowEngine ↔ Client** — Avatar Protocol suspend/resume command loop

---

## Avatar Protocol — Deep Dive

The Avatar Protocol is a **suspend/resume remote execution system** that lets server-side AI agents control the client's browser sandbox. It bridges the gap between server-side AI reasoning and client-side code execution, enabling agents to adaptively debug generated code.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                             │
│  DynamicWorkflowEngine → Agent issues JSON command              │
│  Engine SUSPENDS, snapshots full state                          │
│  Returns: { command, suspendedState } to client                 │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP Response
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                             │
│  useLayoutBuilder.handleAvatarCommand()                         │
│  Executes command in WebContainer/Browser                       │
│  Captures: output, exitCode, screenshot                         │
│  POSTs feedback to /api/layout/autonomy/feedback                │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP POST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                             │
│  DynamicWorkflowEngine.resumeSwarm()                            │
│  Restores context + memory from suspendedState                  │
│  Re-runs agent with feedback prompt                             │
│  Agent returns: verdict (pass/fail) OR another command           │
└─────────────────────────────────────────────────────────────────┘
```

### Files Involved

| File | Lines | Role |
|------|-------|------|
| [DynamicWorkflowEngine.ts](src/services/DynamicWorkflowEngine.ts) | ~580 | Server-side suspend/resume, agent prompt, command parsing |
| [useLayoutBuilder.ts](src/hooks/useLayoutBuilder.ts) | ~441-583 | Client-side `handleAvatarCommand()` — execution + feedback |
| [autonomy/feedback/route.ts](src/app/api/layout/autonomy/feedback/route.ts) | ~66 | Feedback API — receives results, calls `resumeSwarm()` |
| [AutonomyCore.ts](src/agents/AutonomyCore.ts) | ~132 | Entry point — `solveUnknown()` wraps DynamicWorkflowEngine |
| [WebContainerService.ts](src/services/WebContainerService.ts) | ~506 | `executeShell()` — runs commands in sandbox |
| [autonomy.ts](src/types/autonomy.ts) | ~136 | Types: `AgentCommand`, `AgentFeedback`, `SuspendedExecution` |

### Type Definitions

```typescript
// src/types/autonomy.ts

type AgentCommandType = 'shell' | 'screenshot' | 'browser_log'

interface AgentCommand {
  id: string               // "cmd_{timestamp}"
  type: AgentCommandType
  command?: string          // For 'shell' — e.g. "npm test"
  timeout?: number          // Default 30000ms
}

interface AgentFeedback {
  commandId: string
  output: string
  exitCode: number
  screenshot?: string       // Base64 data URI (for 'screenshot')
}

interface SuspendedExecution {
  step: StrategyStep
  agentId: string           // Which agent issued the command
  command: AgentCommand
  swarmId: string
  swarm: AgentSwarm         // FULL swarm definition (stateless resumption)
  memory: Record<string, any>  // Context snapshot including __global_files
}
```

### Control Flow — Step by Step

#### Phase 1: Agent Issues Command (Server)

When a DEBUGGER/REVIEWER agent enters the EXECUTION phase in `DynamicWorkflowEngine.runSwarm()`, it receives a prompt telling it to verify code via the Avatar Protocol:

```
Supported Commands:
- "shell": Run a terminal command (e.g., "npm test", "ls -la")
- "screenshot": Capture a screenshot of the rendered app
- "browser_log": Read the browser console logs

OUTPUT FORMAT (JSON ONLY):
{"thought": "...", "command": "shell", "arguments": "npm test"}
  OR
{"thought": "...", "verdict": "pass"}
  OR
{"thought": "...", "verdict": "fail", "error": "..."}
```

The engine parses the agent's JSON response:
- `command` field present → **Suspend**: snapshot state, return command to client
- `verdict: "pass"` → **Continue**: proceed to next tester or finish
- `verdict: "fail"` → **Failure**: return error, AutonomyCore may retry with new swarm

#### Phase 2: Command Execution (Client)

`handleAvatarCommand()` in [useLayoutBuilder.ts:441-583](src/hooks/useLayoutBuilder.ts#L441-L583) receives the command and executes it:

**Shell command:**
```typescript
const [cmd, ...args] = parseShellArgs(command.command)  // Handles quoted args
const execResult = await webContainer.executeShell(cmd, args, command.timeout || 30000)
// Returns: { output: string, exitCode: number }
```

**Screenshot command:**
```typescript
const response = await fetch('/api/layout/screenshot', {
  body: JSON.stringify({ files: currentFiles, viewport: { width: 1280, height: 800 } })
})
// Returns: { success: boolean, image: string (base64) }
```

**Browser log command:**
```typescript
// Currently returns WebContainer validation errors only (NOT live Sandpack console)
const currentErrors = validationErrorsRef.current
output = currentErrors.map(e => `[${e.type}] ${e.message}...`).join('\n')
// Known limitation: "Console log capture from live preview is not yet available."
```

#### Phase 3: Feedback Submission (Client → Server)

```typescript
const feedback: AgentFeedback = { commandId, output, exitCode, screenshot }
const response = await fetch('/api/layout/autonomy/feedback', {
  body: JSON.stringify({ feedback, suspendedState })
})
```

#### Phase 4: Resume & Analyze (Server)

`DynamicWorkflowEngine.resumeSwarm()` restores context from `suspendedState` and re-runs the agent with a feedback prompt:

```
### PREVIOUS COMMAND
Command: shell | Args: npm test

### EXECUTION RESULT
Exit Code: 0
Output: "Test Suites: 1 passed, 1 total..."

### INSTRUCTIONS
Analyze the result. Return {"verdict": "pass"}, {"verdict": "fail"},
or issue ANOTHER command if needed.
```

Three outcomes:
1. **Another command** → Return `{ command, suspendedState }` → client recurses (iteration + 1)
2. **Verdict: pass** → Continue to remaining testers in swarm, then return final files
3. **Verdict: fail** → Return error to AutonomyCore for potential retry

#### Phase 5: Command Chaining (Recursive)

Client-side recursion in `handleAvatarCommand()`:

```typescript
if (result.command && result.suspendedState) {
  // Server wants another command — recurse
  await handleAvatarCommand(result.command, result.suspendedState,
                             instructions, currentFiles, iteration + 1)
} else if (result.files) {
  // Final files received — validate and display
  const validatedFiles = await validateAndRepair(result.files, instructions)
  updateFilesWithHistory(validatedFiles)
}
```

### Guards & Limits

| Guard | Value | Location | Purpose |
|-------|-------|----------|---------|
| MAX_AVATAR_ITERATIONS | 10 | useLayoutBuilder.ts:439 | Prevent infinite command loops |
| Command timeout | 30s default | DynamicWorkflowEngine.ts:511 | Per-command execution limit |
| Shell timeout exit code | 124 | WebContainerService.ts:385-394 | Standard timeout convention |
| Pipeline timeout | 120s | TitanPipelineService.ts:45 | Overall pipeline (NOT Avatar) |

### Stateless Design

The `suspendedState` includes the **entire swarm definition** and **memory snapshot**. This means:
- Server creates a **fresh DynamicWorkflowEngine** per feedback request (no shared state)
- No session affinity required — scales horizontally
- Survives server restarts
- Each request is self-contained

```typescript
// feedback/route.ts — fresh instance per request
const engine = new DynamicWorkflowEngine()
const result = await engine.resumeSwarm(suspendedState.swarm, suspendedState, feedback)
```

### Entry Point: AutonomyCore.solveUnknown()

[AutonomyCore.ts](src/agents/AutonomyCore.ts) wraps DynamicWorkflowEngine:

```
1. Fabricate agent swarm from goal description
2. engine.runSwarm(swarm, description)
3. If result.command → return immediately (pass through to client)
4. If result.success → quick syntax check → return
5. If failure → retry with error context (up to MAX_RETRIES)
```

Key: When a command is issued, AutonomyCore does **not** retry — it passes the suspended state straight through to the pipeline API response.

### Pipeline Integration

TitanPipelineService detects `RESEARCH_AND_BUILD` mode from the Router:
```
Router → mode: RESEARCH_AND_BUILD → AutonomyCore.solveUnknown()
  → DynamicWorkflowEngine.runSwarm()
    → Agent issues command → suspend
  → Return { files, command, suspendedState } through API
```

Client detects `command` in pipeline response and enters Avatar Protocol loop.

### UI Progress Updates

During Avatar Protocol execution, the pipeline progress indicator shows:
- `"Avatar: Running shell (npm test)..."` — while command executes
- `"Avatar: Command completed (exit 0), analyzing..."` — while server analyzes
- `"Autonomy Active: Researching, fabricating agents..."` — OmniChat status (purple indicator)

### Known Limitations

1. **`browser_log` only returns WebContainer validation errors** — not live Sandpack console output. The Sandpack iframe is sandboxed. Future fix: Puppeteer-based console capture.

2. **Screenshots use server-side Puppeteer** — not direct iframe capture from Sandpack (browser security constraints).

3. **No streaming** — entire command output is captured then sent as one feedback payload. Large outputs are truncated to 5000 chars in the agent prompt.

4. **Agent JSON parsing** — if the agent fails to produce valid JSON, it's treated as a failure and AutonomyCore retries with a new swarm.

5. **No parallel commands** — agents issue one command at a time. Each must complete before the next can be issued.

### Example Round-Trip

```
[Server] DebuggerAgent EXECUTION phase:
  → {"thought": "Run tests to verify", "command": "shell", "arguments": "npm test"}
  → Engine suspends, returns command + state

[Client] handleAvatarCommand(iteration=0):
  → parseShellArgs("npm test") → ["npm", "test"]
  → webContainer.executeShell("npm", ["test"], 30000)
  → Output: "Tests: 3 passed", exitCode: 0
  → POST /api/layout/autonomy/feedback

[Server] resumeSwarm() with feedback:
  → Agent prompt: "Exit Code: 0, Output: Tests: 3 passed..."
  → Agent: {"thought": "All tests pass", "verdict": "pass"}
  → No more testers → return { success: true, output: <final code> }

[Client] Receives files:
  → validateAndRepair(files)
  → updateFilesWithHistory(validatedFiles)
  → Sandpack renders preview
```

---

## Bugs, Architectural Issues & Enhancement Opportunities

### P0 — Crash / Data Loss

#### P0-1: Race Condition in useLayoutBuilder State Sync
- **File**: [useLayoutBuilder.ts:226-247](src/hooks/useLayoutBuilder.ts#L226-L247)
- **Issue**: Bidirectional sync between local `generatedFiles` state and Zustand store uses a `syncRef` flag that can be corrupted during rapid state updates (e.g., user switches projects while pipeline is running).
- **Impact**: Lost pipeline results, stale state after project switching, corrupted undo/redo history.
- **Fix**: Single source of truth — either Zustand owns files exclusively, or use an atomic sync queue.

#### P0-2: Avatar Protocol Fetch Has No Timeout
- **File**: [useLayoutBuilder.ts:449-451, 551-555](src/hooks/useLayoutBuilder.ts#L449-L555)
- **Issue**: The feedback API fetch (line 551) has no `AbortSignal.timeout()`. If the server hangs, the client waits forever. The iteration counter only advances on successful recursion, so a stuck fetch means the MAX_AVATAR_ITERATIONS guard never fires.
- **Impact**: Browser tab hangs indefinitely. User must force-close.
- **Fix**: Add `signal: AbortSignal.timeout(60000)` to the feedback fetch.

#### P0-3: WebContainer Validation Queue Starvation
- **File**: [WebContainerService.ts:171-178](src/services/WebContainerService.ts#L171-L178)
- **Issue**: Validation queue chains with `.then(() => validateImpl())`. If `validateImpl` throws synchronously (before any `await`), the queue promise chain breaks and all subsequent validations hang forever.
- **Impact**: After one sync error, every future pipeline run freezes at "Validating..." permanently until page refresh.
- **Fix**: Wrap `validateImpl` call in `Promise.resolve().then(...)` to catch synchronous throws.

---

### P1 — Broken Feature

#### P1-1: OmniChat "Pin First Message" Pins Welcome Message
- **File**: [OmniChatService.ts:157-169](src/services/OmniChatService.ts#L157-L169)
- **Issue**: Pin logic checks `history[0]?.role === 'user'`, but the first entry is often the welcome message (role: 'assistant'). When it's not a user message, the pin is skipped entirely. After 20 messages, original user intent is lost from context.
- **Impact**: In long conversations, AI drifts from the original goal. Responses become less relevant.
- **Fix**: Find the actual first user message with `history.findIndex(m => m.role === 'user')`.

#### P1-2: Vision Auto-Save Creates Duplicate Projects
- **File**: [LayoutBuilderView.tsx:320-327](src/components/LayoutBuilderView.tsx#L320-L327)
- **Issue**: Auto-save on first vision input has no guard against concurrent calls. Rapid typing triggers multiple `saveProject()` calls before the first completes.
- **Impact**: Projects list fills with duplicates. User has to manually clean up.
- **Fix**: Add an `isAutoSaving` guard flag.

#### P1-3: Avatar Protocol Memory Grows Unbounded
- **File**: [DynamicWorkflowEngine.ts:195-213](src/services/DynamicWorkflowEngine.ts#L195-L213)
- **Issue**: `suspendedState.memory` includes `__global_files` with potentially large base64 data. This is serialized in every API response/request. After 3-4 iterations with screenshots, the JSON payload can exceed ~10MB.
- **Impact**: Feedback fetch fails with "body too large". Avatar loop breaks mid-execution.
- **Fix**: Prune memory entries >50KB before suspension. Truncate with a marker.

#### P1-4: Skill Library Usage Count Can Be Hallucinated
- **File**: [OmniChatService.ts:318-325](src/services/OmniChatService.ts#L318-L325)
- **Issue**: Usage increment is triggered by string-matching `USE_CACHED_SKILL:{id}` in Claude's response. But Claude can mention this string without actually using the skill (e.g., "I could USE_CACHED_SKILL:abc but I'll generate fresh").
- **Impact**: Bad skills accumulate inflated usage counts and surface more frequently. Quality degrades over time.
- **Fix**: Don't rely on string matching. Compare generated code similarity to cached skill, or use a structured `cachedSkillId` field in the JSON response.

---

### P2 — Degraded Experience

#### P2-1: Repair Attempt Counter Not Reset Between Runs
- **File**: [useLayoutBuilder.ts:289-361](src/hooks/useLayoutBuilder.ts#L289-L361)
- **Issue**: `repairAttempts` state persists across pipeline runs. If first run uses 3 attempts, second run only gets 2 before hitting the max (5).
- **Impact**: Repair success rate degrades after the first pipeline run. Users see "could not be auto-repaired" prematurely.
- **Fix**: Reset `repairAttempts` to 0 at the start of `runPipeline()`.

#### P2-2: Pipeline Timeout Kills Avatar Protocol Loops
- **File**: [TitanPipelineService.ts:60-68](src/services/titanPipeline/TitanPipelineService.ts#L60-L68)
- **Issue**: `PIPELINE_TIMEOUT_MS = 120s` applies to the entire pipeline including Avatar Protocol. But Avatar loops can legitimately take longer (test suites, multiple screenshot commands).
- **Impact**: Complex autonomy tasks fail with "Pipeline timeout" even when making progress.
- **Fix**: Extend timeout to 300s during Avatar loops, or exempt Avatar from the timeout.

#### P2-3: Chat Hydration Mismatch
- **File**: [useChatStore.ts:72-89](src/store/useChatStore.ts#L72-L89)
- **Issue**: Migration function always overwrites messages with a fresh welcome message, even if persisted messages exist. Causes React hydration warnings and message flicker on page load.
- **Fix**: Only add welcome message if `messages` array is empty or missing.

#### P2-4: Vision Serialization Crashes on Partial Updates
- **File**: [LayoutBuilderView.tsx:152-191](src/components/LayoutBuilderView.tsx#L152-L191)
- **Issue**: `serializeVisionForPipeline` assumes `vision.features` is iterable, but partial API updates can leave it undefined.
- **Impact**: "Cannot read property 'map' of undefined" when clicking "Start Building" after incomplete vision updates.
- **Fix**: Default to empty array: `(vision.features || []).map(...)`.

#### P2-5: Auto-Scroll Resets Position While Reading
- **File**: [OmniChat.tsx:124-128](src/components/interface/OmniChat.tsx#L124-L128)
- **Issue**: Auto-scroll `useEffect` triggers on `isProcessing` and `isChatting` changes, not just new messages. Forces scroll to bottom even when user scrolled up to read history.
- **Impact**: Annoying UX — can't read old messages during pipeline runs.
- **Fix**: Only auto-scroll when `messages.length` increases (use ref to track previous length).

---

### P3 — Minor / Cosmetic

#### P3-1: Error Messages Expose Internals
- **Files**: Multiple (useLayoutBuilder, WebContainerService, OmniChatService)
- **Issue**: Users see messages like "WebContainer validation unavailable (no cross-origin isolation)". Not actionable.
- **Fix**: Add a user-friendly error mapping layer.

#### P3-2: Dead `chatMessages` Slice in useAppStore
- **File**: [useAppStore.ts:370-386](src/store/useAppStore.ts#L370-L386)
- **Issue**: `chatMessages` exists in useAppStore but is never used (all chat uses useChatStore). Dead code.
- **Fix**: Remove the unused slice.

---

### Architectural Issues

#### ARCH-1: No Backpressure for Concurrent Pipeline Runs
- `processingRef` guard silently drops duplicate requests. User gets no feedback.
- **Fix**: Implement a visible request queue with "1 request queued" indicator.

#### ARCH-2: Avatar Protocol Has No Per-Command-Type Budget
- `MAX_AVATAR_ITERATIONS=10` applies globally. Screenshots are expensive but get same budget as shell commands.
- **Fix**: Per-type budgets: `{ shell: 15, screenshot: 5, browser_log: 10 }`.

#### ARCH-3: useLayoutBuilder Is Too Large (903 lines)
- Single hook handles: chat, pipeline, validation, repair, Avatar Protocol, critique, undo/redo, state sync, file management.
- **Fix**: Extract into focused hooks: `useAvatarProtocol`, `useValidationRepair`, `usePipelineExecution`, `useFileHistory`.

---

### Enhancement Opportunities

#### ENH-1: Streaming Chat Responses (SSE)
- Currently waits for full Claude round-trip before showing response.
- Streaming would feel 2-3x faster. Modern AI products all do this.

#### ENH-2: Request Deduplication
- Double-clicking send runs two identical pipelines.
- Hash message + timestamp, dedupe within 5 seconds.

#### ENH-3: Persist Pipeline Progress Across Refresh
- Page refresh during pipeline run loses all progress.
- Persist progress state and show "Resume" button on reload.

#### ENH-4: Skill Library Time Decay
- Old skills with high historical usage never decay.
- Apply 0.95 multiplier per month to keep library fresh.

#### ENH-5: Circuit Breaker for External APIs
- Repeated Gemini/Claude failures have no backoff or circuit breaker.
- Add circuit breaker pattern with exponential backoff.

---

### Priority Matrix

| Issue | Severity | Effort | Files Affected |
|-------|----------|--------|----------------|
| P0-1: State sync race | P0 | High | useLayoutBuilder.ts |
| P0-2: Avatar fetch timeout | P0 | Low | useLayoutBuilder.ts |
| P0-3: Validation queue break | P0 | Low | WebContainerService.ts |
| P1-1: Pin first message | P1 | Low | OmniChatService.ts |
| P1-2: Auto-save duplicates | P1 | Low | LayoutBuilderView.tsx |
| P1-3: Avatar memory growth | P1 | Medium | DynamicWorkflowEngine.ts |
| P1-4: Skill usage hallucination | P1 | Medium | OmniChatService.ts |
| P2-1: Repair counter reset | P2 | Low | useLayoutBuilder.ts |
| P2-2: Pipeline timeout Avatar | P2 | Low | TitanPipelineService.ts |
| P2-3: Chat hydration mismatch | P2 | Low | useChatStore.ts |
| P2-4: Vision features crash | P2 | Low | LayoutBuilderView.tsx |
| P2-5: Auto-scroll reset | P2 | Low | OmniChat.tsx |
| ARCH-3: Hook decomposition | ARCH | High | useLayoutBuilder.ts (split) |

---

## Known Limitations (Full Catalog)

### 3D / Screenshot Path

#### LIM-1: ReactToHtmlService Cannot Render 3D Canvas
- **File**: [ReactToHtmlService.ts:20-24, 122-174](src/services/ReactToHtmlService.ts)
- **Issue**: Only loads React/ReactDOM/Babel/Tailwind CDN. No Three.js, R3F, or Drei stubs. 3D imports are stripped by `processCodeForBrowser`, producing blank/black canvas.
- **Impact**: All 3D screenshots are blank. Visual Critic can't evaluate 3D. Healing loop exits immediately.
- **Feasibility**: Hard (Three.js has no UMD bundle)
- **Fix**: Replace ReactToHtmlService screenshot path with Sandpack iframe capture via Puppeteer.

#### LIM-2: VisionLoopEngine Early Exit for 3D
- **File**: [VisionLoopEngine.ts:106-118](src/services/VisionLoopEngine.ts)
- **Issue**: Returns `screenshot_failed` immediately when screenshot capture fails (always happens for 3D).
- **Impact**: No iterative visual improvement for 3D scenes. Fidelity remains 0.
- **Feasibility**: Easy (once LIM-1 is fixed)
- **Fix**: Add 3D detection flag; for 3D, use iframe capture instead of ReactToHtmlService.

#### LIM-3: Visual Critic Blank Canvas Workaround
- **File**: [VisualCriticService.ts:112-113](src/services/VisualCriticService.ts)
- **Issue**: Hardcoded "give 5-6 score if canvas is blank" workaround. 3D-specific critique prompts (lines 59-114) exist but never activate because screenshots are blank.
- **Impact**: False quality scores for 3D. Skill Library stores inaccurate quality data.
- **Feasibility**: Medium (once LIM-1 is fixed, remove workaround)

#### LIM-4: ReactToHtmlService Has Limited Library Stubs
- **File**: [ReactToHtmlService.ts:122-174](src/services/ReactToHtmlService.ts)
- **Issue**: Only stubs for lucide-react, framer-motion, clsx, tailwind-merge. Generated code using zustand, axios, react-query fails to render.
- **Impact**: Screenshots fail for modern React patterns. Limits Visual Critic accuracy.
- **Feasibility**: Hard (can't load arbitrary npm packages without bundler)
- **Fix**: Use Sandpack iframe capture (already has a bundler) instead.

### Avatar Protocol

#### LIM-5: browser_log Returns Only Validation Errors
- **File**: [useLayoutBuilder.ts:516-523](src/hooks/useLayoutBuilder.ts#L516-L523)
- **Issue**: Returns WebContainer validation errors, NOT live Sandpack console. Message: "Console log capture from live preview is not yet available."
- **Impact**: Dream Mode agents can't see runtime errors. Autonomous debugging limited to build-time only.
- **Feasibility**: Medium
- **Fix**: Add `postMessage` bridge from Sandpack iframe to parent. New `get_console_logs` command reads buffer.

#### LIM-6: No Parallel Avatar Commands
- **Issue**: Agents issue one command at a time. Each completes before the next starts.
- **Impact**: Slower autonomy iteration cycles. Can't simultaneously check logs + screenshot.
- **Feasibility**: Easy
- **Fix**: Command queue manager — READ operations (screenshot, logs, status) run in parallel; WRITE operations (shell) remain serial.

#### LIM-7: Agent Output Truncated at 5000 Chars
- **File**: [DynamicWorkflowEngine.ts:293, 447](src/services/DynamicWorkflowEngine.ts)
- **Issue**: Feedback output, test code, and generated code all truncated (3000-5000 chars). Agents miss critical context.
- **Impact**: Quality degradation for complex multi-file projects. Agent can't see full error in long stack traces.
- **Feasibility**: Medium
- **Fix**: Smart truncation (keep imports + error lines + boundaries, summarize middle). Increase limits for Opus agents.

### Pipeline Timeouts & Limits

#### LIM-8: Pipeline 2-Minute Global Timeout
- **File**: [TitanPipelineService.ts:45, 59-68](src/services/titanPipeline/TitanPipelineService.ts)
- **Issue**: `PIPELINE_TIMEOUT_MS = 120_000` applies to entire pipeline. Complex 3D + Avatar can exceed this.
- **Fix**: 5min for WORLD_BUILD/RESEARCH_AND_BUILD modes; keep 2min for standard.

#### LIM-9: WebContainer 45s Install/Build Timeouts
- **File**: [WebContainerService.ts:38, 41](src/services/WebContainerService.ts)
- **Issue**: Large dependency trees (Three.js + Rapier + Drei) may timeout. Slow networks affected.
- **Fix**: Increase BUILD_TIMEOUT to 60s. Add retry with backoff for network failures.

#### LIM-10: Claude Polish Pass 10s Timeout
- **File**: [builder.ts:746, 795-821](src/services/titanPipeline/builder.ts)
- **Issue**: Claude Opus polish has 10s timeout. Falls back to unpolished Gemini draft if exceeded.
- **Fix**: Increase to 30s. Add retry for transient API failures.

#### LIM-11: VisionLoopEngine 2 Max Iterations
- **File**: [VisionLoopEngine.ts:69-74](src/services/VisionLoopEngine.ts)
- **Issue**: Healing loop caps at 2 iterations. Complex layouts may need 3-4 to reach 90% fidelity.
- **Fix**: Increase to 5 with smarter stopping (stop on >=90%, <1% improvement, or score divergence).

#### LIM-12: TechScout 15s Research Timeout
- **File**: [TechScoutService.ts:27, 314-321](src/services/TechScoutService.ts)
- **Issue**: 6 parallel Tavily searches + synthesis in 15s. Falls back to LLM-only recommendations.
- **Fix**: Increase to 30s. Return partial results if some queries succeed.

### Builder & Repair

#### LIM-13: Builder Prompt Truncation
- **File**: [builder.ts:556-721](src/services/titanPipeline/builder.ts)
- **Issue**: Structure 50K chars, current code 40K chars, assets 10K chars, physics 10K chars. Large codebases lose context in EDIT mode.
- **Fix**: Smart truncation (preserve imports/exports/types, summarize implementation). "Focused editing" mode for large projects.

#### LIM-14: CodeRepairService 5 Max Attempts
- **File**: [CodeRepairService.ts:27, 130-137](src/services/CodeRepairService.ts)
- **Issue**: Gives up after 5 attempts. Tiered strategies exist (SURGICAL → IMPORT_FIX → REBUILD) but escalation logic could be smarter.
- **Fix**: After 5 Gemini attempts, escalate to Claude Opus. Surface repair history to user.

#### LIM-15: BlueprintPlanner JSON Parse Fallback
- **File**: [BlueprintPlannerService.ts:146-167, 187-197](src/services/BlueprintPlannerService.ts)
- **Issue**: If Gemini returns invalid JSON, falls back to single-phase "Full Build". Phased benefits lost.
- **Fix**: JSON repair logic (extract from markdown fences, fix commas). Retry with stronger prompt.

### Sandpack Preview

#### LIM-16: Sandpack Only Has 4 Pre-loaded Dependencies
- **File**: [LayoutCanvas.tsx:28-33](src/components/layout-builder/LayoutCanvas.tsx)
- **Issue**: Only framer-motion, lucide-react, clsx, tailwind-merge. 3D projects fail (no three/R3F). Custom deps cause runtime errors.
- **Impact**: Generated code works in WebContainer validation but crashes in Sandpack preview.
- **Feasibility**: Easy
- **Fix**: Merge `extractDependencies(generatedFiles)` into Sandpack config's `customSetup.dependencies`.

---

## Unified Implementation Plan

### Phase 1: Quick Wins (Low effort, immediate impact)
*Estimated: 8 fixes, all low effort*

| # | Fix | File | Change |
|---|-----|------|--------|
| 1 | P0-2: Avatar fetch timeout | useLayoutBuilder.ts | Add `signal: AbortSignal.timeout(60000)` to feedback fetch |
| 2 | P0-3: Validation queue fix | WebContainerService.ts | Wrap `validateImpl` in `Promise.resolve().then(...)` |
| 3 | P2-1: Reset repair counter | useLayoutBuilder.ts | Add `setRepairAttempts(0)` at start of `runPipeline()` |
| 4 | P1-1: Fix pin first message | OmniChatService.ts | Use `findIndex(m => m.role === 'user')` instead of `[0]` |
| 5 | P2-4: Vision null guard | LayoutBuilderView.tsx | `(vision.features \|\| []).map(...)` |
| 6 | P2-5: Fix auto-scroll | OmniChat.tsx | Track `messages.length` in ref, only scroll on increase |
| 7 | P2-3: Fix chat hydration | useChatStore.ts | Only add welcome if messages empty/missing |
| 8 | P3-2: Remove dead slice | useAppStore.ts | Remove unused `chatMessages` slice |

### Phase 2: Medium Fixes (Moderate effort, significant impact)
*Estimated: 6 fixes*

| # | Fix | File | Change |
|---|-----|------|--------|
| 9 | P1-2: Auto-save guard | LayoutBuilderView.tsx | Add `isAutoSaving` ref flag |
| 10 | P1-4: Fix skill usage tracking | OmniChatService.ts | Use structured `cachedSkillId` field from JSON, not string matching |
| 11 | P1-3: Prune Avatar memory | DynamicWorkflowEngine.ts | Truncate memory entries >50KB before suspension |
| 12 | LIM-16: Sandpack dynamic deps | LayoutCanvas.tsx | Merge `extractDependencies()` into Sandpack customSetup |
| 13 | LIM-8/LIM-10: Timeout increases | TitanPipelineService.ts, builder.ts | 5min for WORLD_BUILD, 30s for polish |
| 14 | LIM-9/LIM-11/LIM-12: Other timeouts | WebContainerService.ts, VisionLoopEngine.ts, TechScoutService.ts | BUILD 60s, healing 5 iters, scout 30s |

### Phase 3: Architectural Fixes (Higher effort, foundational)

| # | Fix | Files | Change |
|---|-----|-------|--------|
| 15 | P0-1: State sync single source of truth | useLayoutBuilder.ts | Make Zustand the sole owner of `generatedFiles`, remove local state + sync |
| 16 | P2-2: Avatar timeout exemption | TitanPipelineService.ts | Exempt RESEARCH_AND_BUILD from pipeline timeout |
| 17 | LIM-5: Sandpack console bridge | LayoutCanvas.tsx, useLayoutBuilder.ts | postMessage bridge for runtime console capture |
| 18 | LIM-7: Smart truncation | DynamicWorkflowEngine.ts | Keep imports + error lines, summarize middle sections |

### Phase 4: 3D Screenshot Fix (Critical path for unblocking all 3D limitations)

| # | Fix | Files | Change |
|---|-----|-------|--------|
| 19 | LIM-1/LIM-4: Sandpack iframe capture | New: SandpackScreenshotService.ts, screenshot API update | Puppeteer navigates to Sandpack preview URL, waits for canvas, captures |
| 20 | LIM-2: Remove healing loop early exit | VisionLoopEngine.ts | Use iframe capture for 3D, keep ReactToHtml for 2D |
| 21 | LIM-3: Remove blank canvas workaround | VisualCriticService.ts | Remove hardcoded 5-6 score, use real 3D critique prompts |

### Verification

After each phase, run:
```bash
npm run typecheck    # Must pass with no errors
npm run lint         # Fix any lint issues
npm test             # All tests must pass
npm run dev          # Manual smoke test in browser
```

For 3D-specific fixes (Phase 4):
1. Generate a 3D scene via OmniChat ("build a 3D rotating cube with orbit controls")
2. Verify Sandpack preview renders the scene
3. Verify Visual Critic receives a non-blank screenshot
4. Verify healing loop doesn't exit early
5. Verify critique score reflects actual 3D quality

---

*Analysis complete. Ready for implementation approval.*
