# AI App Builder - Project Memory

## Overview

Personal AI App Builder - Build React components and apps using Claude AI with natural conversation, visual design, and full-stack support.

**Core Features:**

- Dual-mode AI system (PLAN mode for planning, ACT mode for building)
- AI-powered dynamic phase generation (2-25+ phases based on complexity)
- Visual layout builder with Claude vision capabilities
- AST-based surgical code modifications
- Version control and rollback system
- Cloud storage with Supabase integration

## Tech Stack

- **Frontend:** Next.js 15.5 (App Router), React 19, TypeScript, Tailwind CSS
- **State:** Zustand 4.5 with Immer middleware
- **Backend:** Next.js API Routes with SSE streaming
- **Database:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** Anthropic Claude SDK (Sonnet), OpenAI SDK (DALL-E 3)
- **Parsing:** Tree-sitter for AST analysis, js-tiktoken for tokens

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (SSE streaming)
│   ├── login/, signup/     # Auth pages
│   └── layout.tsx, page.tsx
│
├── components/             # React components (60+ files)
│   ├── AIBuilder.tsx       # Main orchestrator (~1570 lines)
│   ├── NaturalConversationWizard.tsx  # PLAN mode wizard
│   ├── LayoutBuilderWizard.tsx        # Visual design mode
│   ├── layout-builder/     # Layout sub-components
│   ├── conversation-wizard/ # Planning sub-components
│   ├── modals/             # Modal dialogs
│   ├── build/              # Build UI components
│   └── ui/                 # Base UI components
│
├── hooks/                  # Custom hooks (30+ files)
│   ├── useLayoutBuilder.ts # Layout design state
│   ├── useAppStore.ts      # App store integration
│   ├── useDynamicBuildPhases.ts # Phase execution
│   └── __tests__/          # Hook tests
│
├── services/               # Business logic (25+ files)
│   ├── DynamicPhaseGenerator.ts  # AI phase planning
│   ├── PhaseExecutionManager.ts  # Phase orchestration
│   ├── CodeParser.ts       # AST parsing
│   └── analyzers/          # Specialized analyzers
│
├── store/                  # Zustand state
│   └── useAppStore.ts      # Central store (500+ lines, 8 slices)
│
├── types/                  # TypeScript types (16 files)
│   ├── layoutDesign.ts     # Design system (41KB)
│   ├── appConcept.ts       # Planning types
│   └── dynamicPhases.ts    # Phase types
│
├── utils/                  # Utilities (40+ files)
│   ├── astModifier.ts      # AST code editing (61KB)
│   ├── codeValidator.ts    # Syntax validation
│   └── designPatterns.ts   # Design patterns
│
├── prompts/                # AI system prompts
├── data/                   # Presets and templates
└── contexts/               # React Context providers
```

## Core Data Flow

```
User Input (NaturalConversationWizard)
    ↓
AppConcept object created
    ↓
DynamicPhaseGenerator → generates phase plan
    ↓
AIBuilder orchestrates (PLAN/ACT modes)
    ↓
PhaseExecutionManager → code generation
    ↓
Preview (Sandpack) + Version History
```

## Key Entry Points

| File                            | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `AIBuilder.tsx`                 | Main orchestrator, mode switching, phase control |
| `useAppStore.ts`                | Central state - all data flows through here      |
| `NaturalConversationWizard.tsx` | PLAN mode - builds AppConcept                    |
| `LayoutBuilderWizard.tsx`       | Visual design with AI vision                     |
| `DynamicPhaseGenerator.ts`      | Converts AppConcept → phase plan                 |
| `PhaseExecutionManager.ts`      | Executes phases, generates code                  |

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

- `useAppStore.ts` ← Many components depend on this store
- `types/layoutDesign.ts` ← Layout builder types used everywhere
- `AIBuilder.tsx` ← Orchestrates all modes and phases
- `middleware.ts` ← Auth flow, all API routes depend on this

### Important Patterns

- All API routes use SSE streaming for AI responses
- Zustand selectors use shallow comparison - don't break this
- Tree-sitter is used for AST parsing - test changes carefully
- Component state lives in useAppStore, not local state

### File Relationships

- `NaturalConversationWizard` → creates `AppConcept` → feeds `DynamicPhaseGenerator`
- `LayoutBuilderWizard` → uses `useLayoutBuilder` hook → updates `layoutDesign` types
- `AIBuilder` → uses `useDynamicBuildPhases` → calls `PhaseExecutionManager`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
ANTHROPIC_API_KEY=            # Claude API key
OPENAI_API_KEY=               # DALL-E API key
```

## See Also

Check `.claude/rules/` for domain-specific documentation:

- `layout-builder.md` - Layout builder patterns
- `conversation-wizard.md` - Planning wizard flow
- `ai-builder-core.md` - Core orchestration
- `api-routes.md` - API patterns
- `state-management.md` - State patterns
- `testing.md` - Testing conventions
