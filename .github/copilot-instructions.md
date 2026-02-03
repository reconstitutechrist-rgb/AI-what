# AI App Builder - Copilot Instructions

## Project Overview

Personal AI App Builder that generates complete React components and applications through a multi-AI pipeline combining Claude Sonnet 4.5 for intent classification and Gemini 3 Pro for code generation.

### Architecture Overview

1. **OmniChat** (`OmniChat.tsx`) - Claude Sonnet 4.5-powered conversational interface that classifies user intent and dispatches actions
2. **Titan Pipeline** (`TitanPipelineService.ts`) - Gemini 3 Pro multi-stage code generation: Router -> Architect -> Assembler
3. **Visual Critic** (`VisualCriticService.ts`) - Gemini Flash quality scoring of generated output
4. **Skill Library** (`SkillLibraryService.ts`) - pgvector-backed cached solution retrieval and storage

### Core Data Flow

```
User Input (OmniChat / Claude Sonnet 4.5)
         |
    Intent Classification + Action Dispatch
         |
    Skill Library Lookup (pgvector similarity search)
         |
    Titan Pipeline (Gemini 3 Pro)
      Router -> Architect -> Assembler
         |
    WebContainer Sandbox (code validation)
         |
    Visual Critic (Gemini Flash quality scoring)
         |
    LayoutCanvas Preview + Skill Caching
```

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **State:** Zustand 4.5 with Immer middleware (3 stores: useAppStore, useChatStore, useProjectStore)
- **AI - Chat:** Anthropic Claude SDK (Sonnet 4.5) for OmniChat intent classification
- **AI - Code Gen:** Google Gemini 3 Pro (Titan Pipeline), Gemini Flash (Visual Critic)
- **AI - Images:** Google Gemini image generation, Google Search for reference images
- **Backend:** Next.js API Routes with SSE streaming
- **Database:** Supabase (PostgreSQL, Auth, Storage, pgvector for skill embeddings)
- **Sandbox:** WebContainer for in-browser code validation

## Key Files & Architecture

### Orchestration Layer

| File | Purpose |
| --- | --- |
| `src/components/LayoutBuilderView.tsx` | Main orchestrator - layout management, panel coordination |
| `src/components/OmniChat.tsx` | Chat interface powered by Claude Sonnet 4.5 |
| `src/components/LayoutCanvas.tsx` | Visual preview of generated components |

### Stores (3)

| Store | Purpose |
| --- | --- |
| `src/store/useAppStore.ts` | Central app state - files, versions, settings |
| `src/store/useChatStore.ts` | Chat conversation state and history |
| `src/store/useProjectStore.ts` | Project management state |

### Services Layer (14 Services)

| Service | Purpose |
| --- | --- |
| `TitanPipelineService.ts` | Multi-stage code generation: Router -> Architect -> Assembler (Gemini 3 Pro) |
| `OmniChatService.ts` | Claude Sonnet 4.5 intent classification and action dispatch |
| `WebContainerService.ts` | In-browser code validation sandbox |
| `SkillLibraryService.ts` | pgvector-backed cached solution retrieval and storage |
| `VisualCriticService.ts` | Gemini Flash quality scoring of generated output |
| `EmbeddingService.ts` | Text embedding generation for skill similarity search |
| `CodeRepairService.ts` | Automated code repair for validation failures |
| `ReactToHtmlService.ts` | React component to HTML conversion |
| `GeminiImageService.ts` | Gemini-based image generation |
| `GeminiLayoutService.ts` | Gemini-based layout analysis and generation |
| `GoogleSearchService.ts` | Google Search API for reference images |
| `DynamicWorkflowEngine.ts` | Dynamic workflow orchestration |
| `MotionMapper.ts` | Animation and motion mapping |
| `ProjectDatabase.ts` | Project persistence and management |

### Custom Hooks (8)

| Hook | Purpose |
| --- | --- |
| `useLayoutBuilder` | Layout design state and operations |
| `useProjectManager` | Project CRUD operations |
| `useElementInspector` | Element inspection and selection |
| `useSettings` | User settings management |
| `useStateInspector` | Debug state inspection |
| `useTheme` | Theme management |
| `useToast` | Toast notification system |

### API Routes

All API routes in `src/app/api/`:

| Route | Purpose |
| --- | --- |
| `/api/layout/pipeline` | Titan Pipeline - multi-stage code generation |
| `/api/layout/chat` | OmniChat - Claude-powered conversational interface |
| `/api/layout/critique` | Visual Critic - quality scoring |
| `/api/layout/repair` | Code repair for validation failures |
| `/api/layout/analyze` | Layout analysis |
| `/api/layout/screenshot` | Screenshot capture for visual analysis |
| `/api/skills` | Skill Library - retrieve cached solutions |
| `/api/skills/save` | Save new skills to library |
| `/api/skills/update-quality` | Update skill quality scores |

### Component Subdirectories

| Directory | Purpose |
| --- | --- |
| `src/components/interface/` | Interface-level components |
| `src/components/layout-builder/` | Layout builder tools and panels |
| `src/components/preview/` | Preview components |
| `src/components/modals/` | Modal dialogs |
| `src/components/marketing/` | Marketing/landing page components |
| `src/components/review/` | Review and feedback components |
| `src/components/storage/` | Storage management components |
| `src/components/effects/` | Visual effects components |
| `src/components/dev/` | Developer tools and debug panels |
| `src/components/ui/` | Base UI components |
| `src/components/layout/` | Layout structure components |

## Critical Patterns

### Zustand Store - MUST Use Shallow Comparison

```typescript
// CORRECT - useShallow for objects
import { useShallow } from 'zustand/react/shallow';
const { messages, isGenerating } = useAppStore(
  useShallow((state) => ({
    messages: state.messages,
    isGenerating: state.isGenerating,
  }))
);

// CORRECT - Single value (no shallow needed)
const messages = useAppStore((state) => state.messages);

// WRONG - Creates new object every render -> infinite re-renders
const data = useAppStore((state) => ({ messages: state.messages }));
```

### Import Paths - Always Use @ Alias

```typescript
// CORRECT
import { useAppStore } from '@/store/useAppStore';
import type { LayoutDesign } from '@/types/layoutDesign';

// WRONG - Causes bundling issues, inconsistent resolution
import { useAppStore } from '../store/useAppStore';
```

### SSE Streaming Pattern (AI Routes)

```typescript
const stream = new TransformStream();
const writer = stream.writable.getWriter();
const encoder = new TextEncoder();

// Send events
await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'progress', ... })}\n\n`));

return new Response(stream.readable, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});
```

### Services vs Hooks Separation

- **Services** (`src/services/`): Stateless, pure business logic, no React dependencies
- **Hooks** (`src/hooks/`): React state, side effects, call services

```typescript
// Service - stateless
export class TitanPipelineService {
  static async generate(prompt: string, context: PipelineContext): Promise<PipelineResult> { ... }
}

// Hook - manages state, calls service
export function useLayoutBuilder() {
  const [layout, setLayout] = useState<LayoutDesign | null>(null);
  // ...
  return { layout, updateLayout };
}
```

## Commands

```bash
npm run dev           # Start dev server
npm run dev:mock      # Mock AI mode (NEXT_PUBLIC_MOCK_AI=true) - no API calls
npm run dev:debug     # Debug panels (state inspector, API logs)
npm run typecheck     # TypeScript validation (MUST pass)
npm run lint          # ESLint (MUST pass)
npm run lint:fix      # Auto-fix lint issues
npm test              # Run core tests
npm run test:hooks    # Hook tests (JSDOM environment)
npm run test:services # Service tests (Node environment)
npm run test:all      # All tests including integration
```

## Testing Structure

| Environment | Location | Purpose |
| --- | --- | --- |
| Node | `tests/**/*.test.ts`, `src/services/__tests__/` | Services, utilities, API logic |
| JSDOM | `src/hooks/__tests__/`, `src/components/__tests__/` | React hooks, components |

## Key Directories

| Directory | Purpose |
| --- | --- |
| `src/services/` | Business logic (14 services) - TitanPipeline, OmniChat, SkillLibrary, etc. |
| `src/hooks/` | Custom hooks (8) - useLayoutBuilder, useProjectManager, etc. |
| `src/store/` | Zustand stores (3) - useAppStore, useChatStore, useProjectStore |
| `src/types/` | TypeScript types - layoutDesign.ts, etc. |
| `src/utils/` | Utility functions |
| `src/prompts/` | AI system prompts organized by feature |
| `src/data/` | Presets (animations, effects, templates, component patterns) |
| `src/components/layout-builder/` | Layout builder sub-components |
| `src/components/interface/` | Interface components |
| `src/components/preview/` | Preview components |

## Before Making Changes

1. **Read the full file** before modifying - understand existing patterns
2. **Check dependencies:** search for all usages before changing signatures
3. **Type changes to `layoutDesign.ts`** affect many files - check all usages first
4. **API route changes** - verify SSE streaming pattern is preserved
5. **Service changes** - services are stateless; side effects belong in hooks

## Validation Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] No `@ts-ignore` or `any` types added
- [ ] Zustand selectors use `useShallow` for object selections
- [ ] Services remain stateless (side effects go in hooks)
- [ ] Imports use `@/` alias

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
ANTHROPIC_API_KEY             # Claude API key (OmniChat)
GOOGLE_GEMINI_API_KEY         # Gemini API key (Titan Pipeline, Visual Critic)
GOOGLE_SEARCH_API_KEY         # Google Search API key (reference images)
NEXT_PUBLIC_MOCK_AI=true      # Enable mock mode for dev without API
NEXT_PUBLIC_DEBUG_PANEL=true  # Enable debug panels
```

## Additional Documentation

- `.claude/rules/` - Domain-specific rules (state-management, api-routes, testing, layout-builder, etc.)
- `.github/agents/` - Agent-specific documentation for different contexts
- `MASTER_CONTEXT_VERIFIED.md` - Verified codebase stats and dependency hierarchy
