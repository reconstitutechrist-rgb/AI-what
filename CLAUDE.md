# AI App Builder - Project Memory

## CRITICAL: Read Master Context First

> **Before doing ANY work on this codebase, read [`MASTER_CONTEXT_VERIFIED.md`](MASTER_CONTEXT_VERIFIED.md)**
>
> This codebase is too large for AI context windows. The Master Context document provides:
>
> - **Verified file counts and line counts** (audited and accurate)
> - **Dependency hierarchy** (which files break what when modified)
> - **Critical files list** (DO NOT BREAK these)
> - **Import rules** (architectural boundaries)
> - **Known risks and tech debt**
>
> **Treat `MASTER_CONTEXT_VERIFIED.md` as your senior programmer briefing.**

---

## Overview

Personal AI App Builder — Build React components and apps using an omnipotent creation engine powered by Claude, Gemini, and a self-teaching autonomy system.

**Core Architecture:**

- **OmniChat** — Conversational interface with intent classification (pipeline | autonomy | live-edit | none)
- **Titan Pipeline** — Code generation via Gemini, with multi-stage Router → Architect → Assembler flow
- **WebContainer Sandbox** — In-browser Node.js runtime for active code validation before preview
- **Sandpack Preview** — Live code execution with instant visual feedback
- **Skill Library** — pgvector-backed long-term memory that caches and reuses validated solutions
- **Visual Critic** — Gemini Flash screenshot analysis that scores output quality (1-10) and feeds back to Skill Library

## Tech Stack

- **Frontend:** Next.js 15.5 (App Router), React 19, TypeScript, Tailwind CSS
- **State:** Zustand 4.5 with Immer middleware, Persist middleware
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL, Auth, Storage), pgvector for embeddings
- **AI:** Anthropic Claude SDK (Sonnet 4.5), Google Generative AI (Gemini 3 Pro/Flash)
- **Sandbox:** WebContainer API (@webcontainer/api) for in-browser code execution
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions)
- **Preview:** Sandpack for live code preview, Puppeteer for screenshots

## Directory Structure

```
src/
├── app/                         # Next.js App Router
│   ├── api/
│   │   ├── layout/              # Core pipeline routes
│   │   │   ├── pipeline/        # Titan Pipeline generation
│   │   │   ├── chat/            # OmniChat conversational AI
│   │   │   ├── critique/        # Visual Critic analysis
│   │   │   ├── repair/          # WebContainer code repair
│   │   │   ├── analyze/         # Media analysis
│   │   │   └── screenshot/      # Puppeteer screenshots
│   │   └── skills/              # Skill Library routes
│   │       ├── route.ts         # Search skills
│   │       ├── save/            # Save new skills
│   │       └── update-quality/  # Quality score feedback
│   ├── (protected)/             # Auth-protected pages
│   └── layout.tsx, page.tsx
│
├── components/                  # React components (59 files)
│   ├── LayoutBuilderView.tsx    # Main orchestrator
│   ├── interface/
│   │   └── OmniChat.tsx         # Chat interface
│   ├── layout-builder/          # Canvas and editor components
│   │   ├── LayoutCanvas.tsx     # Preview canvas
│   │   └── ...                  # Renderers, edit bubbles, chat panel
│   ├── preview/                 # Preview components (device frames, console)
│   ├── modals/                  # Modal dialogs
│   ├── marketing/               # Landing page components
│   └── ui/                      # Base UI components
│
├── hooks/                       # Custom hooks (8 files)
│   ├── useLayoutBuilder.ts      # Main pipeline orchestration hook
│   ├── useProjectManager.ts     # Project save/load/switch
│   └── ...                      # Theme, toast, settings, inspectors
│
├── services/                    # Business logic (14 files)
│   ├── TitanPipelineService.ts  # Core code generation pipeline
│   ├── OmniChatService.ts       # Conversational AI with intent classification
│   ├── WebContainerService.ts   # In-browser code validation sandbox
│   ├── SkillLibraryService.ts   # Vector-based solution caching
│   ├── VisualCriticService.ts   # Screenshot quality analysis
│   ├── EmbeddingService.ts      # OpenAI embedding generation
│   ├── CodeRepairService.ts     # Gemini-powered code repair
│   ├── ReactToHtmlService.ts    # React→HTML for screenshots
│   ├── GeminiImageService.ts    # Image analysis
│   ├── GeminiLayoutService.ts   # Layout generation
│   ├── GoogleSearchService.ts   # Web research for autonomy
│   ├── DynamicWorkflowEngine.ts # Agent swarm orchestration
│   ├── MotionMapper.ts          # Animation mapping
│   └── ProjectDatabase.ts       # IndexedDB project storage
│
├── store/                       # Zustand state (3 files)
│   ├── useAppStore.ts           # Central store (persisted app state)
│   ├── useChatStore.ts          # OmniChat message history
│   └── useProjectStore.ts       # Project list and active project
│
├── types/                       # TypeScript types (36 files)
│   ├── titanPipeline.ts         # Pipeline, OmniChat, Critic types
│   ├── skillLibrary.ts          # Skill Library types
│   ├── sandbox.ts               # WebContainer types
│   ├── visualCritic.ts          # Visual Critic types
│   ├── autonomy.ts              # Autonomy system types
│   ├── layoutDesign.ts          # Design system (41KB)
│   └── ...                      # Many domain-specific type files
│
├── utils/                       # Utilities
├── prompts/                     # AI system prompts
├── agents/                      # AI agent implementations
├── config/                      # App configuration
├── constants/                   # Constants
├── contexts/                    # React Context providers
└── data/                        # Presets and templates
```

## Core Data Flow

```
User Message (OmniChat)
    ↓
OmniChatService (Claude Sonnet 4.5)
    → Intent classification: pipeline | autonomy | live-edit | none
    → Skill Library query for cached solutions
    ↓
LayoutBuilderView.executeAction()
    ↓
useLayoutBuilder.runPipeline()
    ↓
TitanPipelineService (Gemini 3 Pro)
    → Router → Architect → Assembler
    → Outputs: AppFile[] (code files)
    ↓
WebContainerService (sandbox validation)
    → Install deps, build, check for errors
    → If errors: CodeRepairService auto-fixes (up to 3 attempts)
    ↓
Sandpack Preview (live in browser)
    ↓
VisualCriticService (Gemini Flash)
    → Screenshot → quality score (1-10)
    → If score > threshold: save to Skill Library
    → Quality score feeds back to Skill Library for matched skills
```

## Key Entry Points

| File | Purpose |
| --- | --- |
| `LayoutBuilderView.tsx` | Main orchestrator — OmniChat + LayoutCanvas |
| `useLayoutBuilder.ts` | Pipeline orchestration hook — runPipeline, refine, undo/redo |
| `OmniChatService.ts` | AI brain — intent classification, Skill Library integration |
| `TitanPipelineService.ts` | Code generation — Router → Architect → Assembler |
| `WebContainerService.ts` | Sandbox — validates generated code before preview |
| `SkillLibraryService.ts` | Vector memory — caches and reuses validated solutions |
| `VisualCriticService.ts` | Quality gate — screenshot analysis, quality scoring |
| `useAppStore.ts` | Central state — persisted app concept, components, UI state |
| `useChatStore.ts` | Chat state — OmniChat message history |

## Essential Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format
npm run typecheck    # TypeScript check
npm test             # Run all tests
npm run test:hooks   # Hook tests (JSDOM)
npm run test:services # Service tests (Node)
```

## Critical Warnings

### Don't Break These Dependencies

- `useAppStore.ts` — Many components depend on this store
- `useLayoutBuilder.ts` — Main pipeline hook, LayoutBuilderView depends on it
- `TitanPipelineService.ts` — Core code generation, called by useLayoutBuilder
- `OmniChatService.ts` — Chat AI brain, called by useLayoutBuilder
- `types/titanPipeline.ts` — Pipeline types used across services and components
- `middleware.ts` — Auth flow, all API routes depend on this

### Important Patterns

- Zustand selectors use shallow comparison — don't break this
- Services are singleton instances (lazy initialization via `get*Service()` functions)
- Fire-and-forget pattern for non-critical async ops (skill saving, quality updates)
- COOP/COEP headers required for WebContainer (SharedArrayBuffer)
- Component state lives in useAppStore/useChatStore, not local state

### File Relationships

- `OmniChat` → `useLayoutBuilder.sendChatMessage` → `OmniChatService` → intent classification
- `LayoutBuilderView.executeAction` → `useLayoutBuilder.runPipeline` → `TitanPipelineService`
- `runPipeline` → `WebContainerService` (validation) → `VisualCriticService` (critique)
- `VisualCriticService` → quality score → `SkillLibraryService.updateQualityScore` (feedback loop)
- `OmniChatService` → `SkillLibraryService.findSimilarSkills` → cached skill context

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
ANTHROPIC_API_KEY=            # Claude API key (OmniChat)
GOOGLE_AI_API_KEY=            # Gemini API key (Pipeline, Critic, Repair)
OPENAI_API_KEY=               # OpenAI API key (Embeddings for Skill Library)
```

## See Also

### Primary Context Document (READ FIRST)

- **[`MASTER_CONTEXT_VERIFIED.md`](MASTER_CONTEXT_VERIFIED.md)** - Verified codebase stats, dependency hierarchy, critical files, import rules.

### Domain-Specific Documentation

Check `.claude/rules/` for detailed documentation:

- `api-routes.md` - API route patterns and endpoints
- `state-management.md` - Zustand store patterns
- `testing.md` - Testing conventions
- `thorough-coding.md` - Coding practices and verification

---

## Keeping Master Context Updated

**`MASTER_CONTEXT_VERIFIED.md` must stay accurate.** When you make changes that affect the documented stats, update the document.

### When to Update Master Context

Update `MASTER_CONTEXT_VERIFIED.md` after ANY of these changes:

| Change Type                            | What to Update                                   |
| -------------------------------------- | ------------------------------------------------ |
| Add/remove `.ts` or `.tsx` files       | Quick Stats → TypeScript/TSX Files count         |
| Add/remove API route (`route.ts`)      | Quick Stats → API Route Handlers count           |
| Add/remove hooks in `src/hooks/`       | Quick Stats → Custom Hooks count                 |
| Add/remove services in `src/services/` | Quick Stats → Service Classes count              |
| Add/modify code in `src/types/`        | Quick Stats → Type Definitions line count        |
| Add/modify code in `src/utils/`        | Quick Stats → Utilities line count               |
| Modify a Critical File                 | Critical Files table → update line count         |
| Add new file with 5+ dependents        | Consider adding to Dependency Hierarchy          |
| Create file over 500 lines             | Consider adding to Critical Files or Known Risks |

### How to Verify and Update

**For file counts:**

```bash
# TypeScript/TSX files
find src -name "*.ts" -o -name "*.tsx" | wc -l

# API routes
find src/app/api -name "route.ts" | wc -l

# Hooks (excluding tests and index)
find src/hooks -name "*.ts" ! -name "*.test.ts" ! -name "index.ts" | wc -l

# Services (excluding tests and index)
find src/services -name "*.ts" ! -name "*.test.ts" ! -name "index.ts" | wc -l
```

**For line counts:**

```bash
# Types directory total
find src/types -name "*.ts" ! -name "*.test.ts" -exec wc -l {} \; | awk '{sum+=$1} END {print sum}'

# Utils directory total
find src/utils -name "*.ts" ! -name "*.test.ts" -exec wc -l {} \; | awk '{sum+=$1} END {print sum}'

# Specific file
wc -l src/path/to/file.ts
```

**For dependency counts:**

```bash
# Count files importing a type/module
grep -r "from.*moduleName\|import.*moduleName" src --include="*.ts" --include="*.tsx" -l | wc -l
```

### Update Protocol

1. **After significant changes**, run the relevant verification commands
2. **Compare** actual values with documented values
3. **Update** `MASTER_CONTEXT_VERIFIED.md` if numbers differ
4. **Note the date** in the document status line if making updates

### What NOT to Update

- Don't update for minor line count changes (±10 lines in large files)
- Don't update during work-in-progress - update when feature is complete
- Don't guess - always verify with actual commands before updating

---

## How Claude Should Work With This Project

### Quality Over Speed or Cost

**Prioritize accuracy and completeness over speed or cost savings. This applies to ALL requests.**

- When answering questions, ensure accuracy - verify before responding
- When making ANY change, find and update ALL occurrences - not 90%
- Use thorough searches (grep across entire codebase) before claiming something is complete
- If unsure, investigate rather than guess
- Never skip files or assume something doesn't need updating
- Take the time to do it right the first time

**For any codebase-wide change:**

1. Search entire `src/` for all patterns being changed
2. List all files that need modification
3. Update every occurrence systematically
4. Verify nothing was missed with a final search
5. Test that the change works correctly

### Sub-Agent Model Selection

**Minimum model: Sonnet.** Do not use Haiku for any sub-agents.

- **Sonnet** - Default for exploration, searches, planning agents
- **Opus** - Complex reasoning, architecture decisions, code review

### Analysis Depth

**Always do deep analysis, not surface-level.** When reviewing code, debugging, or evaluating architecture:

- Don't just describe what the code does - analyze why it matters, what's wrong, and what the implications are
- Find root causes, not symptoms
- Identify edge cases, failure modes, and non-obvious interactions
- Consider how changes affect the broader system (dependencies, data flow, state)
- Skip the obvious - focus on what's actually insightful or problematic

If asked to review or analyze something, go deep by default. Surface-level summaries are not helpful.

### Dual-AI Collaborative Workflow (Claude-Gemini Consensus)

**CONTEXT:** The user works with two AIs - Claude (you) and Gemini. Responses are shared between both AIs to reach consensus before implementation decisions are made.

**Your Role in This Workflow:**

1. **When receiving Gemini's analysis:** Provide your perspective - agree, disagree, or offer alternatives. Don't assume you need to implement what Gemini suggested.

2. **When asked "what do you think?":** This means provide analysis/opinion, not code. Give your assessment of the approach, identify gaps, suggest improvements.

3. **Default to consultation mode:** Unless explicitly asked to implement, assume the user wants your opinion to share with Gemini for consensus.

4. **Be direct about disagreements:** If you disagree with Gemini's approach, say so clearly and explain why. The user needs both perspectives to make informed decisions.

5. **Recognize consensus requests:** When the user shares another AI's response, they want your independent assessment - not automatic agreement or implementation.

**When to Implement vs. Consult:**

- **Consult (default):** User shares Gemini's response, asks "what do you think?", wants comparison
- **Implement:** User explicitly says "implement this", "build this", "make this change", or "go ahead"

### Before Making Changes

1. **Consult Master Context** - Check [`MASTER_CONTEXT_VERIFIED.md`](MASTER_CONTEXT_VERIFIED.md) for dependency counts and critical file warnings before touching any file.
2. **Read before editing** - Always read the full file before modifying. Understand existing patterns.
3. **Check dependencies** - Use grep to find all usages of functions/types before changing signatures. Cross-reference with Master Context dependency hierarchy.
4. **Understand the data flow** - Trace how data moves: OmniChat → Titan Pipeline → WebContainer → Sandpack → Visual Critic
5. **Respect existing patterns** - Match the style of surrounding code. Don't introduce new patterns without reason.

### When Modifying Code

- **useAppStore** - Always use shallow comparison with selectors. Never chain selectors.
- **Types** - Changes to `titanPipeline.ts` or `layoutDesign.ts` affect many files. Check all usages first.
- **Services** - Services are singletons. Side effects happen in hooks. Keep this separation.
- **API Routes** - Follow the existing JSON request/response pattern.

### After Making Changes

1. Run `npm run typecheck` - Must pass with no errors
2. Run `npm run lint` - Fix any lint issues
3. Run `npm test` - All tests must pass
4. Test in browser if UI changes - Verify the change works visually
5. **Update Master Context if needed** - If you added/removed files or significantly changed critical file line counts, update `MASTER_CONTEXT_VERIFIED.md` (see "Keeping Master Context Updated" section)

## Common Mistakes to Avoid

### Zustand Store

```typescript
// WRONG - Creates new object every render, causes infinite re-renders
const data = useAppStore((state) => ({ messages: state.messages }));

// CORRECT - Use shallow comparison
import { shallow } from 'zustand/shallow';
const data = useAppStore((state) => ({ messages: state.messages }), shallow);

// ALSO CORRECT - Select single value (no shallow needed)
const messages = useAppStore((state) => state.messages);
```

### Import Paths

```typescript
// WRONG - Inconsistent imports cause bundling issues
import { useAppStore } from '../store/useAppStore';
import { useAppStore } from '../../store/useAppStore';

// CORRECT - Always use @ alias
import { useAppStore } from '@/store/useAppStore';
```

### Component State

```typescript
// WRONG - Local state for data that should be shared
const [messages, setMessages] = useState([]);

// CORRECT - Use Zustand for shared state
const messages = useAppStore((state) => state.messages);
const addMessage = useAppStore((state) => state.addMessage);
```

### Type Modifications

```typescript
// WRONG - Adding optional field without migration
interface LayoutDesign {
  newField: string; // Breaks existing data
}

// CORRECT - Optional with default handling
interface LayoutDesign {
  newField?: string; // Safe addition
}
// AND handle in code:
const value = layoutDesign.newField ?? 'default';
```

## Current Development Focus

**Active Work Areas (check git status for latest):**

- WebContainer sandbox validation and code repair loop
- Skill Library integration (vector caching of validated solutions)
- Visual Critic quality feedback loop
- OmniChat intent classification and action dispatch

**Current Goals:**

- Improve code repair success rate in WebContainer sandbox
- Expand Skill Library reuse across similar requests
- Tune Visual Critic scoring thresholds
- Add more Sandpack dependency extraction patterns

## Success Criteria

### For Any Code Change

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] No `@ts-ignore` or `any` types added
- [ ] No console.log statements left in code
- [ ] Code matches existing patterns in file

### For Component Changes

- [ ] UI renders correctly in browser
- [ ] No React warnings in console
- [ ] Responsive at all breakpoints
- [ ] Zustand selectors use shallow comparison

### For Service Changes

- [ ] Service remains a singleton
- [ ] Error handling follows existing patterns
- [ ] Non-critical async uses fire-and-forget pattern

### For Type Changes

- [ ] All usages updated
- [ ] Optional fields have default handling
- [ ] No breaking changes to existing data

### For Structural Changes (adding/removing files)

- [ ] `MASTER_CONTEXT_VERIFIED.md` file counts updated if files added/removed
- [ ] `MASTER_CONTEXT_VERIFIED.md` line counts updated if critical files changed significantly
- [ ] New high-dependency files added to Dependency Hierarchy if applicable
- [ ] New large files (500+ lines) added to Critical Files or Known Risks if applicable

---

# Thorough Coding

(See `.claude/rules/thorough-coding.md` for the full thorough coding practices. They are loaded automatically as project rules.)
