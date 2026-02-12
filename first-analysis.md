# Virtual World Engine - Comprehensive Architecture Analysis

## What This App Is

The **Virtual World Engine** is an AI-powered code generation platform that lets users describe software in natural language and get working, live-previewed React applications. It combines conversational AI (Claude), code generation (Gemini), in-browser validation (WebContainer), and a self-learning skill cache (pgvector) into a single creation engine.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                         │
│  ┌──────────────┐  ┌────────────────────────────────┐   │
│  │  OmniChat     │  │  Layout Canvas (Sandpack)      │   │
│  │  (Chat UI)    │  │  Live React preview             │   │
│  │  Media upload  │  │  Inspector bridge (click-edit) │   │
│  │  Status dots   │  │  Console capture               │   │
│  └──────┬───────┘  └──────────────┬─────────────────┘   │
│         │                         │                      │
│  ┌──────┴─────────────────────────┴──────────────────┐  │
│  │        LayoutBuilderView (Main Orchestrator)       │  │
│  │  Dual-mode: Planning (Vision Board) / Building     │  │
│  └──────────────────────┬────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│              ORCHESTRATION LAYER                          │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │         useLayoutBuilder (Pipeline Hook)           │  │
│  │  runPipeline, validateAndRepair, executeAction     │  │
│  │  Undo/redo, history, Zustand sync                  │  │
│  └──────────┬───────────────────────┬────────────────┘  │
│             │                       │                    │
│  ┌──────────┴──────────┐  ┌────────┴─────────────────┐  │
│  │  OmniChatService    │  │  TitanPipelineService    │  │
│  │  (Claude Sonnet)    │  │  (Gemini Pro/Flash)      │  │
│  │  Intent classifier  │  │  Router→Architect→Builder│  │
│  └─────────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│              VALIDATION & QUALITY LAYER                   │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ WebContainer   │  │ CodeRepair   │  │ VisualCritic │ │
│  │ npm install    │  │ Tiered fix   │  │ Screenshot   │ │
│  │ esbuild check  │  │ Max 5 retries│  │ Score 1-10   │ │
│  └────────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│              KNOWLEDGE & LEARNING LAYER                   │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Skill Library  │  │ Embedding    │  │ Tech Scout   │ │
│  │ pgvector cache │  │ OpenAI 3-sm  │  │ Web research │ │
│  │ Quality loop   │  │ 1536-dim     │  │ Optimal tech │ │
│  └────────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## How Each Functionality Works

### 1. Dual-Mode Interface

The app has two modes controlled by `chatMode` in the store:

**Planning Mode (`chatMode: 'planning'`)**
- Right panel shows a **Vision Board** instead of code preview
- Messages go to `/api/layout/vision` → `VisionBoardService` (Claude Sonnet)
- Iteratively builds a `VisionDocument` (PRD): name, purpose, features, user flow, design system
- Each feature gets user stories, acceptance criteria, edge cases, complexity level
- "Start Building" serializes the entire VisionDocument and feeds it to the pipeline

**Building Mode (`chatMode: 'building'`)**
- Right panel shows **LayoutCanvas** with live Sandpack preview
- Messages go through OmniChat intent classification → action dispatch
- Can generate, edit, or refine code in real-time

**Transition**: Planning → Building happens when user clicks "Start Building", which serializes the vision document into instructions and runs the full pipeline.

---

### 2. OmniChat - The AI Brain

**Service**: `OmniChatService.ts` (Claude Sonnet 4.5)

**Core principle**: "You NEVER say 'I can't do that'. If you don't know, trigger autonomy mode."

**Intent Classification** - Every message is classified into one of 4 actions:

| Action | When | What Happens |
|--------|------|-------------|
| `pipeline` | Standard UI/app request, OR existing code + significant change | Full Titan Pipeline generation |
| `autonomy` | Unknown tech, algorithms, 3D, physics, novel/complex | Self-teaching agent swarm |
| `live-edit` | Existing code + small tweak (color change, text edit) | Quick inline code modification |
| `none` | Pure conversation, questions, no code action needed | Reply only, no code changes |

**Skill Library Integration**: Before calling Claude, OmniChat queries the vector skill cache for similar past solutions (similarity threshold: 0.78). If a match is found, the cached solution context is injected into Claude's system prompt with a `USE_CACHED_SKILL:{id}` directive.

**History Management**: Keeps last 20 messages in context, pins the first user message to preserve original intent across long conversations.

---

### 3. Titan Pipeline - Code Generation

**Service**: `TitanPipelineService.ts` + `src/services/titanPipeline/` directory

This is the multi-stage AI pipeline that turns instructions into working React code:

```
Instructions + Media
        ↓
   ┌────────────┐
   │ Tech Scout │ → Researches optimal tech stack via web search
   └─────┬──────┘   Outputs: TechDossier (frameworks, AI models, warnings)
         ↓
   ┌────────────┐
   │   Router   │ → Gemini Flash classifies intent
   └─────┬──────┘   Modes: CREATE | EDIT | MERGE | RESEARCH_AND_BUILD | WORLD_BUILD
         ↓
   ┌────────────┐  ┌────────────┐  ┌──────────────┐
   │  Surveyor  │  │ Physicist  │  │ Photographer │  ← Run in parallel
   │ Pixel meas.│  │ Animation  │  │ Asset gen    │
   └─────┬──────┘  └─────┬──────┘  └──────┬───────┘
         └────────────────┼────────────────┘
                          ↓
   ┌───────────────────────────┐
   │   Blueprint Planner      │ → Phased build plan from vision + tech dossier
   └─────────────┬─────────────┘
                 ↓
   ┌───────────────────────────┐
   │        Builder            │ → DUAL-PASS:
   │  Pass 1: Gemini 3 Pro    │   Draft code from manifests/physics/assets
   │  Pass 2: Claude Opus     │   Polish syntax, imports, types (30s timeout)
   └─────────────┬─────────────┘
                 ↓
          AppFile[] (App.tsx + index.tsx + supporting files)
```

**Special Paths**:
- **RESEARCH_AND_BUILD**: Triggers `AutonomyCore.solveUnknown()` for unknown technologies
- **WORLD_BUILD**: Uses `buildWorldManifest()` for 3D scene generation with SceneManifest
- **3D Detection**: Keywords regex + `enable_3d` flag activates 3D supplement prompts

---

### 4. WebContainer Validation - Sandbox

**Service**: `WebContainerService.ts`

Every generated codebase is validated in an in-browser Node.js sandbox before being shown to the user:

1. **Boot** WebContainer (StackBlitz in-browser runtime, requires COOP/COEP headers)
2. **Write files** to virtual filesystem (queue-serialized to prevent concurrent writes)
3. **npm install** dependencies (45s timeout, supports heavy packages like Rapier WASM)
4. **esbuild** bundle check on entry file (60s timeout)
5. **Parse errors** → categorize as syntax, import, runtime, build, or unknown
6. Return `ValidationResult { valid, errors[], warnings[], duration }`

**If validation fails → auto-repair loop** (max 5 attempts):
- Send errors + code to `CodeRepairService`
- CodeRepairService selects tiered strategy:
  - **SURGICAL** (default): Precise fixes, temperature 0.1
  - **IMPORT_FIX** (>5 import errors): Focus on dependency resolution
  - **REBUILD** (>20 errors or >10 syntax errors): Full file regeneration, temperature 0.4
- Re-validate after each repair attempt

---

### 5. Visual Critic - Quality Gate

**Service**: `VisualCriticService.ts` (Gemini Flash vision model)

After code passes validation, it's visually evaluated:

1. **Auto-detect 3D** from file contents (checks for R3F imports)
2. **Capture screenshot**:
   - 2D: `ReactToHtmlService` converts to standalone HTML → Puppeteer captures at 1280x800
   - 3D: Uses esm.sh renderer (ReactToHtml can't handle Three.js)
3. **Send to Gemini Flash** vision model with evaluation prompt
4. **Score** (1-10) with component scores:
   - 2D: layout_accuracy, visual_polish, completeness, responsiveness
   - 3D: lighting, materials, camera, physics, terrain, environment
5. **Verdict**:
   - `accept` (score >= 7): Save to Skill Library
   - `needs_improvement` (4-6): Suggestions returned
   - `regenerate` (< 4): Should redo

**Quality Feedback Loop**: If the generation used a cached skill, the visual critic score updates that skill's quality score in the database (fire-and-forget).

---

### 6. Skill Library - Vector Memory

**Service**: `SkillLibraryService.ts` + `EmbeddingService.ts`

Long-term memory that caches validated solutions for reuse:

**Save Path**: User request → generate code → validate → critique → if quality good → save skill
- Generates OpenAI text-embedding-3-small vector (1536 dimensions)
- Checks for duplicates (similarity >= 0.88 → updates existing instead of creating new)
- Stores in Supabase `skill_library` table with pgvector

**Query Path**: New user request → embed query → cosine similarity search → inject cached context
- Similarity threshold: 0.78
- Min quality score: 0.0
- Returns top matches with similarity scores
- OmniChat injects matched skill into Claude's system prompt

**Feedback Loop**: Usage count incremented on match, quality score updated after visual critique.

---

### 7. Autonomy / Self-Teaching Mode

**Services**: `AutonomyCore.ts`, `DynamicWorkflowEngine.ts`

For problems the system doesn't know how to solve:

1. **AutonomyCore** fabricates a specialized agent swarm via `AgentSwarmFactory`
2. **DynamicWorkflowEngine** orchestrates execution in phases:
   - RESEARCH → ARCHITECT → QA_ENGINEERING (TDD) → CODING → EXECUTION
3. **Avatar Protocol**: Agents can issue client-side commands:
   - `shell`: Execute npm/git commands in WebContainer
   - `screenshot`: Capture via Puppeteer
   - `browser_log`: Read Sandpack console + validation errors
4. **Recursive loop**: Server sends command → client executes → sends feedback → server sends next command (max 10 iterations)
5. On success, validated solution is saved to Skill Library

---

### 8. Dream Mode - Autonomous Maintenance

**Types**: `src/types/dream.ts`, **API**: `/api/dream/agent`

Self-healing maintenance system that runs autonomously:

**Profiles**:
- **NAP**: Light maintenance
- **REM**: Deep analysis
- **NIGHTMARE**: Aggressive chaos testing

**Agents**:
- **DiscoveryAgent**: Scans repo for orphaned/disconnected features
- **SpecAuditor**: Audits specifications for missing features
- **WorkflowAuditor**: Discovers workflows from code
- **QAChaosAgent**: Generates chaos tests for integration testing
- **AutonomyCore**: Solves discovered problems

**Outputs**: `DreamLog` with goals completed, bugs found/fixed, discoveries, crash reports, patches.

---

### 9. State Management

**3 Zustand stores** with middleware:

| Store | Purpose | Persisted? |
|-------|---------|-----------|
| `useAppStore` | Central app state (concept, files, mode, UI, version history, dream logs) | Yes (localStorage) |
| `useChatStore` | Chat message history | Yes (messages only) |
| `useProjectStore` | Project list, active project ID | Partial (activeProjectId only, list from IndexedDB) |

**Key patterns**:
- `immer` middleware for safe mutations
- `shallow` comparison on selectors (prevents infinite re-renders)
- Version counter sync between local state and store (prevents circular updates)
- Migration strategy with version bumps for breaking changes

**Project persistence**: IndexedDB via `ProjectDatabase` service (unlimited storage, keyed by project ID).

---

### 10. Live Preview & Editing

**Components**: `LayoutCanvas.tsx`, `FloatingEditBubble`, inspector bridge

The Sandpack preview provides:
- **Live React execution** with TypeScript template
- **Inspector bridge**: Injected script listens for clicks on `[data-id]` elements, sends postMessage to parent → shows `FloatingEditBubble` for inline editing
- **Console capture**: Forwards console.log/warn/error from iframe to parent (used by Avatar Protocol for debugging)
- **Device frames**: Phone (390x844), Tablet (820x1180), Desktop (1280x800)
- **Dynamic dependencies**: Extracted from import statements in generated code, merged with curated versions

---

### 11. API Routes

| Route | Method | Purpose | Service |
|-------|--------|---------|---------|
| `/api/layout/chat` | POST | OmniChat conversational AI | OmniChatService (Claude) |
| `/api/layout/pipeline` | POST | Main code generation | TitanPipelineService (Gemini) |
| `/api/layout/vision` | POST | Vision Board planning | VisionBoardService (Claude) |
| `/api/layout/critique` | POST | Visual quality assessment | VisualCriticService (Gemini Flash) |
| `/api/layout/repair` | POST | AI code repair | CodeRepairService (Gemini Pro) |
| `/api/layout/screenshot` | POST | Puppeteer screenshot capture | Puppeteer |
| `/api/layout/analyze` | POST | Media analysis | GeminiImageService |
| `/api/skills` | POST | Query skill library | SkillLibraryService |
| `/api/skills/save` | POST | Save validated solution | SkillLibraryService |
| `/api/skills/update-quality` | POST | Update quality score | SkillLibraryService |
| `/api/dream/agent` | POST | Dream Mode agent proxy | Multiple agents |
| `/api/layout/autonomy/feedback` | POST | Avatar Protocol feedback | DynamicWorkflowEngine |

---

### 12. Complete Data Flow (End-to-End)

```
User types "Build me a todo app with dark mode" in OmniChat
    ↓
LayoutBuilderView.handleSendMessage()
    → Adds message to useChatStore (persistent)
    → Builds conversation history (last 20 messages)
    ↓
useLayoutBuilder.sendChatMessage()
    → POST /api/layout/chat
    ↓
OmniChatService.chat() [Claude Sonnet 4.5]
    → Query Skill Library: "todo app dark mode" → embed → pgvector search
    → If match (similarity ≥ 0.78): inject cached solution into prompt
    → Claude classifies intent: action = "pipeline"
    → Returns: { reply: "I'll build that for you!", action: "pipeline",
                  actionPayload: { instructions: "Build a todo app..." } }
    ↓
LayoutBuilderView.executeAction("pipeline", instructions)
    ↓
useLayoutBuilder.runPipeline([], instructions, appContext)
    → POST /api/layout/pipeline
    ↓
TitanPipelineService.runPipeline()
    → Tech Scout: researches "todo app react dark mode" → TechDossier
    → Router (Gemini Flash): classifies as CREATE mode
    → Surveyor: no images → skip
    → Blueprint Planner: plans phased build
    → Builder Pass 1 (Gemini 3 Pro): generates App.tsx + index.tsx
    → Builder Pass 2 (Claude Opus): polishes code (30s timeout)
    → Returns AppFile[]
    ↓
useLayoutBuilder.validateAndRepair(files)
    → WebContainer.validate():
        → Write files → npm install (react, tailwind, lucide-react)
        → esbuild bundle check
        → If errors: CodeRepairService.repair() (up to 5 attempts)
    → Returns validated AppFile[]
    ↓
updateFilesWithHistory(files)
    → Updates local state + Zustand store
    → Pushes to undo stack
    → Sandpack re-renders with new files
    ↓
runVisualCritique(files) [fire-and-forget]
    → POST /api/layout/critique
    → ReactToHtmlService → Puppeteer screenshot
    → Gemini Flash vision analysis → score: 8/10
    → If cachedSkillId: update quality score in Skill Library
    → If score > threshold: save new skill to library
    ↓
User sees live React app running in Sandpack preview panel
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.5 (App Router), React 19, TypeScript, Tailwind CSS |
| State | Zustand 4.5 (immer + persist + devtools) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + Auth + Storage), pgvector |
| AI - Chat | Claude Sonnet 4.5 (Anthropic SDK) |
| AI - Generation | Gemini 3 Pro (`gemini-3-pro-preview`) |
| AI - Critique | Gemini 3 Flash (`gemini-3-flash-preview`) |
| AI - Polish | Claude Opus (`claude-opus-4-5-20251101`) - Builder Pass 2 |
| AI - Embeddings | OpenAI text-embedding-3-small (1536 dims) |
| Web Search | Tavily API (TechScout research) |
| Sandbox | WebContainer API (StackBlitz in-browser Node.js) |
| Preview | Sandpack (CodeSandbox runtime) |
| Screenshots | Puppeteer (server-side, esm.sh for 3D) |
| Image Processing | Sharp (server-side asset cropping) |
| Project Storage | IndexedDB (browser-local, unlimited) |
| Repo Loading | GitHub API + JSZip (Dream Mode) |

---

## All Services (45 files across `src/services/`)

### Core Pipeline Services

| Service | File | Purpose |
|---------|------|---------|
| **TitanPipelineService** | `services/TitanPipelineService.ts` | Top-level pipeline orchestrator (Router → Builder) |
| **Router** | `services/titanPipeline/router.ts` | Gemini Flash intent classifier: CREATE, EDIT, MERGE, RESEARCH_AND_BUILD, WORLD_BUILD |
| **Surveyor** | `services/titanPipeline/surveyor.ts` | Pixel measurement from reference images → VisualManifest |
| **Physicist** | `services/titanPipeline/physicist.ts` | Extracts animation physics from video → MotionPhysics |
| **Builder** | `services/titanPipeline/builder.ts` | Dual-pass code gen: Gemini Pro draft + Claude Opus polish (30s timeout) |
| **LiveEditor** | `services/titanPipeline/liveEditor.ts` | Quick code refinement (preserves existing logic, handles data-id) |
| **WorldArchitect** | `services/titanPipeline/worldArchitect.ts` | Natural language → SceneManifest JSON (3D spatial reasoning) |
| **Analyst** | `services/titanPipeline/analyst.ts` | Deep repo analysis: style guide, pattern library, critical files → RepoContext |
| **Config** | `services/titanPipeline/config.ts` | Model constants, API key getters, CODE_ONLY_SYSTEM_INSTRUCTION |
| **Helpers** | `services/titanPipeline/helpers.ts` | File upload to Gemini, autonomy output parsing |

### AI Brain Services

| Service | File | Purpose |
|---------|------|---------|
| **OmniChatService** | `services/OmniChatService.ts` | Claude Sonnet 4.5 chat + intent classification (pipeline/autonomy/live-edit/none) |
| **VisionBoardService** | `services/VisionBoardService.ts` | Claude Sonnet 4.5 for Planning Mode → iterative VisionDocument building |
| **TechScoutService** | `services/TechScoutService.ts` | Gemini Pro + Tavily web search → TechDossier (optimal tech stack research) |
| **BlueprintPlannerService** | `services/BlueprintPlannerService.ts` | Gemini Pro phased build planning with self-review coverage guarantee |

### Validation & Quality Services

| Service | File | Purpose |
|---------|------|---------|
| **WebContainerService** | `services/WebContainerService.ts` | In-browser Node.js sandbox: npm install + esbuild validation |
| **CodeRepairService** | `services/CodeRepairService.ts` | Tiered AI repair: SURGICAL → IMPORT_FIX → REBUILD |
| **VisualCriticService** | `services/VisualCriticService.ts` | Gemini Flash screenshot analysis, scoring 1-10 |
| **VisionLoopEngine** | `services/VisionLoopEngine.ts` | Post-gen healing: screenshot → critique → patch/regenerate (max 5 iters) |
| **LayoutAutoFixEngine** | `services/LayoutAutoFixEngine.ts` | Safe property correction with XSS blocklist |
| **VerificationService** | `services/VerificationService.ts` | Parses test runner output (Vitest/Jest), generates builder feedback |
| **ReactToHtmlService** | `services/ReactToHtmlService.ts` | React → standalone HTML (Babel + CDN) for Puppeteer screenshots |

### Knowledge & Memory Services

| Service | File | Purpose |
|---------|------|---------|
| **SkillLibraryService** | `services/SkillLibraryService.ts` | pgvector skill cache: save, query (0.78 threshold), deduplicate (0.88) |
| **EmbeddingService** | `services/EmbeddingService.ts` | OpenAI text-embedding-3-small with retry logic |

### Autonomy & Dream Services

| Service | File | Purpose |
|---------|------|---------|
| **DynamicWorkflowEngine** | `services/DynamicWorkflowEngine.ts` | Agent swarm orchestration: RESEARCH → ARCHITECT → QA → CODING → EXECUTION |
| **TimeTravelService** | `services/TimeTravelService.ts` | Injects time-mocking shim into WebContainer for temporal workflow testing |
| **DependencyGraphService** | `services/DependencyGraphService.ts` | Import-based dependency graph: impact analysis, orphan detection, entry points |
| **RepoLoaderService** | `services/RepoLoaderService.ts` | GitHub ZIP download → JSZip → WebContainer FileSystemTree (Dream Mode) |

### Media & Asset Services

| Service | File | Purpose |
|---------|------|---------|
| **GeminiImageService** | `services/GeminiImageService.ts` | Gemini 3 Pro image generation (textures, materials) → Supabase Storage |
| **AssetExtractionService** | `services/AssetExtractionService.ts` | Sharp-based image cropping from reference screenshots → Supabase Storage |
| **MotionMapper** | `services/MotionMapper.ts` | Video motion analysis → CSS keyframes, entrance/loop animations, visual effects |

### Search Services

| Service | File | Purpose |
|---------|------|---------|
| **GoogleSearchService** | `services/GoogleSearchService.ts` | Google Custom Search API (with mock fallback) |
| **TavilySearchService** | `services/TavilySearchService.ts` | Tavily API search (agent-optimized, LLM-friendly results) |

### Infrastructure Services

| Service | File | Purpose |
|---------|------|---------|
| **ProjectDatabase** | `services/ProjectDatabase.ts` | IndexedDB wrapper for project persistence |
| **GeminiLayoutService** | `services/GeminiLayoutService.ts` + `services/geminiLayout/` | Legacy single-stage pipeline (image → components), still used by `/api/layout/analyze` |

### Legacy GeminiLayout Sub-modules (`services/geminiLayout/`)

Older code generation pipeline predating Titan Pipeline. Still used for `/api/layout/analyze`:
- `GeminiLayoutService.ts` - Main orchestrator
- `extractDesignSpec.ts` - Design spec extraction from images
- `videoAnalysis.ts` - Video keyframe analysis
- `editComponent.ts` - Component editing
- `buildComponents.ts` - Component code gen
- `critique.ts` - Layout critique
- `config.ts`, `helpers.ts`, `index.ts` - Supporting utilities

---

## All Agents (11 files in `src/agents/`)

| Agent | File | Purpose |
|-------|------|---------|
| **AutonomyCore** | `agents/AutonomyCore.ts` | Self-teaching orchestrator: swarm fabrication → execution → syntax validation → retry (max 3) |
| **AgentSwarmFactory** | `agents/AgentSwarmFactory.ts` | Dynamically creates specialized agent compositions for goals |
| **DiscoveryAgent** | `agents/DiscoveryAgent.ts` | Scans repo for orphaned/disconnected features |
| **SpecAuditorAgent** | `agents/SpecAuditorAgent.ts` | Validates specifications for completeness |
| **WorkflowAuditor** | `agents/WorkflowAuditor.ts` | Tests temporal workflows with TimeTravelService |
| **QA_ChaosAgent** | `agents/QA_ChaosAgent.ts` | Chaos testing: generates and runs integration tests |
| **ClarificationAgent** | `agents/ClarificationAgent.ts` | Asks clarifying questions when goals are ambiguous |
| **CodeTransformAgent** | `agents/CodeTransformAgent.ts` | Code transformation and refactoring |
| **DeploymentAgent** | `agents/DeploymentAgent.ts` | Deployment orchestration |
| **types.ts** | `agents/types.ts` | Shared agent type definitions |

---

## All Hooks (10 files in `src/hooks/`)

| Hook | File | Purpose |
|------|------|---------|
| **useLayoutBuilder** | `hooks/useLayoutBuilder.ts` (949 lines) | Main pipeline orchestration: runPipeline, validate, repair, undo/redo, Zustand sync |
| **useProjectManager** | `hooks/useProjectManager.ts` | Project save/load/switch/delete via IndexedDB |
| **useDreamMode** | `hooks/useDreamMode.ts` | Dream Mode orchestration: start/stop campaign, goal queue, iframe testing |
| **useElementInspector** | `hooks/useElementInspector.ts` | Element selection and inspection in preview |
| **useStateInspector** | `hooks/useStateInspector.ts` | State debugging tools |
| **useTheme** | `hooks/useTheme.ts` | Theme switching (light/dark) |
| **useToast** | `hooks/useToast.ts` | Toast notification system |
| **useWakeLock** | `hooks/useWakeLock.ts` | Screen wake lock for long-running operations |
| **useSettings** | `hooks/useSettings.ts` | Persisted user settings management |

---

## All API Routes (14 routes)

| Route | Method | Purpose | Service |
|-------|--------|---------|---------|
| `/api/layout/chat` | POST | OmniChat conversational AI | OmniChatService (Claude Sonnet) |
| `/api/layout/pipeline` | POST | Main code generation + live-edit | TitanPipelineService (Gemini) |
| `/api/layout/vision` | POST | Vision Board planning mode | VisionBoardService (Claude Sonnet) |
| `/api/layout/critique` | POST | Visual quality assessment | VisualCriticService (Gemini Flash) |
| `/api/layout/repair` | POST | AI code repair | CodeRepairService (Gemini Pro) |
| `/api/layout/screenshot` | POST | Puppeteer screenshot (2D + 3D via esm.sh) | Puppeteer + ReactToHtmlService |
| `/api/layout/analyze` | POST | Legacy media analysis (image/video/edit/critique) | GeminiLayoutService |
| `/api/layout/autonomy/feedback` | POST | Avatar Protocol command feedback loop | DynamicWorkflowEngine |
| `/api/skills` | POST | Query skill library (vector search) | SkillLibraryService |
| `/api/skills/save` | POST | Save validated solution | SkillLibraryService |
| `/api/skills/update-quality` | POST | Update quality score feedback | SkillLibraryService |
| `/api/dream/agent` | POST | Unified Dream Mode agent proxy (12 actions) | Multiple agents |
| `/api/dream/repo` | POST | GitHub repo download proxy (COEP bypass) | GitHub API |
| `/api/test/repo-analyst` | POST | Test endpoint for repo analysis | Analyst |

---

## Dream Mode - MaintenanceCampaign Workflow

**File**: `src/workflows/MaintenanceCampaign.ts`

**State Machine**:
```
IDLE → LOADING → DISCOVERING → BUILDING_GOAL → CHAOS_TESTING
→ DIAGNOSING → PATCHING → VERIFYING → LOGGING → DONE
```

**Priority Loop**:
1. Load repo into WebContainer (once)
2. DiscoveryAgent scans for orphaned features → auto-populate goal queue
3. Execute goals from queue (Priority 1 - directed goals)
4. QAChaosAgent runs chaos tests (Priority 2 - bug hunting)
5. Diagnose + patch crashes found
6. Verify patches, log results
7. Repeat until budget exhausted or time limit

**Circuit Breakers**:
- `maxFixesPerCycle` from ChaosProfile
- `sessionDuration` from ChaosProfile
- Manual stop via abort signal

**Testing Strategies**:
- **Strategy A**: WebContainer-based testing (shell commands)
- **Strategy B**: Iframe chaos testing (QAChaosAgent generates scripts run in Sandpack preview)

---

## Component Architecture (65+ components)

### Core UI
| Component | File | Purpose |
|-----------|------|---------|
| **LayoutBuilderView** | `components/LayoutBuilderView.tsx` (541 lines) | Main orchestrator: OmniChat + Canvas/VisionBoard |
| **OmniChat** | `components/interface/OmniChat.tsx` | Chat interface with media upload, status indicators |
| **VisionPreview** | `components/interface/VisionPreview.tsx` | Vision Board display (Planning Mode right panel) |
| **LayoutCanvas** | `components/layout-builder/LayoutCanvas.tsx` | Sandpack preview with toolbar, inspector, device frames |
| **FloatingEditBubble** | `components/layout-builder/FloatingEditBubble.tsx` | Inline editing bubble on selected elements |
| **SideDrawer** | `components/SideDrawer.tsx` | Collapsible side panel |
| **SettingsPage** | `components/SettingsPage.tsx` | User settings UI |
| **ErrorBoundary** | `components/ErrorBoundary.tsx` | React error boundary |

### Dream Mode
| Component | File | Purpose |
|-----------|------|---------|
| **DreamToggle** | `components/dream/DreamToggle.tsx` | Toggle Dream Mode on/off |
| **DirectiveQueue** | `components/dream/DirectiveQueue.tsx` | Display/manage dream goal queue |

### Preview
| Component | File | Purpose |
|-----------|------|---------|
| **DeviceFrame** | `components/preview/DeviceFrame.tsx` | Device-specific frames (phone 390x844, tablet 820x1180, desktop 1280x800) |
| **DeviceToolbar** | `components/preview/DeviceToolbar.tsx` | Device selection toolbar |
| **PreviewModeSelector** | `components/preview/PreviewModeSelector.tsx` | Preview mode selection |
| **PreviewBanner** | `components/preview/PreviewBanner.tsx` | Preview status banner |

### Code Review
| Component | File | Purpose |
|-----------|------|---------|
| **CommentThread** | `components/review/CommentThread.tsx` | Code review comments |
| **EnhancedDiffViewer** | `components/review/EnhancedDiffViewer.tsx` | Side-by-side diff viewer |
| **HunkApprovalCard** | `components/review/HunkApprovalCard.tsx` | Approve/reject code hunks |
| **ImpactAnalysisPanel** | `components/review/ImpactAnalysisPanel.tsx` | Show impacted files from changes |

### File Storage
| Component | File | Purpose |
|-----------|------|---------|
| **FileGrid** | `components/storage/FileGrid.tsx` | Grid view of uploaded files |
| **FileUploader** | `components/storage/FileUploader.tsx` | File upload interface |
| **StorageStats** | `components/storage/StorageStats.tsx` | Storage quota display |
| **FileActions** | `components/storage/FileActions.tsx` | File action buttons |
| **FileCard** | `components/storage/FileCard.tsx` | Individual file card |
| **FileFilters** | `components/storage/FileFilters.tsx` | File filtering UI |

### Dev Tools
| Component | File | Purpose |
|-----------|------|---------|
| **DevTools** | `components/dev/DevTools.tsx` | Developer toolbar (dev mode only) |
| **DebugPanel** | `components/dev/DebugPanel.tsx` | Debug information panel |
| **ElementInspector** | `components/dev/ElementInspector/` (6 files) | Element selection, overlay, panel, prompt generator |
| **MockAIBanner** | `components/dev/MockAIBanner.tsx` | Mock AI mode indicator |

### Effects
| Component | File | Purpose |
|-----------|------|---------|
| **CSSParticleEffect** | `components/effects/CSSParticleEffect.tsx` | CSS-based particle effects |
| **VisualEffectRenderer** | `components/effects/VisualEffectRenderer.tsx` | Visual effect orchestrator |

### Projects
| Component | File | Purpose |
|-----------|------|---------|
| **ProjectList** | `components/projects/ProjectList.tsx` | Project listing |
| **ProjectCard** | `components/projects/ProjectCard.tsx` | Individual project card |
| **ProjectSaveModal** | `components/projects/ProjectSaveModal.tsx` | Save project dialog |
| **ProjectListModal** | `components/modals/ProjectListModal.tsx` | Modal project list |

### Marketing (Landing Page)
- HeroSection, FeaturesGrid, CTASection, ComparisonTable, MarketingNav, Footer

### UI Primitives (`components/ui/`)
- Icons, ColorPicker, SectionHeader, Select, Slider, TextArea, TextInput, ToggleSwitch

---

## React Contexts (3 providers)

| Context | File | Purpose |
|---------|------|---------|
| **ThemeContext** | `contexts/ThemeContext.tsx` | Light/dark theme management |
| **AuthContext** | `contexts/AuthContext.tsx` | Supabase auth state |
| **SettingsContext** | `contexts/SettingsContext.tsx` | User settings provider |

Provider nesting (from `layout.tsx`): ThemeProvider → SettingsProvider → AuthProvider → ErrorBoundary → Children

---

## Prompts System (15 files in `src/prompts/`)

| Prompt | File | Purpose |
|--------|------|---------|
| **builder** | `prompts/builder.ts` | Main code generation prompt |
| **builderExpertPrompt** | `prompts/builderExpertPrompt.ts` | Expert-level code synthesis |
| **geminiCreativeDirectorPrompt** | `prompts/geminiCreativeDirectorPrompt.ts` | Asset generation direction |
| **geminiLayoutBuilderPrompt** | `prompts/geminiLayoutBuilderPrompt.ts` | Layout analysis prompt |
| **production-standards** | `prompts/production-standards.ts` | Production quality standards |
| **quality-standards** | `prompts/quality-standards.ts` | Quality gate criteria |
| **wizardSystemPrompt** | `prompts/wizardSystemPrompt.ts` | Conversational wizard |
| **component-syntax** | `prompts/common/component-syntax.ts` | Component syntax rules |
| **response-format** | `prompts/common/response-format.ts` | Response format specifications |
| **backend-templates** | `prompts/full-app/backend-templates.ts` | Backend code templates |
| **examples-compressed** | `prompts/full-app/examples-compressed.ts` | Compressed example code |
| **frontend-rules-compressed** | `prompts/full-app/frontend-rules-compressed.ts` | Frontend rules |
| **fullstack-rules-compressed** | `prompts/full-app/fullstack-rules-compressed.ts` | Full-stack rules |
| **ast-operations-compressed** | `prompts/modify/ast-operations-compressed.ts` | AST operation rules |
| **modify examples** | `prompts/modify/examples-compressed.ts` | Modification examples |

---

## Type System (68+ files in `src/types/`)

### Core Types
| Type File | Purpose |
|-----------|---------|
| `titanPipeline.ts` | VisionDocument, TechDossier, BlueprintPlan, PipelineProgress, OmniChat types, AppContext |
| `railway.ts` | AppFile, BuildResult (WebContainer types) |
| `sandbox.ts` | ValidationResult, SandboxError, WebContainerStatus |
| `autonomy.ts` | AutonomyGoal, StrategicPlan, FabricatedAgent, AgentCommand (Avatar Protocol) |
| `dream.ts` | DreamLog, CrashReport, DreamPatch, ChaosProfile, CampaignPhase, DreamGoal, DreamStats |
| `skillLibrary.ts` | SkillMatch, Skill types |
| `visualCritic.ts` | VisualIssue categories (2D + 3D: lighting, materials, geometry, camera, physics, terrain) |
| `world.ts` | SceneManifest, Entity, Environment (3D world types) |
| `temporalWorkflow.ts` | TimeState, WorkflowDefinition |

### UI & Design Types
| Type File | Purpose |
|-----------|---------|
| `layoutDesign.ts` | Main design system types (41KB) |
| `layoutDesign/` (21 files) | Component, animation, scene3d, interaction, video, progress types + barrel exports |
| `layoutAnalysis.ts` | Image analysis result types |
| `designSpec.ts` | Design specification types |
| `elementInspector.ts` | Inspector element types |
| `motionConfig.ts` | Animation/motion configuration |
| `codeReview.ts` | Code review types |
| `review.ts` / `reviewTypes.ts` | Review workflow types |

### Infrastructure Types
| Type File | Purpose |
|-----------|---------|
| `deployment.ts` + `deployment/` (6 files) | Cloudflare, Desktop (Electron), Mobile (React Native), Neon, Turso, Unified |
| `appConcept.ts` | App concept definition |
| `project.ts` | Project types |
| `settings.ts` / `userSettings.ts` | Settings types |
| `storage.ts` | File storage types |
| `supabase.ts` | Supabase schema types |
| `subscription.ts` | Subscription/billing types |
| `streaming.ts` | Streaming response types |
| `schema.ts` | Data schema types |
| `api-schemas.ts` | API request/response schemas |
| `api-gateway/index.ts` | API gateway types |
| `buildPhases.ts` | Build phase types |
| `dynamicPhases.ts` | Dynamic phase planning types |
| `architectureSpec.ts` / `architectureTemplates.ts` | Architecture specification types |
| `componentManagement.ts` | Component management types |
| `dashboard.ts` | Dashboard types |
| `mediaSource.ts` | Media source types |
| `manipulation.ts` | Code manipulation types |
| `codeContext.ts` | Code context types |
| `aiBuilderTypes.ts` | AI builder types |
| `projectDocumentation.ts` | Project documentation types |
| `esbuild-wasm.d.ts` | esbuild WASM type declarations |

---

## Utilities (15 files in `src/utils/`)

| Utility | File | Purpose |
|---------|------|---------|
| **extractDependencies** | `utils/extractDependencies.ts` | Parse imports → npm packages (handles scoped: @react-three/fiber) |
| **extractCode** | `utils/extractCode.ts` | Strip markdown fences from LLM output |
| **inspectorBridge** | `utils/inspectorBridge.ts` | Inspector ↔ preview iframe postMessage bridge |
| **screenshotCapture** | `utils/screenshotCapture.ts` | Client-side html2canvas fallback |
| **exportApp** | `utils/exportApp.ts` | Export generated app as ZIP |
| **componentsToReactCode** | `utils/componentsToReactCode.ts` | DetectedComponent[] → React code |
| **domTreeToComponents** | `utils/domTreeToComponents.ts` | Surveyor dom_tree → DetectedComponent[] |
| **layoutConverter** | `utils/layoutConverter.ts` | Layout format conversion |
| **layoutValidation** | `utils/layoutValidation.ts` | Layout specification validation |
| **responsiveTypography** | `utils/responsiveTypography.ts` | Typography scaling |
| **geminiRetry** | `utils/geminiRetry.ts` | Exponential backoff retry for Gemini API |
| **settingsStorage** | `utils/settingsStorage.ts` | LocalStorage persistence helpers |
| **logger** | `utils/logger.ts` | Structured logging |
| **debug** | `utils/debug.ts` | Debug logging utilities |

---

## Configuration (`src/config/`)

| Config | File | Purpose |
|--------|------|---------|
| **curated-versions** | `config/curated-versions.ts` | Pinned dependency versions for generated apps (React 19, Three.js ^0.170.0, Prisma ^5.22.0, etc.) |
| **chaosProfile** | `config/chaosProfile.ts` | Dream Mode chaos testing profiles (NAP/REM/NIGHTMARE) |
| **versions** | `config/versions.ts` | Version management |
| **versions.generated** | `config/versions.generated.ts` | Auto-generated version file |

### Curated Versions (verified from source)
Key pinned versions: React ^19.0.0, Three.js ^0.170.0, R3F ^8.17.0, Drei ^9.117.0, Rapier ^2.0.0, framer-motion ^11.11.0, Prisma ^5.22.0, Stripe ^17.3.0, Recharts ^2.13.0, D3 ^7.9.0

---

## Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | OmniChat, VisionBoard, Builder Pass 2 | Claude API access |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Titan Pipeline, Critic, Repair, TechScout | Gemini API access |
| `OPENAI_API_KEY` | EmbeddingService | Skill Library embeddings |
| `TAVILY_API_KEY` | TavilySearchService | Web search for TechScout |
| `GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_CX` | GoogleSearchService | Legacy web search |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, Storage, Skills | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth, Storage, Skills | Supabase anon key |
