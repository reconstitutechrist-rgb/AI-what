---
paths:
  - src/components/AIBuilder.tsx
  - src/services/DynamicPhaseGenerator.ts
  - src/services/PhaseExecutionManager.ts
  - src/types/dynamicPhases.ts
  - src/hooks/useDynamicBuildPhases.ts
---

# AI Builder Core Domain

## Main Orchestrator

**Component:** `AIBuilder.tsx` (~1570 lines)

Central component managing:

- PLAN vs ACT mode switching
- Phase execution control
- Component preview and editing
- Version history and rollback
- Modal coordination

## Dual-Mode System

### PLAN Mode

- User planning phase
- NaturalConversationWizard active
- Building AppConcept
- No code generation yet

### ACT Mode

- Building phase
- Phase execution in progress
- Code being generated
- Preview panel active

**Mode state in useAppStore:**

```typescript
{
  builderMode: 'plan' | 'act'
  setBuilderMode(mode): void
}
```

## Phase Generation

### DynamicPhaseGenerator Service

**Location:** `src/services/DynamicPhaseGenerator.ts`

Analyzes AppConcept and generates optimal phase plan:

```typescript
static async generatePhases(
  appConcept: AppConcept,
  options?: GenerationOptions
): Promise<DynamicPhasePlan>
```

**Output:**

```typescript
interface DynamicPhasePlan {
  totalPhases: number; // 2-25+ based on complexity
  estimatedLines: number;
  phases: DynamicPhase[];
  dependencies: PhaseDependency[];
  contextStrategy: 'sliding_window' | 'accumulation';
}
```

### Phase Structure

```typescript
interface DynamicPhase {
  id: string;
  name: string;
  description: string;
  category: PhaseCategory;
  dependencies: string[]; // Phase IDs this depends on
  estimatedTokens: number;
  priority: number;
  files: string[]; // Files to create/modify
}
```

## Phase Execution

### PhaseExecutionManager Service

**Location:** `src/services/PhaseExecutionManager.ts` (~50KB)

Orchestrates code generation for each phase:

```typescript
static async executePhase(
  phase: DynamicPhase,
  context: ExecutionContext
): Promise<PhaseResult>
```

**Key responsibilities:**

- Context extraction for current phase
- AI prompt construction
- Code generation via API
- Result validation
- Error recovery

### useDynamicBuildPhases Hook

**Location:** `src/hooks/useDynamicBuildPhases.ts`

React hook wrapping phase execution:

```typescript
{
  currentPhase: DynamicPhase | null
  completedPhases: string[]
  executeNextPhase(): Promise<void>
  retryPhase(phaseId): Promise<void>
  pauseExecution(): void
  resumeExecution(): void
}
```

## Code Generation Flow

```
AppConcept
    ↓
DynamicPhaseGenerator.generatePhases()
    ↓
DynamicPhasePlan (phases + dependencies)
    ↓
For each phase:
    ↓
    PhaseExecutionManager.executePhase()
        ↓
        Context extraction (relevant code only)
        ↓
        API call to /api/ai-builder/full-app-stream
        ↓
        SSE streaming response
        ↓
        Code validation (codeValidator.ts)
        ↓
        AST modification if needed (astModifier.ts)
    ↓
    Update version history
    ↓
    Next phase
```

## Context Strategy

Two strategies based on app complexity:

### Sliding Window

- For complex apps (10+ phases)
- Only includes recent context
- Prevents token overflow

### Accumulation

- For simpler apps (<10 phases)
- Includes all previous code
- Better coherence

## Critical Dependencies

- `AIBuilder.tsx` ← All modes flow through here
- `DynamicPhaseGenerator` ← Determines build strategy
- `PhaseExecutionManager` ← Code generation engine
- `useDynamicBuildPhases` ← React integration
- `dynamicPhases.ts` types ← Contract between services

## Error Handling

- Phase failures trigger retry with modified context
- AutoFixEngine attempts automatic fixes
- User can manually intervene via chat
- Rollback available via version history
