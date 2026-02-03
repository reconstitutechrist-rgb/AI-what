# AI-APP-BUILDER - Master Context (Verified)

> **Purpose**: This file provides full project context for Claude Code and other AI tools.
> **Status**: VERIFIED (Feb 2, 2026)

---

## Quick Stats

| Metric               | Verified (Actual) |
| -------------------- | ----------------- |
| TypeScript/TSX Files | **214**           |
| API Route Handlers   | **9**             |
| Custom Hooks         | **7**             |
| Service Classes      | **14**            |
| Store Files          | **3**             |
| Component Files      | **73**            |
| Type Definition Files| **44**            |
| Type Definitions     | **~13,087 lines** |
| Utilities            | **~3,933 lines**  |

**Stack**: Next.js 15.5 / React 19 / TypeScript / Tailwind CSS / Zustand 4.5 / Supabase / Google Generative AI (Gemini) / Anthropic Claude SDK / OpenAI Embeddings / WebContainer API / pgvector

---

## System Architecture Flow

```
User Input → OmniChat (conversational interface)
    ↓
OmniChatService (Claude Sonnet) → intent classification
    ↓ action: pipeline | autonomy | live-edit | none
TitanPipelineService (Gemini) → Router → Architect → Assembler
    ↓
WebContainerService → in-browser Node.js validation
    ↓
CodeRepairService → auto-fix (up to 3 attempts)
    ↓
LayoutCanvas (Sandpack) → live preview
    ↓
VisualCriticService (Gemini Flash) → screenshot quality scoring
    ↓
SkillLibraryService (pgvector) → cache successful solutions
```

### Data Flow Detail

```
OmniChat
  ├── Text-only → OmniChatService → AI reply + action classification
  │     action: 'none'      → just show reply
  │     action: 'pipeline'  → run Titan pipeline
  │     action: 'autonomy'  → run pipeline (Router detects RESEARCH_AND_BUILD)
  │     action: 'live-edit' → run refineComponent
  └── Media → pipeline directly (image/video analysis)
```

**Key Data Persistence Points:**

- `generatedFiles` — Generated code from pipeline, managed by useLayoutBuilder
- `messages` — Chat history in useChatStore (persisted via localStorage)
- `appConcept` — App metadata in useAppStore
- `projects` — Saved projects in useProjectStore (persisted via localStorage)

---

## Dependency Hierarchy

### TIER 1: UNIVERSAL (10+ dependents) — EXTREME CAUTION

| File                        | Dependents   | Impact                                  |
| --------------------------- | ------------ | --------------------------------------- |
| `types/layoutDesign.ts`     | **12 files** | Design type system used across layout   |
| `useAppStore.ts`            | **11 files** | Central state — breaks app-wide         |
| `types/titanPipeline.ts`    | **10 files** | Pipeline types used by services + hooks |

### TIER 2: MAJOR SERVICES (3-9 dependents)

| File                        | Dependents  | Notes                              |
| --------------------------- | ----------- | ---------------------------------- |
| `GeminiLayoutService.ts`    | ~5 files    | Layout AI service (1,352 lines)    |
| `useChatStore.ts`           | 4 files     | Chat message persistence           |
| `useProjectStore.ts`        | 4 files     | Project save/load state            |

### TIER 3: PIPELINE SERVICES (1-3 dependents each)

| File                        | Lines | Notes                              |
| --------------------------- | ----- | ---------------------------------- |
| `TitanPipelineService.ts`   | 612   | Pipeline orchestrator              |
| `WebContainerService.ts`    | 456   | Sandbox validation                 |
| `VisualCriticService.ts`    | 350   | Screenshot quality analysis        |
| `OmniChatService.ts`        | 290   | Conversational AI + intent         |
| `SkillLibraryService.ts`    | 267   | pgvector skill caching             |
| `CodeRepairService.ts`      | 214   | Auto-repair broken code            |

### TIER 4: HOOKS & COMPONENTS (1-3 dependents each)

- `useLayoutBuilder.ts` (669 lines) — Main orchestrator hook
- `LayoutCanvas.tsx` (579 lines) — Preview canvas
- `LayoutBuilderView.tsx` (311 lines) — Top-level layout view

---

## Critical Files — DO NOT BREAK

| File                        | Lines     | Purpose                           | Risk                               |
| --------------------------- | --------- | --------------------------------- | ---------------------------------- |
| `useAppStore.ts`            | **805**   | Central Zustand state             | 11+ files break                    |
| `types/layoutDesign.ts`     | **2,999** | Design type system                | 12 files — **RECOMMEND SPLITTING** |
| `GeminiLayoutService.ts`    | **1,352** | Layout AI with Gemini             | Layout builder breaks              |
| `useLayoutBuilder.ts`       | **669**   | Layout orchestrator hook          | All pipeline actions break         |
| `TitanPipelineService.ts`   | **612**   | Agentic generation pipeline       | Code generation breaks             |
| `LayoutCanvas.tsx`          | **579**   | Canvas rendering + Sandpack       | Preview breaks                     |
| `WebContainerService.ts`    | **456**   | In-browser sandbox validation     | Validation breaks                  |
| `VisualCriticService.ts`    | **350**   | Screenshot quality scoring        | Quality loop breaks                |
| `LayoutBuilderView.tsx`     | **311**   | Main view orchestrator            | UI breaks                          |
| `OmniChatService.ts`        | **290**   | Conversational AI + routing       | Chat breaks                        |
| `SkillLibraryService.ts`    | **267**   | pgvector skill caching            | Skill reuse breaks                 |
| `middleware.ts`             | **87**    | Auth flow for all routes          | Auth breaks                        |

---

## Import Rules — MUST FOLLOW

```
Components  → Hooks, Types, Utils       ALLOWED
Hooks       → Store, Services, Types    ALLOWED
Services    → Types, Utils              ALLOWED
Services    → Other Services            ALLOWED (via singleton getters or direct import)
Types       → Other Types only          ALLOWED

CIRCULAR Dependencies                   FORBIDDEN (A→B→A is never allowed)
Components  → Services directly         FORBIDDEN (use hooks as intermediary)
Hooks       → Other Hooks               CAUTION (allowed if no circular, prefer composition)
```

**Service Pattern:** Singleton lazy initialization via `get*Service()` functions.

**Current Status**: Clean architecture, no circular dependencies detected.

---

## Architecture Rules

1. **OmniChat → Pipeline pattern** for all code generation requests
2. **Zustand selectors** with `shallow` comparison for performance
3. **Singleton services** with lazy `get*Service()` initialization
4. **WebContainer validation** before displaying generated code
5. **Fire-and-forget** for non-critical async operations (skill saving, quality updates)
6. **Client-heavy architecture** — most logic runs in browser to reduce server costs
7. **Serverless API routes** — thin proxies to AI providers and Supabase
8. **Quality feedback loop** — VisualCritic scores feed back to SkillLibrary

---

## Key Patterns

| Pattern            | Implementation                                                      |
| ------------------ | ------------------------------------------------------------------- |
| State Management   | Zustand + Immer middleware, 3 stores (app, chat, project)           |
| Live Preview       | Sandpack with dynamic dependency extraction                         |
| AI Chat            | OmniChatService (Claude Sonnet) — intent classification + response  |
| Code Generation    | TitanPipelineService (Gemini) — Router → Architect → Assembler      |
| Code Validation    | WebContainerService — in-browser Node.js sandbox                    |
| Code Repair        | CodeRepairService — auto-fix with up to 3 attempts                  |
| Quality Scoring    | VisualCriticService (Gemini Flash) — screenshot analysis            |
| Skill Caching      | SkillLibraryService — pgvector embeddings (OpenAI text-embedding-3-small) |
| Motion Mapping     | MotionMapper — animation extraction from video/design               |
| Visual Effects     | `effects/` components — CSS particles, keyframe injection           |
| AI Providers       | Claude (chat/code), Gemini (vision/pipeline), OpenAI (embeddings/images) |

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (9 handlers)
│   │   ├── layout/         # analyze, chat, critique, pipeline, repair, screenshot
│   │   └── skills/         # route, save, update-quality
│   ├── login/, signup/     # Auth pages
│   └── layout.tsx, page.tsx
│
├── components/             # React components (73 files)
│   ├── LayoutBuilderView.tsx    # Main view orchestrator
│   ├── AppNavigation.tsx        # App navigation
│   ├── ErrorBoundary.tsx        # Error boundary
│   ├── SettingsPage.tsx         # Settings UI
│   ├── interface/               # OmniChat conversational UI
│   ├── layout-builder/          # LayoutCanvas, preview components
│   ├── effects/                 # CSS particles, visual effects
│   ├── preview/                 # Preview-related components
│   ├── review/                  # Review system components
│   ├── storage/                 # Storage/project components
│   ├── marketing/               # Marketing pages
│   ├── modals/                  # Modal dialogs
│   ├── dev/                     # Dev tools
│   └── ui/                      # Base UI components
│
├── hooks/                  # Custom hooks (7 files + index)
│   ├── useLayoutBuilder.ts      # Main orchestrator hook (669 lines)
│   ├── useProjectManager.ts     # Project save/load
│   ├── useElementInspector.ts   # Element inspection
│   ├── useStateInspector.ts     # State debugging
│   ├── useSettings.ts           # User settings
│   ├── useTheme.ts              # Theme management
│   └── useToast.ts              # Toast notifications
│
├── services/               # Business logic (14 files)
│   ├── TitanPipelineService.ts  # Agentic pipeline orchestrator
│   ├── OmniChatService.ts       # Conversational AI + intent
│   ├── GeminiLayoutService.ts   # Layout AI (Gemini)
│   ├── GeminiImageService.ts    # Image analysis (Gemini)
│   ├── WebContainerService.ts   # Sandbox validation
│   ├── CodeRepairService.ts     # Auto-repair
│   ├── VisualCriticService.ts   # Quality scoring
│   ├── SkillLibraryService.ts   # pgvector caching
│   ├── EmbeddingService.ts      # OpenAI embeddings
│   ├── GoogleSearchService.ts   # Web search for autonomy
│   ├── DynamicWorkflowEngine.ts # Workflow engine
│   ├── MotionMapper.ts          # Animation mapping
│   ├── ReactToHtmlService.ts    # React → HTML conversion
│   └── ProjectDatabase.ts       # Supabase project storage
│
├── store/                  # Zustand state (3 stores)
│   ├── useAppStore.ts           # Central app state (805 lines)
│   ├── useChatStore.ts          # Chat messages (persist)
│   └── useProjectStore.ts       # Project management (persist)
│
├── types/                  # TypeScript types (44 files, ~13,087 lines)
│   ├── layoutDesign.ts          # Design system (2,999 lines)
│   ├── titanPipeline.ts         # Pipeline types
│   ├── skillLibrary.ts          # Skill caching types
│   ├── motionConfig.ts          # Motion types
│   └── ...
│
├── utils/                  # Utilities (~3,933 lines)
│   ├── designPatterns.ts        # Design patterns
│   ├── snapEngine.ts            # Snap-to-grid alignment
│   ├── inspectorBridge.ts       # Inspector communication
│   ├── responsiveTypography.ts  # Responsive text sizing
│   └── ...
│
├── prompts/                # AI system prompts
├── data/                   # Presets and templates
└── contexts/               # React Context providers
```

---

## Key Entry Points

| File                        | Lines | Purpose                                                   |
| --------------------------- | ----- | --------------------------------------------------------- |
| `LayoutBuilderView.tsx`     | 311   | Main view — OmniChat (left) + LayoutCanvas (right)        |
| `useLayoutBuilder.ts`       | 669   | Orchestrator hook — pipeline, refinement, undo/redo       |
| `useAppStore.ts`            | 805   | Central Zustand state                                     |
| `OmniChatService.ts`        | 290   | Conversational AI + intent classification                 |
| `TitanPipelineService.ts`   | 612   | Agentic pipeline — Router → Architect → Assembler         |
| `WebContainerService.ts`    | 456   | In-browser sandbox validation                             |
| `SkillLibraryService.ts`    | 267   | pgvector skill caching + retrieval                        |
| `VisualCriticService.ts`    | 350   | Screenshot quality scoring (Gemini Flash)                 |
| `GeminiLayoutService.ts`    | 1,352 | Layout AI service (Gemini)                                |

---

## API Routes

| Route                          | Method | Purpose                         |
| ------------------------------ | ------ | ------------------------------- |
| `/api/layout/pipeline`         | POST   | Run Titan pipeline              |
| `/api/layout/chat`             | POST   | OmniChat conversational AI      |
| `/api/layout/analyze`          | POST   | Image/video analysis            |
| `/api/layout/critique`         | POST   | Visual Critic screenshot review |
| `/api/layout/repair`           | POST   | Code auto-repair                |
| `/api/layout/screenshot`       | POST   | Screenshot capture              |
| `/api/skills`                  | GET    | Query skill library             |
| `/api/skills/save`             | POST   | Save skill to library           |
| `/api/skills/update-quality`   | POST   | Update skill quality score      |

---

## Known Risks & Tech Debt

| Risk                                   | Severity     | Mitigation                                         |
| -------------------------------------- | ------------ | -------------------------------------------------- |
| `layoutDesign.ts` is 3k lines          | **HIGH**     | Split into `layout/typography`, `layout/grids`, etc |
| `GeminiLayoutService.ts` is 1.4k lines | MEDIUM       | Monitor for split opportunities                    |
| `useAppStore.ts` is 805 lines          | MEDIUM       | Consider splitting into domain slices              |
| `useLayoutBuilder.ts` is 669 lines     | MEDIUM       | Monitor complexity                                 |
| Browser memory with large histories    | MEDIUM       | Move historical versions to IndexedDB              |
| AI rate limits at scale                | HIGH         | Enterprise quotas, multiple keys                   |
| WebContainer browser compatibility     | MEDIUM       | Requires COOP/COEP headers (credentialless mode)   |

---

## Recent Changes Log

### Feb 2, 2026

- **Added**: WebContainer sandbox validation system (`WebContainerService.ts`, `CodeRepairService.ts`)
- **Added**: Skill Library with pgvector (`SkillLibraryService.ts`, `EmbeddingService.ts`)
- **Added**: Visual Critic quality loop (`VisualCriticService.ts`)
- **Added**: Quality feedback loop — cachedSkillId threaded through pipeline
- **Added**: 3 new API routes (`/api/layout/critique`, `/api/layout/repair`, `/api/skills/*`)
- **Refactored**: Major codebase pruning — removed legacy AIBuilder, NaturalConversationWizard, DynamicPhaseGenerator, PhaseExecutionManager, CodeParser, and related systems
- **Added**: OmniChat conversational interface with intent classification
- **Added**: Project management (save, load, switch, create projects)
- **Updated**: useLayoutBuilder expanded to 669 lines (WebContainer + Critic integration)
- **Documentation**: Full documentation cleanup — removed 35 legacy doc files, archived 4

### Jan 31, 2026

- **Added**: Titan Pipeline system (`TitanPipelineService`, types, API route)
- **Added**: Motion/Effects system (`MotionMapper`, `KeyframeInjector`, `effects/` components)
- **Added**: New utilities (`snapEngine`, `inspectorBridge`, `responsiveTypography`)
- **Refactored**: `LayoutCanvas.tsx` and `LayoutBuilderView.tsx` updated
