# Plan: OmniChat + Autopoietic Self-Teaching System

## Vision

This is a virtual reality engine where text input generates anything. The OmniChat is the "Mouth" -- a context-aware conversational interface that can dispatch standard pipeline tools OR invoke the Autonomy Core for unknown/complex problems.

---

## Existing Infrastructure (Already Implemented)

| File | Lines | Status |
|------|-------|--------|
| `src/agents/AutonomyCore.ts` | 41 | Functional -- calls SwarmFactory + WorkflowEngine. Missing self-correction loop. |
| `src/agents/AgentSwarmFactory.ts` | 103 | Fully functional -- Gemini 3 Pro dynamically fabricates agent teams |
| `src/services/DynamicWorkflowEngine.ts` | 120 | Functional sequential (RESEARCHERS->ARCHITECTS->CODERS). No DAG, no self-correction. |
| `src/services/GoogleSearchService.ts` | 88 | Fully functional with mock fallback |
| `src/store/useChatStore.ts` | ~80 | Exists with message persistence, NOT wired to any UI |
| `src/agents/types.ts` | 394 | Complete type system |
| `src/types/autonomy.ts` | ~91 | Complete types for goals, swarms, workflows |
| `TitanPipelineService.ts` | 539 | Already calls `autonomyCore.solveUnknown()` for RESEARCH_AND_BUILD mode |

The autopoietic backbone works. The gaps are: **chat UI, chat API, self-correction, and wiring**.

---

## Step 1: OmniChat Service (Backend)

### [NEW] `src/services/OmniChatService.ts` (~200 lines)

The AI brain behind the chat. Uses **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) for fast conversation + intent classification.

**Core philosophy -- "Anything is possible. Figure it out."**

The system prompt MUST establish that this AI never says "I can't do that." If it doesn't know how to do something, it triggers the autonomy system to research, learn, and build it. There are no impossible requests -- only problems that haven't been solved yet.

**Core method:** `chat(request)`

- **Receives:** message, conversationHistory, currentCode, appContext, generatedFiles summary
- **System prompt** instructs Claude as an omnipotent creation engine that:
  - Never refuses -- if it doesn't know how, it triggers autonomy to figure it out
  - Sees current generated code (truncated to ~200 lines)
  - Sees conversation history (last 20 messages)
  - Knows it can trigger: `pipeline` (standard build), `autonomy` (unknown/complex), or `live-edit` (quick code tweak), or `none` (just conversation)
  - For ANY request it doesn't have built-in knowledge for -> `action: 'autonomy'`
  - The autonomy system will research it, fabricate specialist agents, and build it

**Returns JSON:**

```json
{
  "reply": "string",
  "action": "pipeline | autonomy | live-edit | none",
  "actionPayload": {
    "instructions": "string",
    "selectedDataId": "string (optional)"
  }
}
```

**System prompt core principle:**

```
You are an omnipotent creation engine. ANYTHING the user asks for is possible.
You have two modes:
1. Standard generation -- for layouts, UI components, styling changes
2. Autonomy mode -- for ANYTHING you don't have built-in knowledge for

You NEVER say "I can't do that" or "That's not possible."
If you don't know how to build something, you trigger autonomy mode.
The autonomy system will: research the topic, fabricate specialist AI agents,
and construct the solution from scratch. Your job is to figure it out, not refuse.

Examples of autonomy triggers:
- "Build a 3D engine" -> autonomy (research WebGL/Three.js, build it)
- "Create a quantum simulation" -> autonomy (research algorithms, implement)
- "Make an L-System fractal" -> autonomy (research fractal math, code it)
- ANY unfamiliar technology, algorithm, or concept -> autonomy
```

**Routing logic:**

- "Make the header blue" -> `action: 'live-edit'` (fast, cheap)
- "Create a hero section" -> `action: 'pipeline'` (standard generation)
- "Build a 3D fractal generator" -> `action: 'autonomy'` (unknown -> self-teaching)
- "Build a physics simulation" -> `action: 'autonomy'` (unknown -> self-teaching)
- "What's the best approach for animations?" -> `action: 'none'` (just chat)

### [NEW] `src/app/api/layout/chat/route.ts` (~50 lines)

POST endpoint. Validates input, calls `OmniChatService.chat()`, returns response.
Pattern matches existing `/api/layout/pipeline/route.ts`.

---

## Step 2: OmniChat Types

### [MODIFY] `src/types/titanPipeline.ts` (+35 lines)

```typescript
// OMNICHAT TYPES
export interface OmniConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OmniChatRequest {
  message: string;
  conversationHistory: OmniConversationMessage[];
  currentCode: string | null;
  appContext?: AppContext;
}

export type OmniChatAction = 'pipeline' | 'autonomy' | 'live-edit' | 'none';

export interface OmniChatResponse {
  reply: string;
  action: OmniChatAction;
  actionPayload?: {
    instructions: string;
    selectedDataId?: string;
  };
}
```

---

## Step 3: OmniChat UI Component

### [NEW] `src/components/interface/OmniChat.tsx` (~350 lines)

Replaces `LayoutBuilderChatPanel` as the primary interaction interface.

**Key differences from LayoutBuilderChatPanel:**

- **Context-aware header:** Shows current state (idle, generating, self-teaching)
- **Action indicators:** When AI triggers pipeline or autonomy, shows what's happening
- **Autonomy progress:** When self-teaching mode activates, shows agent swarm status (which agents were fabricated, research progress, code generation)
- **Media upload:** Preserved from current chat panel

**Uses:**

- `useChatStore` for message persistence (already exists)
- Props from parent for pipeline/autonomy state

**UI structure:**

```
+---------------------------+
| OmniChat     [status dot] |
+---------------------------+
| Welcome message...        |
| [user]: Create a fractal  |
| [assistant]: I'll research |
|   fractal algorithms...   |
| [system]: Autonomy active |
|   > Fabricated 3 agents   |
|   > Researching L-Systems |
|   > Writing algorithm...  |
|   > Assembling code...    |
| [assistant]: Done! I've   |
|   generated an L-System   |
|   fractal renderer.       |
+---------------------------+
| [upload] [input...] [send]|
+---------------------------+
```

---

## Step 4: Wire OmniChat into LayoutBuilderView

### [MODIFY] `src/components/LayoutBuilderView.tsx` (~80 lines changed)

Replace `LayoutBuilderChatPanel` import with `OmniChat`.

**New `handleSendMessage` flow:**

1. Add user message to chat (via `useChatStore`)
2. Build conversation history (last 20 messages, exclude system)
3. Call `sendChatMessage()` -> get AI response with action classification
4. Display AI reply immediately
5. Based on action:
   - `'none'` -> Done, just conversation
   - `'pipeline'` -> Run `runPipeline([], actionPayload.instructions, appContext)`
   - `'live-edit'` -> Run `refineComponent(actionPayload.selectedDataId, actionPayload.instructions, ...)`
   - `'autonomy'` -> Run `runPipeline([], actionPayload.instructions, appContext)` (the Router will detect RESEARCH_AND_BUILD and delegate to AutonomyCore)
6. On completion -> append status message

Media path unchanged: Media uploads -> pipeline directly.

### [MODIFY] `src/hooks/useLayoutBuilder.ts` (+40 lines)

- Add `sendChatMessage()` function that POSTs to `/api/layout/chat`.
- Add `isChatting` state.
- Add to `UseLayoutBuilderReturn` interface.

---

## Step 5: Self-Correction Loop

### [MODIFY] `src/agents/AutonomyCore.ts` (~60 lines added, total ~100)

Add retry loop to `solveUnknown()`:

```
attempt = 0
while attempt < MAX_RETRIES:
  swarm = AgentSwarmFactory.fabricateSwarm(goal)
  result = DynamicWorkflowEngine.runSwarm(swarm)
  if result.success:
    return result
  // Self-correction: analyze failure, adjust strategy
  goal.context += `Previous attempt failed: ${result.error}. Adjust approach.`
  goal.technical_constraints.push(result.error)
  attempt++
```

### [MODIFY] `src/services/DynamicWorkflowEngine.ts` (~40 lines added, total ~160)

Add per-step error handling:

- If a CODER agent fails, capture the error
- Return structured failure result with error details
- The AutonomyCore retry loop uses this to refine the next attempt

---

## Step 6: Better Autonomy Output in TitanPipelineService

### [MODIFY] `src/services/TitanPipelineService.ts` (~15 lines changed)

Current RESEARCH_AND_BUILD handler flattens everything into a single `App.tsx`. Improve to:

- Parse autonomy output for multiple file hints
- If output contains `// === /src/filename.tsx ===` markers, split into multiple `AppFile`s
- Add autonomy step timings to the result

---

## Implementation Order

1. **Types** (`titanPipeline.ts`) -- Foundation, zero risk
2. **OmniChatService** -- New file, zero risk
3. **Chat API route** -- New file, zero risk
4. **useLayoutBuilder hook** -- Add `sendChatMessage` (additive)
5. **OmniChat component** -- New file
6. **LayoutBuilderView** -- Wire OmniChat, replace chat panel
7. **AutonomyCore** -- Add self-correction loop
8. **DynamicWorkflowEngine** -- Add error handling
9. **TitanPipelineService** -- Better output parsing

---

## What Stays Unchanged

- `AgentSwarmFactory.ts` -- Already fully functional
- `GoogleSearchService.ts` -- Already fully functional
- `/api/layout/pipeline/route.ts` -- Pipeline API untouched
- LayoutCanvas / Sandpack preview -- Untouched
- FloatingEditBubble / `refineComponent` -- Untouched
- Undo/redo system -- Untouched
- All types in `src/types/` -- Only additive changes

---

## File Summary

| File | Action | Est. Lines |
|------|--------|------------|
| `src/types/titanPipeline.ts` | MODIFY -- add OmniChat types | +35 |
| `src/services/OmniChatService.ts` | NEW | ~200 |
| `src/app/api/layout/chat/route.ts` | NEW | ~50 |
| `src/hooks/useLayoutBuilder.ts` | MODIFY -- add sendChatMessage | +40 |
| `src/components/interface/OmniChat.tsx` | NEW | ~350 |
| `src/components/LayoutBuilderView.tsx` | MODIFY -- replace chat panel, new message flow | ~80 changed |
| `src/agents/AutonomyCore.ts` | MODIFY -- self-correction loop | +60 |
| `src/services/DynamicWorkflowEngine.ts` | MODIFY -- error handling | +40 |
| `src/services/TitanPipelineService.ts` | MODIFY -- better autonomy output | ~15 changed |

**3 new files, 6 modified files. ~850 lines total.**

---

## Verification

1. `npm run typecheck` -- Must pass
2. `npm run dev` -- Start server, navigate to `/app/design`
3. **Chat test:** "What can you help me build?" -> Real AI response, no pipeline
4. **Pipeline test:** "Create a hero section with gradient" -> AI reply + pipeline generates code
5. **Live-edit test:** "Make the header blue" -> Quick edit, no full pipeline
6. **Autonomy test:** "Create an L-System fractal generator" -> AI detects unknown -> Router selects RESEARCH_AND_BUILD -> AutonomyCore fabricates agents -> researches -> generates code
7. **Self-correction test:** If autonomy fails on first try, verify retry loop fires and adjusts strategy
8. **Media test:** Upload an image -> Pipeline runs as before
9. **Context test:** Follow-up question about previous response -> AI remembers conversation
