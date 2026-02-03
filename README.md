# AI App Builder

> Build React components and apps using an omnipotent creation engine powered by Claude, Gemini, and a self-teaching autonomy system.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet_4.5-orange)](https://anthropic.com/)
[![Gemini](https://img.shields.io/badge/Gemini-3_Pro-blue)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-green)](https://supabase.com/)
[![WebContainers](https://img.shields.io/badge/WebContainers-Sandbox-purple)](https://webcontainers.io/)

---

## Overview

AI App Builder is a full-stack platform for building React applications through conversational AI. The system combines three AI providers into a unified creation pipeline:

- **Claude Sonnet 4.5** powers OmniChat, the conversational interface that classifies user intent and orchestrates actions
- **Gemini 3 Pro** drives the Titan Pipeline, a three-stage code generation engine (Router, Architect, Assembler)
- **OpenAI Embeddings** back the Skill Library, a pgvector-powered long-term memory that caches and retrieves validated solutions

Generated code is validated in an in-browser WebContainer sandbox before reaching the live Sandpack preview. A Visual Critic (Gemini Flash) scores the output and feeds quality data back into the Skill Library, creating a self-improving feedback loop.

---

## Core Systems

### OmniChat

Conversational interface powered by Claude Sonnet 4.5. Classifies every user message into one of four intents:

| Intent        | Action                                                   |
| ------------- | -------------------------------------------------------- |
| `pipeline`    | Triggers Titan Pipeline for full code generation         |
| `autonomy`    | Engages dynamic workflow engine for multi-step reasoning |
| `live-edit`   | Applies targeted code modifications in-place             |
| `none`        | Pure conversation, no code action                        |

### Titan Pipeline

Three-stage code generation via Gemini 3 Pro:

1. **Router** -- Analyzes the request, determines component structure, queries Skill Library for cached solutions
2. **Architect** -- Designs the component architecture, layout, and data flow
3. **Assembler** -- Generates production-ready React + Tailwind CSS code

### WebContainer Sandbox

In-browser Node.js runtime (WebContainer API) that validates generated code before it reaches the preview. Catches syntax errors, missing imports, and runtime failures. Paired with a Code Repair Service that auto-fixes common issues using Gemini.

### Sandpack Preview

Live code execution with hot reload, device frame simulation (mobile/tablet/desktop), console panel, and touch simulation.

### Skill Library

Long-term memory backed by Supabase pgvector:

- **Embeddings** -- OpenAI `text-embedding-3-small` (1536 dimensions)
- **Search** -- Cosine similarity retrieval of validated solutions
- **Quality Tracking** -- Scores updated by Visual Critic feedback
- **Caching** -- Successful generations are stored for future reuse

### Visual Critic

Automated quality assessment using Gemini Flash:

- Takes screenshots of rendered output via Puppeteer
- Scores visual quality on a 1-10 scale
- Provides structured feedback on layout, spacing, typography, and color
- Feeds quality scores back to Skill Library entries

---

## Architecture

### Data Flow

```
User Message (OmniChat)
    |
    v
OmniChatService (Claude Sonnet 4.5)
    |-- intent classification
    v
LayoutBuilderView.executeAction
    |
    v
useLayoutBuilder.runPipeline
    |
    v
TitanPipelineService (Gemini 3 Pro)
    |-- Router -> Architect -> Assembler
    |-- Skill Library query (pgvector)
    v
WebContainerService (validation)
    |-- CodeRepairService (auto-fix if needed)
    v
Sandpack Preview (live render)
    |
    v
VisualCriticService (Gemini Flash)
    |-- screenshot analysis
    |-- quality score (1-10)
    v
Skill Library (feedback + cache)
```

### AI Model Routing

| Task                 | Model                          | Purpose                                   |
| -------------------- | ------------------------------ | ----------------------------------------- |
| Conversation + Intent| Claude Sonnet 4.5              | Intent classification, orchestration      |
| Code Generation      | Gemini 3 Pro                   | Titan Pipeline (Router/Architect/Assembler)|
| Visual Critique      | Gemini Flash                   | Screenshot analysis, quality scoring      |
| Code Repair          | Gemini 3 Pro                   | WebContainer error auto-fix               |
| Media Analysis       | Gemini 3 Pro                   | Image/video reference analysis            |
| Embeddings           | OpenAI text-embedding-3-small  | Skill Library vector search               |

### State Management

Three Zustand stores with Immer and Persist middleware:

| Store              | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `useAppStore`      | Central application state (layout, UI, settings) |
| `useChatStore`     | OmniChat message history and streaming state     |
| `useProjectStore`  | Project list, active project, persistence        |

---

## Tech Stack

### Frontend

- **Next.js 15.5** -- App Router
- **React 19** -- Latest features and hooks
- **TypeScript 5.2** -- Full type safety
- **Tailwind CSS 3.3** -- Utility-first styling
- **Zustand 4.5** -- State management with Immer + Persist
- **Framer Motion** -- Animations and transitions
- **Sandpack** -- Live code preview
- **dnd-kit** -- Drag and drop interactions

### Backend

- **Next.js API Routes** -- Serverless endpoints
- **Supabase** -- PostgreSQL, Auth, File Storage, pgvector
- **Puppeteer** -- Server-side screenshot generation

### AI Integration

- **Anthropic Claude SDK** -- Sonnet 4.5 for OmniChat
- **Google Generative AI SDK** -- Gemini 3 Pro (pipeline, repair, analysis), Gemini Flash (critic)
- **OpenAI SDK** -- `text-embedding-3-small` for Skill Library embeddings

### Runtime

- **WebContainer API** -- In-browser Node.js sandbox for code validation
- **esbuild / esbuild-wasm** -- Fast bundling for validation

---

## API Routes

9 endpoints serving the core systems:

### Titan Pipeline

| Endpoint                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `/api/layout/pipeline`    | POST   | Full Titan Pipeline generation |
| `/api/layout/repair`      | POST   | WebContainer code repair       |

### OmniChat

| Endpoint                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `/api/layout/chat`        | POST   | Conversational AI (Claude)     |

### Visual Critic

| Endpoint                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `/api/layout/critique`    | POST   | Screenshot quality analysis    |
| `/api/layout/screenshot`  | POST   | Puppeteer screenshot capture   |

### Media

| Endpoint                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `/api/layout/analyze`     | POST   | Image/video media analysis     |

### Skill Library

| Endpoint                      | Method | Description                    |
| ----------------------------- | ------ | ------------------------------ |
| `/api/skills`                 | POST   | Search skills by embedding     |
| `/api/skills/save`            | POST   | Save validated skill           |
| `/api/skills/update-quality`  | POST   | Update quality score feedback  |

---

## Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── api/
│   │   ├── layout/                   # Core API routes
│   │   │   ├── pipeline/             # Titan Pipeline generation
│   │   │   ├── chat/                 # OmniChat (Claude)
│   │   │   ├── critique/             # Visual Critic
│   │   │   ├── repair/               # Code repair
│   │   │   ├── analyze/              # Media analysis
│   │   │   └── screenshot/           # Puppeteer screenshots
│   │   └── skills/                   # Skill Library CRUD
│   │       ├── save/                 # Save new skills
│   │       └── update-quality/       # Quality score updates
│   ├── (protected)/                  # Auth-gated pages
│   └── layout.tsx, page.tsx
│
├── components/                       # React components (59 files)
│   ├── LayoutBuilderView.tsx         # Main view orchestrator
│   ├── interface/
│   │   └── OmniChat.tsx              # Conversational AI interface
│   ├── layout-builder/               # Canvas, renderers, chat panel
│   │   ├── LayoutCanvas.tsx
│   │   ├── DynamicLayoutRenderer.tsx
│   │   ├── FloatingEditBubble.tsx
│   │   └── ...
│   ├── preview/                      # Device frames, console, touch sim
│   ├── modals/                       # Project list, dialogs
│   ├── marketing/                    # Landing page sections
│   ├── review/                       # Diff viewer, review panels
│   ├── storage/                      # File management UI
│   ├── effects/                      # Visual effects, particles
│   ├── dev/                          # Debug panel, element inspector
│   ├── ui/                           # Base form components
│   └── layout/                       # Drag-drop canvas
│
├── services/                         # Business logic (14 services)
│   ├── TitanPipelineService.ts       # Router → Architect → Assembler
│   ├── OmniChatService.ts            # Claude intent classification
│   ├── WebContainerService.ts        # In-browser Node.js sandbox
│   ├── SkillLibraryService.ts        # pgvector skill search/save
│   ├── VisualCriticService.ts        # Screenshot quality scoring
│   ├── EmbeddingService.ts           # OpenAI embedding generation
│   ├── CodeRepairService.ts          # Auto-fix validation errors
│   ├── ReactToHtmlService.ts         # React-to-HTML conversion
│   ├── GeminiImageService.ts         # Gemini image analysis
│   ├── GeminiLayoutService.ts        # Gemini layout generation
│   ├── GoogleSearchService.ts        # Web search integration
│   ├── DynamicWorkflowEngine.ts      # Autonomy workflow engine
│   ├── MotionMapper.ts               # Animation mapping
│   └── ProjectDatabase.ts            # Project persistence
│
├── hooks/                            # Custom hooks (8)
│   ├── useLayoutBuilder.ts           # Main pipeline orchestration
│   ├── useProjectManager.ts          # Project save/load/switch
│   ├── useElementInspector.ts        # Dev element inspection
│   ├── useSettings.ts                # App settings
│   ├── useStateInspector.ts          # Debug state exposure
│   ├── useTheme.ts                   # Theme management
│   ├── useToast.ts                   # Toast notifications
│   └── index.ts                      # Barrel exports
│
├── store/                            # Zustand stores (3)
│   ├── useAppStore.ts                # Central application state
│   ├── useChatStore.ts               # OmniChat messages
│   └── useProjectStore.ts            # Project list
│
├── types/                            # TypeScript type definitions
│   ├── titanPipeline.ts              # Pipeline types
│   ├── skillLibrary.ts               # Skill Library types
│   ├── visualCritic.ts               # Critic types
│   ├── sandbox.ts                    # WebContainer types
│   ├── autonomy.ts                   # Autonomy system types
│   ├── layoutDesign.ts               # Design system types
│   ├── project.ts                    # Project types
│   └── ...                           # 36 type definition files
│
├── utils/                            # Utility functions (13 files)
│   ├── extractCode.ts                # Code extraction from AI output
│   ├── extractDependencies.ts        # Dependency detection
│   ├── geminiRetry.ts                # Gemini API retry logic
│   ├── layoutConverter.ts            # Layout format conversion
│   ├── layoutValidation.ts           # Layout validation
│   └── ...
│
├── prompts/                          # AI system prompts
├── data/                             # Templates and presets
└── contexts/                         # React Context providers
```

---

## Services

### TitanPipelineService

Three-stage code generation engine:

- **Router** -- Analyzes request complexity, queries Skill Library for cached solutions, determines generation strategy
- **Architect** -- Designs component structure, layout hierarchy, and responsive behavior
- **Assembler** -- Produces final React + Tailwind CSS code with proper imports and exports

### OmniChatService

Conversational AI powered by Claude Sonnet 4.5:

- Intent classification (pipeline, autonomy, live-edit, none)
- Context-aware responses with project state
- Action dispatch to appropriate system

### WebContainerService

In-browser Node.js runtime for pre-preview validation:

- Boots a WebContainer instance with package.json and dependencies
- Runs esbuild to validate syntax and imports
- Reports errors back for auto-repair via CodeRepairService

### SkillLibraryService

Long-term memory with pgvector semantic search:

- Generates embeddings via OpenAI `text-embedding-3-small` (1536 dimensions)
- Cosine similarity search for relevant cached solutions
- Quality score tracking updated by Visual Critic feedback
- Stores validated code patterns for reuse

### VisualCriticService

Automated visual quality assessment:

- Captures rendered output via Puppeteer screenshots
- Gemini Flash analyzes layout, spacing, typography, color harmony
- Returns structured quality score (1-10) with feedback
- Updates Skill Library entries with quality data

---

## Hooks

| Hook                   | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `useLayoutBuilder`     | Main pipeline orchestration -- triggers generation, manages state |
| `useProjectManager`    | Project CRUD -- save, load, switch, create projects  |
| `useElementInspector`  | Dev tool for inspecting rendered elements            |
| `useSettings`          | Application settings management                     |
| `useStateInspector`    | Debug state exposure to `window.__APP_STATE__`       |
| `useTheme`             | Theme switching (light/dark)                         |
| `useToast`             | Toast notification management                        |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key (Claude Sonnet 4.5)
- Google AI API key (Gemini 3 Pro / Flash)
- OpenAI API key (embeddings for Skill Library)
- Supabase account with pgvector extension enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/takk387/AI-app.git
cd AI-app

# Install dependencies
npm install
```

### Environment Variables

Create `.env.local`:

```env
# Anthropic (required -- powers OmniChat)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google AI (required -- powers Titan Pipeline, Visual Critic, Code Repair)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# OpenAI (required -- powers Skill Library embeddings)
OPENAI_API_KEY=your_openai_api_key

# Supabase (required -- database, auth, storage, pgvector)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Debug Mode

```bash
# Run with debug panels visible
npm run dev:debug

# Run with mock AI (no API calls)
npm run dev:mock
```

---

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format
npm run typecheck    # TypeScript type check
npm test             # Run all tests
npm run test:hooks   # Hook tests (JSDOM)
npm run test:services # Service tests (Node)
npm run test:watch   # Watch mode
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open a Pull Request

---

## License

Private repository. Contact the owner for licensing information.

---

## Acknowledgments

- [Anthropic](https://anthropic.com/) -- Claude AI
- [Google AI](https://ai.google.dev/) -- Gemini AI
- [OpenAI](https://openai.com/) -- Embeddings
- [Supabase](https://supabase.com/) -- Database, Auth, pgvector
- [StackBlitz](https://stackblitz.com/) -- WebContainer API
- [CodeSandbox](https://codesandbox.io/) -- Sandpack preview

---

**Built with Next.js, React, Claude, Gemini, and a self-teaching Skill Library**
