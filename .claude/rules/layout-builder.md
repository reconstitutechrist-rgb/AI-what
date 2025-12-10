---
paths:
  - src/components/layout-builder/**
  - src/components/LayoutBuilderWizard.tsx
  - src/hooks/useLayoutBuilder.ts
  - src/types/layoutDesign.ts
  - src/stores/useLayoutPanelStore.ts
---

# Layout Builder Domain

## Component Architecture

**Main Component:** `LayoutBuilderWizard.tsx`

- Visual design mode with AI vision capabilities
- Claude can "see" layouts via screenshot capture
- Manages design tokens, animations, dark mode

**Sub-components in `layout-builder/`:**

- `ChatInput.tsx` - Message input with image upload
- `DesignSidePanel.tsx` - Tabbed panel (Design, Animation, Specs)
- `MediaUploadZone.tsx` - Image/video upload handling
- `ToolsMenu.tsx` - Export, design tools dropdown
- `TemplatesMenu.tsx` - Template selection dropdown

## useLayoutBuilder Hook

**Location:** `src/hooks/useLayoutBuilder.ts`

**Key State:**

```typescript
{
  layoutDesign: LayoutDesign      // Current design config
  messages: Message[]              // Chat history with AI
  isGenerating: boolean            // AI response in progress
  selectedElement: string | null   // Currently selected element
}
```

**Key Methods:**

- `sendMessage(content, images?)` - Send to AI with optional screenshots
- `updateLayoutDesign(updates)` - Partial design updates
- `exportLayout(format)` - Export to CSS/Tailwind/Figma
- `applyTemplate(template)` - Apply design template

## LayoutDesign Type Structure

**Location:** `src/types/layoutDesign.ts` (41KB - largest type file)

```typescript
interface LayoutDesign {
  header: HeaderDesign;
  sidebar: SidebarDesign;
  hero: HeroDesign;
  navigation: NavigationDesign;
  cards: CardDesign;
  lists: ListDesign;
  footer: FooterDesign;
  colors: ColorSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  animations: DetectedAnimation[];
  effects: EffectsSettings;
  responsiveBreakpoints: Breakpoint[];
  darkMode: DarkModeSettings;
}
```

## Panel State Management

**Store:** `src/stores/useLayoutPanelStore.ts`

Manages visibility of all layout builder panels:

- Design side panel (tabs: Design, Animation, Specs)
- Modal panels (Dark Mode Editor, Breakpoint Editor, etc.)
- Toolbar state

## Design Token Patterns

**Color tokens:**

```typescript
colors: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    (primary, secondary, muted);
  }
}
```

**Typography tokens:**

```typescript
typography: {
  fontFamily: { heading, body, mono }
  fontSize: { xs, sm, base, lg, xl, 2xl, 3xl }
  fontWeight: { normal, medium, semibold, bold }
  lineHeight: { tight, normal, relaxed }
}
```

## Export Formats

Supported via `src/utils/layoutExport.ts`:

- CSS Variables
- Tailwind Config
- Figma Tokens (JSON)
- React Theme Object
- Design Spec Sheet (PDF-ready)

## Critical Dependencies

- `useLayoutBuilder` ← `LayoutBuilderWizard` depends on this
- `layoutDesign.ts` types ← Used by all layout components
- `useLayoutPanelStore` ← Controls panel visibility
- Screenshot capture ← Claude needs this to "see" designs
