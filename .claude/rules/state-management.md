---
paths:
  - src/store/**
  - src/hooks/**
  - src/contexts/**
---

# State Management Domain

## Zustand Store Architecture

### Main Store: useAppStore

**Location:** `src/store/useAppStore.ts`

Central store with persist + Immer middleware and 8 slices:

```typescript
// Store creation with middleware
const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Slices combined here
      })),
      { name: 'app-store' }
    )
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

2. **ModeSlice** - Builder mode (legacy field)

```typescript
{
  builderMode: 'plan' | 'act'
  setBuilderMode(mode): void
}
```

> **Note:** The PLAN/ACT mode switching field still exists in the store for backward compatibility, but it is not actively used by the current OmniChat architecture. The OmniChat system handles its own conversational flow without switching between plan and act modes.

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

## Additional Stores

### useChatStore

**Location:** `src/store/useChatStore.ts`

Manages OmniChat message history and conversational state, separate from the main app store:

```typescript
{
  messages: ChatMessage[]
  isStreaming: boolean
  addMessage(msg): void
  clearMessages(): void
  // ... OmniChat-specific state
}
```

### useProjectStore

**Location:** `src/store/useProjectStore.ts`

Manages the project list for save/load/switch functionality:

```typescript
{
  projects: Project[]
  activeProjectId: string | null
  setActiveProject(id): void
  addProject(project): void
  // ... project management state
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

### Current Hooks (8 files in src/hooks/)

| Hook                  | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `useLayoutBuilder`    | Main pipeline orchestration and layout state |
| `useProjectManager`   | Project save/load/switch management        |
| `useElementInspector` | Element inspection in layout canvas        |
| `useSettings`         | User settings access                       |
| `useStateInspector`   | State debugging and inspection             |
| `useTheme`            | Theme management                           |
| `useToast`            | Toast notification system                  |

## Critical Dependencies

- `useAppStore` - Central state, many components depend on it
- `useChatStore` - OmniChat messages, used by OmniChat component
- `useProjectStore` - Project list, used by project manager
- Zustand shallow - Always use for selectors
- Immer middleware - Enables mutable-style updates
- Persist middleware - Persists store state to localStorage
- Context providers - Must wrap app in layout.tsx
