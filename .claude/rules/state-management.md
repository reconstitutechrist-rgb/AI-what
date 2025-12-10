---
paths:
  - src/store/**
  - src/stores/**
  - src/hooks/**
  - src/contexts/**
---

# State Management Domain

## Zustand Store Architecture

### Main Store: useAppStore

**Location:** `src/store/useAppStore.ts` (~500 lines)

Central store with 8 slices using Immer middleware:

```typescript
// Store creation with middleware
const useAppStore = create<AppState>()(
  devtools(
    immer((set, get) => ({
      // Slices combined here
    }))
  )
);
```

### Slices

1. **ChatSlice** - Messages and generation state

```typescript
{
  messages: Message[]
  userInput: string
  isGenerating: boolean
  addMessage(msg): void
  clearMessages(): void
}
```

2. **ModeSlice** - PLAN vs ACT mode

```typescript
{
  builderMode: 'plan' | 'act'
  setBuilderMode(mode): void
}
```

3. **ComponentsSlice** - Generated components

```typescript
{
  components: GeneratedComponent[]
  selectedComponent: string | null
  addComponent(comp): void
  updateComponent(id, updates): void
}
```

4. **VersionControlSlice** - Undo/redo

```typescript
{
  undoStack: Snapshot[]
  redoStack: Snapshot[]
  canUndo: boolean
  canRedo: boolean
  pushSnapshot(): void
  undo(): void
  redo(): void
}
```

5. **UIStateSlice** - UI visibility

```typescript
{
  activeTab: string
  modalOpen: Record<string, boolean>
  panelSizes: number[]
}
```

6. **DataSlice** - Pending changes

```typescript
{
  pendingChanges: Change[]
  deploymentInstructions: string
}
```

7. **FileStorageSlice** - Cloud files

```typescript
{
  uploadedFiles: FileRecord[]
  isUploading: boolean
}
```

8. **CodeQualitySlice** - Reviews

```typescript
{
  reviewResults: ReviewResult | null;
  accessibilityReport: A11yReport | null;
}
```

## Selector Patterns

**IMPORTANT:** Always use shallow comparison for performance:

```typescript
// Good - uses shallow comparison
const messages = useAppStore((state) => state.messages, shallow);

// Good - selecting multiple values
const { messages, isGenerating } = useAppStore(
  (state) => ({
    messages: state.messages,
    isGenerating: state.isGenerating,
  }),
  shallow
);

// Bad - creates new object every render
const data = useAppStore((state) => ({
  messages: state.messages,
}));
```

## Secondary Store

### useLayoutPanelStore

**Location:** `src/stores/useLayoutPanelStore.ts`

Manages layout builder panel visibility:

```typescript
{
  designPanelOpen: boolean
  animationPanelOpen: boolean
  // ... panel states
  togglePanel(name): void
}
```

## React Context Providers

### AuthContext

**Location:** `src/contexts/AuthContext.tsx`

- Supabase session management
- Login/logout methods
- User object

### ThemeContext

**Location:** `src/contexts/ThemeContext.tsx`

- Dark/light mode
- Theme persistence
- System preference detection

### SettingsContext

**Location:** `src/contexts/SettingsContext.tsx`

- User preferences
- Editor settings
- Feature flags

## Hook Patterns

### Standard Structure

```typescript
interface UseFeatureOptions {
  // Configuration
}

interface UseFeatureReturn {
  // State
  data: Data;
  isLoading: boolean;
  error: Error | null;
  // Methods
  doAction(): Promise<void>;
}

export function useFeature(options?: UseFeatureOptions): UseFeatureReturn {
  // Implementation
}
```

### Common Hooks

| Hook                     | Purpose                 |
| ------------------------ | ----------------------- |
| `useLayoutBuilder`       | Layout design state     |
| `useChatSystem`          | Chat message management |
| `useDatabaseSync`        | Supabase sync           |
| `useVersionControl`      | Version history         |
| `useStreamingGeneration` | SSE handling            |
| `useSmartContext`        | Context compression     |

## Critical Dependencies

- `useAppStore` ← Central state, many components depend on it
- Zustand shallow ← Always use for selectors
- Immer middleware ← Enables mutable-style updates
- Context providers ← Must wrap app in layout.tsx
