---
paths:
  - src/components/conversation-wizard/**
  - src/components/NaturalConversationWizard.tsx
  - src/hooks/usePhaseGeneration.ts
  - src/hooks/useDraftPersistence.ts
  - src/types/appConcept.ts
---

# Conversation Wizard Domain

## Component Architecture

**Main Component:** `NaturalConversationWizard.tsx` (~600 lines after refactor)

- 6-step guided app creation via natural conversation
- Auto-saves draft at each step
- Generates AppConcept object for phase generation

**Sub-components in `conversation-wizard/`:**

- `ChatInputArea.tsx` - Text input with file upload
- `MessageBubble.tsx` - Chat message with markdown rendering
- `SuggestedActionsBar.tsx` - Quick action buttons
- `ConceptSummaryPanel.tsx` - Side panel showing current concept
- `RecoveryPromptDialog.tsx` - Draft recovery modal
- `WizardHeader.tsx` - Header with layout import option
- `PendingImagesPreview.tsx` - Image upload preview

## Key Hooks

### useDraftPersistence

**Location:** `src/hooks/useDraftPersistence.ts`

Handles auto-save/recovery of conversation state:

```typescript
{
  savedDraft: Draft | null
  saveDraft(state): void
  clearDraft(): void
  hasDraft: boolean
}
```

### usePhaseGeneration

**Location:** `src/hooks/usePhaseGeneration.ts`

Handles phase generation and context building:

```typescript
{
  phasePlan: DynamicPhasePlan | null
  isGenerating: boolean
  generatePhases(appConcept): Promise<void>
  buildContext(phase): string
}
```

## AppConcept Type Structure

**Location:** `src/types/appConcept.ts`

```typescript
interface AppConcept {
  name: string;
  description: string;
  purpose: string;
  targetUsers: string;
  coreFeatures: Feature[];
  uiPreferences: UIPreferences;
  technical: TechnicalRequirements;
  roles?: UserRole[];
  workflows?: Workflow[];
  layoutDesign?: LayoutDesign; // Optional, from Layout Builder
  conversationContext?: string; // Full conversation history
  createdAt: string;
  updatedAt: string;
}

interface Feature {
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have';
  complexity: 'simple' | 'moderate' | 'complex';
}
```

## Wizard Flow

1. **Welcome** - Initial greeting, explain process
2. **App Idea** - User describes their app concept
3. **Features** - AI extracts and confirms features
4. **UI Preferences** - Style, colors, layout preferences
5. **Technical** - Tech requirements, integrations
6. **Summary** - Review AppConcept, start building

## State Management

Wizard state stored in `useAppStore`:

```typescript
{
  wizardStep: number
  appConcept: Partial<AppConcept>
  wizardMessages: Message[]
  isWizardComplete: boolean
}
```

## Integration Points

- **Layout Builder** → Can import `layoutDesign` into AppConcept
- **DynamicPhaseGenerator** → Receives completed AppConcept
- **AIBuilder** → Receives phase plan for execution

## Critical Dependencies

- `useDraftPersistence` ← Prevents lost work on refresh
- `usePhaseGeneration` ← Bridges wizard to builder
- `appConcept.ts` types ← Contract with phase generator
