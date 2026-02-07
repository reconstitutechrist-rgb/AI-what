# Titan Pipeline - Deep Bug Analysis

> **Date:** February 6, 2026
> **Scope:** Full pipeline analysis — TitanPipelineService, Builder, Router, Architect, OmniChat, WebContainer, VisualCritic, SkillLibrary, CodeRepair, DynamicWorkflowEngine, LayoutBuilderView, stores
> **Findings:** 27 bugs/issues across 15+ files

## Executive Summary

A thorough analysis of the entire Titan Pipeline revealed **27 distinct bugs/issues** across 15+ files. The issues range from critical architectural flaws that silently break core functionality to minor inconsistencies. Below are all findings, prioritized by severity.

---

## P0 - Critical (Breaks Core Functionality)

### 1. Builder ignores Architect output AND existing code
**Files:** `src/services/titanPipeline/builder.ts:530-538`
**Bug:** `assembleCode()` accepts `structure` and `currentCode` as parameters but prefixes both with `_` (underscore convention meaning "unused"):
```typescript
export async function assembleCode(
  _structure: ComponentStructure | null,  // IGNORED
  manifests: VisualManifest[],
  physics: MotionPhysics | null,
  strategy: MergeStrategy,
  _currentCode: string | null,           // IGNORED
  instructions: string,
  ...
)
```
**Impact:**
- The Architect step (uses Claude Opus, costs money) produces a `ComponentStructure` that is thrown away entirely
- EDIT mode cannot work because the Builder never sees existing code
- Every generation is effectively a CREATE regardless of what the Router decides
- The entire Architect-to-Builder handoff is broken

### 2. Stale closure sends conversation history missing the current user message
**Files:** `src/components/LayoutBuilderView.tsx:195-197`
**Bug:** `handleSendMessage` captures `messages` from `useChatStore` in its closure. The user's message is added to the store via `addMessage` (line 179) BEFORE building `conversationHistory` (line 195), but the `messages` variable still holds the previous render's snapshot (React/Zustand state updates don't mutate the current closure).
**Impact:** The AI always receives conversation history missing the current user message. It only sees up to the second-to-last message in the chat.

### 3. Visual critique evaluates pre-repair files
**Files:** `src/hooks/useLayoutBuilder.ts:636-642`
**Bug:**
```typescript
const validatedFiles = await validateAndRepair(result.files, instructions);
updateFilesWithHistory(validatedFiles);
// Run critique on ORIGINAL files, not repaired ones
runVisualCritique(result.files, instructions, cachedSkillId)
```
`runVisualCritique` receives `result.files` (pre-repair) instead of `validatedFiles` (post-repair).
**Impact:** Quality scores in the Skill Library reflect unrepaired code, poisoning the long-term learning system. Skills saved with low scores due to pre-repair bugs will be deprioritized even though the actual output was good.

### 4. DynamicWorkflowEngine singleton shares mutable state across concurrent requests
**Files:** `src/services/DynamicWorkflowEngine.ts:40-44, 542`
**Bug:** `dynamicWorkflowEngine` is a module-level singleton with mutable `this.context` (memory, global_files, logs). `runSwarm` resets context at start, but concurrent requests will race on shared state. One request's context overwrites another's.
**Impact:** In a long-running Node.js server with concurrent requests, agent swarm results will be corrupted. (Mitigated in serverless environments where each request gets its own worker.)

---

## P1 - High (Incorrect Behavior, Data Corruption)

### 5. `msg.content[0]` accessed without bounds check
**Files:** `src/services/OmniChatService.ts:215`
**Bug:** `const text = msg.content[0].type === 'text' ? msg.content[0].text : '';` -- if Anthropic returns an empty `content` array (content filtering, edge case), this throws `TypeError: Cannot read properties of undefined`.
**Impact:** Unhandled crash in the chat service.

### 6. Skill usage count inflated regardless of actual skill use
**Files:** `src/services/OmniChatService.ts:219-224`
**Bug:** Usage is incremented whenever the AI responds with any non-`none` action AND a skill was found, but the code doesn't check if the AI actually used `USE_CACHED_SKILL` in its response. The AI might have ignored the cached skill entirely.
**Impact:** Skill usage metrics are inflated, making unused skills appear more popular than they are.

### 7. Screenshot failure returns contradictory score
**Files:** `src/services/VisualCriticService.ts:189-196`
**Bug:** Screenshot failure returns `score: 0` with verdict `needs_improvement`. By the service's own threshold logic (`REGENERATE_THRESHOLD = 4`), score 0 should yield `regenerate`. But the early return bypasses `buildCritiqueResult`.
**Impact:** Screenshot failures are treated more leniently than pages scoring 1-3, potentially allowing broken output through.

### 8. WebContainer stale filesystem between validations
**Files:** `src/services/WebContainerService.ts:234-257`
**Bug:** `writeProjectFiles` writes to the container filesystem, but there's no cleanup between validation runs. Files from a previous validation remain in the container.
**Impact:** False positives (code passes validation because it imports a file from a previous run) or false negatives (old files with conflicting exports cause errors).

### 9. WebContainer race condition in concurrent validations
**Files:** `src/services/WebContainerService.ts:166-229`
**Bug:** `validate()` mutates shared state (`this._status`) and writes to the shared container filesystem with no locking. Concurrent validation calls will interleave filesystem writes, dependency installs, and status reads.
**Impact:** Two simultaneous validations will corrupt each other's results.

### 10. Quality score scale ambiguity (0-1 vs 0-10)
**Files:** `src/services/SkillLibraryService.ts:160, 229`
**Bug:** `updateQualityScore` normalizes 1-10 to 0-1 (divides by 10), but `saveSkill` stores `input.qualityScore ?? 0.5` directly without normalization. The type comment says "0-10, normalized to 0-1" which is ambiguous.
**Impact:** If a caller passes a 0-10 value to `saveSkill`, it's stored as-is (e.g., `7.0` instead of `0.7`), corrupting the quality metric.

### 11. `appContext` never sent to critique API
**Files:** `src/hooks/useLayoutBuilder.ts:350-355`
**Bug:** `runVisualCritique` sends `{ files, originalInstructions }` to `/api/layout/critique` but never includes `appContext`. The `VisualCriticService.evaluate` accepts and uses `appContext` for prompt construction, but it's always `undefined`.
**Impact:** Critique evaluations lack app-specific context (name, colors, style), making them less accurate.

---

## P2 - Medium (Defensive Issues, Performance)

### 12. Greedy JSON regex can match wrong JSON
**Files:** `src/services/OmniChatService.ts:139`
**Bug:** `text.match(/\{[\s\S]*\}/)` -- greedy `[\s\S]*` matches from first `{` to last `}`. If Claude outputs multiple JSON objects with text between them, the regex captures invalid JSON.

### 13. Anthropic client recreated on every chat call
**Files:** `src/services/OmniChatService.ts:185`
**Bug:** `new Anthropic({ apiKey })` is instantiated per `chat()` call. Connection pools aren't reused.

### 14. Gemini client recreated per call across multiple services
**Files:** `src/services/CodeRepairService.ts:108-114`, `src/services/VisualCriticService.ts:279`, `src/services/titanPipeline/builder.ts:541`
**Bug:** Same pattern -- `new GoogleGenerativeAI(apiKey)` on every method call. No connection pooling.

### 15. No max-attempt guard in CodeRepairService
**Files:** `src/services/CodeRepairService.ts:101-158`
**Bug:** The `repair` method accepts any `attempt` number from the request with no upper bound. An infinite repair loop is possible if the client has a bug.

### 16. Repair "success" not actually verified
**Files:** `src/services/CodeRepairService.ts:137-143`
**Bug:** Repair is declared successful if `repairedCode.length > 10 && repairedCode !== file.content`. It doesn't verify the repaired code actually fixes the original errors. The `fixes` array claims "Fixed N error(s)" without verification.

### 17. `originalInstructions` accepted but never used in repair
**Files:** `src/services/CodeRepairService.ts:102`
**Bug:** `originalInstructions` is destructured from the request but never passed to `buildRepairPrompt`. The repair AI has no context about the user's original intent.

### 18. `resumeSwarm` loses files and reasoning
**Files:** `src/services/DynamicWorkflowEngine.ts:258-262, 376-380`
**Bug:** `resumeSwarm` sets `global_files: {}`, losing all files from the original run. Also doesn't include `reasoning_summary` in the return, breaking Skill Library save.

### 19. Unbounded `context.memory` injected into prompts
**Files:** `src/services/DynamicWorkflowEngine.ts:416, 471`
**Bug:** `JSON.stringify(this.context.memory)` grows unbounded across agents and gets injected into every prompt. Could exceed context window.

### 20. Developer comment leaks into LLM prompt
**Files:** `src/services/DynamicWorkflowEngine.ts:436`
**Bug:** `${input.slice(0, 5000)} // Truncated for token limit` -- the `// Truncated for token limit` comment is inside the template literal, so the LLM literally sees it.

### 21. Dual chat message stores with different types
**Files:** `src/store/useAppStore.ts` vs `src/store/useChatStore.ts`
**Bug:** Both stores maintain independent chat message arrays with different interfaces. `LayoutBuilderView` uses `useChatStore`, but `useAppStore` has its own `chatMessages`. Unclear which is authoritative.

### 22. No React error boundary in LayoutBuilderView
**Files:** `src/components/LayoutBuilderView.tsx`
**Bug:** No `ErrorBoundary` wrapping `OmniChat` or `LayoutCanvas`. A render error in either crashes the entire view.

---

## P3 - Low (Documentation, Code Quality)

### 23. Environment variable documentation mismatch
**Files:** `CLAUDE.md` vs all Gemini services
**Bug:** CLAUDE.md documents `GOOGLE_AI_API_KEY=` but every service reads `GOOGLE_API_KEY || GEMINI_API_KEY`. A user following docs will have non-functioning Gemini services.

### 24. Dead `LiveEditResult.modifiedCode` field
**Files:** `src/types/titanPipeline.ts:261-266`
**Bug:** `modifiedCode` is defined on the type but never written to or read from anywhere. Only `updatedCode` is used.

### 25. `String.prototype.substr` deprecated
**Files:** `src/store/useChatStore.ts:52`
**Bug:** Uses deprecated `substr` instead of `substring` or `slice`.

### 26. Pipeline API route manually cherry-picks response fields
**Files:** `src/app/api/layout/pipeline/route.ts:68-77`
**Bug:** Manually selects fields from `PipelineResult` to return, omitting `critique` and `healingResult`. Any new field added to `PipelineResult` must also be manually added here.

### 27. Hardcoded React/TypeScript versions in WebContainerService diverge from curated-versions.ts
**Files:** `src/services/WebContainerService.ts:47-68`
**Bug:** React `'^19.0.0'`, TypeScript `'^5.6.0'`, esbuild `'^0.24.0'` are hardcoded instead of sourcing from `curated-versions.ts`. Risk of version drift.

---

## Recommended Fix Order

The highest-impact order for fixing these:

1. **P0-1: Builder ignoring structure/currentCode** -- This undermines the entire Architect step and EDIT mode
2. **P0-3: Critique on pre-repair files** -- This poisons the Skill Library quality data
3. **P0-2: Stale closure in conversation history** -- AI misses the current message every time
4. **P1-5: `msg.content[0]` crash** -- Quick one-line fix, prevents unhandled crash
5. **P1-7: Screenshot failure score** -- Quick fix, use `regenerate` not `needs_improvement` for score 0
6. **P1-11: appContext not sent to critique** -- Quick fix, add field to request body
7. **P1-8/9: WebContainer stale filesystem + race condition** -- Requires filesystem cleanup + queue/mutex
8. **P2-12: Greedy JSON regex** -- Change to balanced JSON parser or non-greedy match
9. **P2-17: originalInstructions unused in repair** -- Pass it to the prompt builder
10. **P3-23: Fix CLAUDE.md env var documentation** -- Quick doc fix

---

## Verification Plan

After fixes are applied:
1. `npm run typecheck` -- Ensure no type errors introduced
2. `npm run lint` -- Check for lint issues
3. `npm test` -- Run full test suite
4. Manual test: Send a chat message and verify conversation history includes the current message
5. Manual test: Run pipeline with EDIT intent, verify Builder receives existing code
6. Manual test: Trigger code repair, verify critique runs against repaired files
7. Manual test: Verify `appContext` appears in critique API request body
