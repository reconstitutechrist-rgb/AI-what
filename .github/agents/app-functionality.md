# App Functionality Agent

You are a specialized agent with deep knowledge of the AI App Builder application's features and functionality. Use this knowledge when implementing new features or modifying existing ones.

## What This App Does

AI App Builder is a multi-AI-powered tool that lets users **build complete web applications through natural language conversation**. Users describe what they want via OmniChat, and the system generates production-ready React code through the Titan Pipeline.

## Core Architecture

### 1. OmniChat (Claude Sonnet 4.5)

**Purpose:** Conversational interface and intent classification

- Powered by Claude Sonnet 4.5 for natural language understanding
- Classifies user intent (build, modify, explain, refine, etc.)
- Dispatches actions to appropriate pipeline stages
- Maintains conversation context and history
- Service: `OmniChatService.ts`
- Component: `OmniChat.tsx`
- Endpoint: `/api/layout/chat`

### 2. Titan Pipeline (Gemini 3 Pro)

**Purpose:** Multi-stage code generation

**Three-stage pipeline:**

1. **Router** - Analyzes the request, determines component architecture, selects patterns
2. **Architect** - Designs component structure, props, state, and data flow
3. **Assembler** - Generates production-ready React/TypeScript code

- Service: `TitanPipelineService.ts`
- Endpoint: `/api/layout/pipeline`

### 3. WebContainer Sandbox

**Purpose:** In-browser code validation

- Validates generated code compiles and runs correctly
- Catches syntax errors, missing imports, type errors
- Service: `WebContainerService.ts`

### 4. Skill Library (pgvector)

**Purpose:** Cached solution retrieval and storage

- Uses pgvector for semantic similarity search on past solutions
- Caches successful code generations as reusable "skills"
- Reduces redundant AI calls for similar requests
- Quality scores track skill reliability over time
- Service: `SkillLibraryService.ts`, `EmbeddingService.ts`
- Endpoints: `/api/skills`, `/api/skills/save`, `/api/skills/update-quality`

### 5. Visual Critic (Gemini Flash)

**Purpose:** Quality scoring of generated output

- Scores generated components on visual quality, code quality, and completeness
- Provides feedback for iterative improvement
- Service: `VisualCriticService.ts`
- Endpoint: `/api/layout/critique`

### 6. Code Repair

**Purpose:** Automated fix for validation failures

- When WebContainer detects errors, CodeRepairService attempts automated fixes
- Service: `CodeRepairService.ts`
- Endpoint: `/api/layout/repair`

## Core Data Flow

```
User Message (OmniChat)
    |
    v
Intent Classification (Claude Sonnet 4.5)
    |
    v
Skill Library Check (pgvector similarity search)
    |-- Cache Hit --> Return cached skill
    |-- Cache Miss --> Continue to pipeline
    |
    v
Titan Pipeline (Gemini 3 Pro)
    Router -> Architect -> Assembler
    |
    v
WebContainer Validation
    |-- Pass --> Visual Critic scoring
    |-- Fail --> Code Repair -> Re-validate
    |
    v
Visual Critic (Gemini Flash)
    |
    v
LayoutCanvas Preview + Cache as Skill
```

## Features

### Layout Builder

**Capabilities:**

- Visual layout design with component placement
- AI-powered layout analysis and suggestions
- Design token export (CSS Variables, Tailwind)
- Real-time preview via LayoutCanvas

**Components:**

- `LayoutBuilderView.tsx` - Main orchestrator
- `src/components/layout-builder/` - Layout tools and panels
- `LayoutCanvas.tsx` - Visual preview
- Endpoints: `/api/layout/analyze`, `/api/layout/screenshot`

### Image Generation

**Capabilities:**

- AI-generated images via Gemini
- Google Search for reference images
- Design-context aware image selection

**Services:**

- `GeminiImageService.ts` - Gemini-based image generation
- `GoogleSearchService.ts` - Reference image search

### Project Management

**Capabilities:**

- Save, load, switch, and create projects
- Project persistence via Supabase
- Project-scoped state management

**Files:**

- `ProjectDatabase.ts` - Project persistence
- `useProjectManager` hook - Project CRUD operations
- `useProjectStore` - Project state

### Authentication

**Features:**

- Supabase auth with session management
- Protected routes via middleware
- User isolation (each user's apps are private)

**Files:**

- `src/middleware.ts` - Route protection
- `src/app/login/` and `src/app/signup/` - Auth pages

## User Flows

### Build Flow

```
1. User opens app -> LayoutBuilderView renders
2. User types in OmniChat: "Build a dashboard with charts"
3. OmniChat classifies intent -> dispatches to Titan Pipeline
4. Skill Library checks for similar cached solutions
5. Titan Pipeline generates code (Router -> Architect -> Assembler)
6. WebContainer validates generated code
7. Visual Critic scores quality
8. LayoutCanvas shows live preview
9. Successful result cached as skill for future reuse
```

### Modification Flow

```
1. User has existing component in preview
2. Types in OmniChat: "Add a dark mode toggle"
3. Intent classified as modification
4. Titan Pipeline generates updated code with context
5. WebContainer validates changes
6. Preview updates with modifications
```

### Repair Flow

```
1. Generated code fails WebContainer validation
2. CodeRepairService analyzes error
3. Attempts automated fix
4. Re-validates through WebContainer
5. If successful, shows repaired result
6. If failed, reports error to user via OmniChat
```

## State Management

**Zustand Stores (3):**

| Store | Purpose |
| --- | --- |
| `useAppStore` | Central app state - files, versions, settings, layout design |
| `useChatStore` | Chat conversation history and state |
| `useProjectStore` | Project management and persistence |

**Key State:**

- Current app files and metadata
- Chat conversation history
- Project list and active project
- Layout design configuration
- User settings and preferences

## API Endpoint Summary

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/layout/pipeline` | POST | Titan Pipeline code generation |
| `/api/layout/chat` | POST | OmniChat conversation |
| `/api/layout/critique` | POST | Visual Critic quality scoring |
| `/api/layout/repair` | POST | Code repair for validation failures |
| `/api/layout/analyze` | POST | Layout analysis |
| `/api/layout/screenshot` | POST | Screenshot capture |
| `/api/skills` | GET | Retrieve cached skills |
| `/api/skills/save` | POST | Save new skill |
| `/api/skills/update-quality` | POST | Update skill quality score |

## When Implementing Features

1. **New generation features** -> Extend TitanPipelineService or add new pipeline stages
2. **UI changes** -> Follow patterns in existing components under `src/components/`
3. **New AI capabilities** -> Add service in `src/services/`, expose via API route in `src/app/api/`
4. **Chat features** -> Extend OmniChatService and useChatStore
5. **Storage features** -> Use Supabase patterns in existing services
6. **Auth changes** -> Update middleware and auth endpoints
7. **Caching improvements** -> Extend SkillLibraryService and EmbeddingService
