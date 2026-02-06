# Refactoring Plan: Large File Decomposition

## Overview
Split large files into smaller, focused modules while maintaining 100% backward compatibility via barrel exports. No existing import paths change.

---

## Priority Order (Risk/Reward Optimized)

| Phase | File | Lines | Dependents | Risk | Value |
|-------|------|-------|------------|------|-------|
| 1 | `types/layoutDesign.ts` | 2,960 | 16 | LOW | HIGH |
| 2 | `utils/layoutValidation.ts` | 1,094 | ~3 | LOW | HIGH |
| 3 | `services/GeminiLayoutService.ts` | 1,378 | ~5 | MEDIUM | HIGH |
| 4 | `services/TitanPipelineService.ts` | 739 | 2 | MEDIUM | MEDIUM |
| 5 | `layout-builder/GenericComponentRenderer.tsx` | 942 | 1 | MEDIUM | MEDIUM |

### Deferred (too risky, well-organized already):
- `useAppStore.ts` (915 lines, 11 dependents) - Central Zustand store
- `useLayoutBuilder.ts` (845 lines) - Core orchestrator hook

---

## Phase 1: `layoutDesign.ts` Type Splitting

**Goal:** Split 2,960-line type file into logical modules along existing section comment boundaries.

> [!IMPORTANT]
> **Critical dependency found:** `CustomizableValue<T>` (line 1445) is used by component types starting at line 18. It MUST go in a foundational `common.ts` module that other modules import from.

### Confirmed consumers (16 files):
- Most import only `DetectedComponentEnhanced` (9 files)
- Some import `VisualEffect`, `LayoutDesign`, `EffectsSettings`, `ColorSettings`
- All use `@/types/layoutDesign` path — barrel re-export preserves this

### New Structure:

```
src/types/layoutDesign/
├── index.ts                  # Barrel: re-exports everything from all modules
├── common.ts                 # FOUNDATIONAL — CustomizableValue<T>, getCustomizableValue(),
│                             #   getPresetKey(), VisualAnalysis alias (lines 8-10, 1437-1477)
├── components.ts             # HeaderDesign → BreadcrumbDesign (lines 16-1412)
│                             #   imports: CustomizableValue from ./common
├── globalStyles.ts           # TypographySettings, ColorSettings, SpacingSettings,
│                             #   EffectsSettings, GlobalStyles (lines 114-471)
│                             #   imports: CustomizableValue from ./common
│                             #   imports: AdvancedEffectsConfig, AnyBackgroundEffectConfig from ./advancedEffects, ./backgroundEffects
├── advancedEffects.ts        # AdvancedEffectsConfig, MeshGradient, Glassmorphism,
│                             #   Neumorphism, GradientBorder, TextEffect, CustomShadow (lines 185-249)
├── backgroundEffects.ts      # BackgroundEffectType, all background configs,
│                             #   AnyBackgroundEffectConfig union (lines 251-361)
├── interactions.ts           # ComponentState types, MicroInteraction types,
│                             #   ElementInteractions, AnimationRef, CustomAnimation (lines 362-463)
├── structure.ts              # LayoutStructure, ResponsiveSettings, LayoutNode, GridConfig,
│                             #   LayoutComponentType, ElementType, ElementBounds,
│                             #   DesignVersion, SelectedElementInfo, LayoutAlignment,
│                             #   ResponsiveOverrides<T>, ResponsiveComponent<T>,
│                             #   CustomBreakpoints, BreakpointVisibility,
│                             #   ExtendedLayoutComponents, ExtendedResponsiveSettings,
│                             #   ExtendedLayoutDesign (lines 472-1555)
│                             #   imports: DetectedComponentEnhanced, component designs, etc.
├── detectedComponent.ts      # VisualEffect, DetectedComponentEnhanced (lines 590-827)
│                             #   Most-imported type — 9 files depend on this
├── multiPage.ts              # ReferenceMedia, PageRole, PageAnalysis, PageReference,
│                             #   NavigationItem, DetectedNavigation, InferredRoute,
│                             #   VideoPageTransition, MultiPageDesign,
│                             #   MultiPageAnalysisResult (lines 498-966)
├── conversation.ts           # ConversationContext, DesignContext (lines 968-996)
├── messages.ts               # MessageErrorType, MessageError, LayoutMessage (lines 998-1025)
├── layoutDesignType.ts       # Main LayoutDesign interface (lines 1027-1081)
│                             #   imports: types from globalStyles, components, structure, multiPage, conversation
├── apiTypes.ts               # LayoutWorkflowState, DeviceView, LayoutChatRequest,
│                             #   LayoutChatResponse, DesignChange, SuggestedAction,
│                             #   EnhancedLayoutChatRequest, QuickAnalysis, DeepAnalysis,
│                             #   AnalysisMode, SpecSheetExport (lines 1556-1647, 2602-2647)
├── analysis.ts               # ColorSwatch, GradientDefinition, OverlaySpec, FontSpec,
│                             #   TypeScale, ResponsiveValue, ShadowSpec, RadiusSpec,
│                             #   HoverAnimation, ScrollAnimation, EntranceAnimation,
│                             #   TransitionSpec, MicroInteraction (the analysis one),
│                             #   PageTransition, ButtonSpec, InputSpec, CardSpec,
│                             #   HeaderSpec, NavSpec, HeroSpec, FooterSpec, ModalSpec,
│                             #   DropdownSpec, TableSpec, ListSpec, LayoutRegion,
│                             #   BreakpointConfig, CompleteDesignAnalysis (lines 1832-2351)
├── animations.ts             # AnimationSequence, AnimationStep, ParallaxConfig,
│                             #   ScrollAnimationConfig (lines 2353-2435)
├── video.ts                  # ExtractedFrame, DetectedAnimation, DetectedTransition,
│                             #   FrameSummary, VideoAnalysisResult (lines 2437-2557)
├── progress.ts               # AnalysisPhaseStatus, AnalysisSubPhase, AnalysisPhase,
│                             #   AnalysisProgress (lines 2559-2600)
├── aiEnhancements.ts         # IssueSeverity, DesignIssue, ScoreBreakdown, ProactiveAnalysis,
│                             #   AnalysisDepth, DesignAnalysisArea, PrincipleScore,
│                             #   DesignCritique, DesignVariant, DesignVariants,
│                             #   WorkflowStep, WorkflowTemplate, WorkflowState,
│                             #   TokenDefinition, ComponentSpec, GeneratedDesignSystem,
│                             #   CompetitorAnalysis (lines 2648-2905)
└── defaults.ts               # defaultGlobalStyles, defaultStructure, defaultResponsive,
                              #   defaultLayoutDesign, emptyLayoutDesign, createLayoutDesign,
                              #   updateLayoutDesign, defaultAnalysisPhases (lines 1652-2960)
                              #   imports: NEUTRAL_PALETTE from @/constants/themeDefaults

src/types/layoutDesign.ts     # BECOMES: `export * from './layoutDesign/index';`
```

### Extraction order (respects internal dependencies):

1. `common.ts` — no internal deps
2. `advancedEffects.ts` — no internal deps
3. `backgroundEffects.ts` — no internal deps
4. `interactions.ts` — no internal deps
5. `components.ts` — depends on common
6. `globalStyles.ts` — depends on common, advancedEffects, backgroundEffects
7. `detectedComponent.ts` — depends on interactions
8. `multiPage.ts` — depends on detectedComponent
9. `conversation.ts` — no internal deps
10. `messages.ts` — no internal deps
11. `layoutDesignType.ts` — depends on globalStyles, components, structure, multiPage, conversation
12. `structure.ts` — depends on detectedComponent, components, common
13. `analysis.ts` — depends on common
14. `animations.ts` — no internal deps
15. `video.ts` — depends on analysis, animations
16. `progress.ts` — no internal deps
17. `apiTypes.ts` — depends on messages, layoutDesignType, multiPage, analysis, video
18. `aiEnhancements.ts` — depends on layoutDesignType
19. `defaults.ts` — depends on many modules + NEUTRAL_PALETTE
20. `index.ts` — barrel re-exports all

**Verification:** `npm run typecheck` after each file extraction

---

## Phase 2: `layoutValidation.ts` Splitting

**Goal:** Split 1,094-line validation utilities into focused modules.

### Confirmed structure (from reading file):
- **Lines 1-29:** Constants (`DEFAULT_BOUNDS`)
- **Lines 30-90:** Helper functions (`toPercentage`, `toPercentageWithMin`)
- **Lines 70-~400:** Zod schemas (`BoundsSchema`, `StyleSchema`, `ComponentSchema`)
- **Lines ~400-~700:** Sanitization functions (`sanitizeComponents`, etc.)
- **Lines ~700-~900:** Inference functions (`inferContainerLayouts`, etc.)
- **Lines ~900-~1094:** Overlap resolution (`resolveRootOverlaps`)

### New Structure:

```
src/utils/layoutValidation/
├── index.ts                  # Barrel export — re-exports all public functions/constants
├── constants.ts              # DEFAULT_BOUNDS, any other constants
├── helpers.ts                # toPercentage, toPercentageWithMin, validateFontSizeForContainer
├── schemas.ts                # All Zod schemas (BoundsSchema, StyleSchema, ComponentSchema)
│                             #   imports: helpers, constants
├── sanitization.ts           # sanitizeComponents, sanitizeBounds
│                             #   imports: schemas, constants
├── inference.ts              # inferContainerLayouts, inferLayoutFromChildren
│                             #   imports: DetectedComponentEnhanced from @/types/layoutDesign
└── overlaps.ts               # resolveRootOverlaps, detectOverlaps
                              #   imports: DetectedComponentEnhanced from @/types/layoutDesign

src/utils/layoutValidation.ts # BECOMES: `export * from './layoutValidation/index';`
```

**Verification:** `npm run typecheck` + `npm test`

---

## Phase 3: `GeminiLayoutService.ts` Decomposition

**Goal:** Split 1,378-line monolithic service into stage-based modules.

### Confirmed stages (from reading file):
- **Lines 1-80:** Imports, config, `LayoutCritique` interface, `validateTypographyScaling` helper
- **Lines 81-97:** Class constructor + `initialize()`
- **Lines 100-300:** Stage 1 `extractDesignSpec()` — "The Architect"
- **Lines 306-~600:** Stage 2 `buildComponentsFromSpec()` — "The Engineer"
- **Remaining:** `critiqueLayout()`, `analyzeVideoFlow()`, `editComponent()`, etc.

### New Structure:

```
src/services/geminiLayout/
├── index.ts                  # Barrel export + getGeminiLayoutService() singleton
├── GeminiLayoutService.ts    # Thin orchestrator class — delegates to modules
│                             #   constructor, initialize(), public method stubs
├── config.ts                 # MODEL_FLASH const, LayoutCritique interface
├── helpers.ts                # validateTypographyScaling, normalizeCoordinates, fileToPart
├── extractDesignSpec.ts      # Stage 1: "The Architect" — extractDesignSpec()
├── buildComponents.ts        # Stage 2: "The Engineer" — buildComponentsFromSpec()
├── critique.ts               # critiqueLayout, critiqueLayoutEnhanced
├── videoAnalysis.ts          # analyzeVideoFlow
└── editComponent.ts          # editComponent for live editing

src/services/GeminiLayoutService.ts  # BECOMES: re-export from ./geminiLayout/index
```

**Pattern:** Each module exports functions that accept `GoogleGenerativeAI` client as param.
The orchestrator class delegates to these functions, preserving the singleton pattern.

**Consumers (5 files):** `VisionLoopEngine`, `LayoutAutoFixEngine`, API routes — all import via `getGeminiLayoutService()`.

**Verification:** `npm run typecheck` + test layout generation end-to-end

---

## Phase 4: `TitanPipelineService.ts` Modularization

**Goal:** Split 739-line pipeline into step modules.

### Confirmed structure (from reading file):
- **Lines 1-35:** Imports
- **Lines 36-84:** Config constants, helpers (`getGeminiApiKey`, `getAnthropicApiKey`, `uploadFileToGemini`)
- **Lines 86-~130:** ROUTER step (with `ROUTER_PROMPT`)
- **Remaining:** Surveyor, Architect, Physicist, Builder, LiveEditor steps

### New Structure:

```
src/services/titanPipeline/
├── index.ts                  # Barrel export + getTitanPipelineService() singleton
├── TitanPipelineService.ts   # Main orchestrator — runPipeline(), imports steps
├── config.ts                 # Model constants, API key getters, CODE_ONLY_SYSTEM_INSTRUCTION
├── helpers.ts                # uploadFileToGemini, extractCode import
├── router.ts                 # ROUTER_PROMPT + routeIntent()
├── surveyor.ts               # surveyLayout() — vision analysis via Gemini
├── architect.ts              # buildStructure() — structure via Claude
├── physicist.ts              # extractPhysics() — animation math
├── builder.ts                # assembleCode() — code synthesis
└── liveEditor.ts             # liveEdit() — quick refinement

src/services/TitanPipelineService.ts  # BECOMES: re-export from ./titanPipeline/index
```

**Consumers (2 files):** `useLayoutBuilder.ts`, `/api/layout/pipeline/route.ts`

**Verification:** `npm run typecheck` + test full pipeline: prompt → code generation → preview

---

## Phase 5: `GenericComponentRenderer.tsx` Splitting

**Goal:** Split 942-line component into focused utilities and sub-renderers.

### Confirmed structure (from reading file):
- **Lines 1-57:** Imports, props interface, constants (`MAX_DEPTH`, `DEFAULT_BOUNDS`), `ensureUnit()` helper
- **Lines 58-100:** Main component setup (destructuring, position strategy, z-index logic)
- **Remaining:** Large JSX rendering with style computation, recursive children, effects

### New Structure:

```
src/components/layout-builder/renderers/
├── index.ts                  # Re-exports GenericComponentRenderer
├── GenericComponentRenderer.tsx  # Main component — slimmed down, imports helpers
├── styleBuilder.ts           # buildComponentStyles() — extracts all CSS computation
│                             #   ensureUnit(), getDefaultZIndex(), position strategy
├── types.ts                  # GenericComponentRendererProps, shared constants (MAX_DEPTH, DEFAULT_BOUNDS)
├── ChildRenderer.tsx         # Recursive children rendering logic
└── ContentRenderer.tsx       # Text/image/icon content rendering

src/components/layout-builder/GenericComponentRenderer.tsx  # BECOMES: re-export
```

**Consumer (1 file):** `DynamicLayoutRenderer.tsx`

**Verification:** `npm run typecheck` + visual test in browser

---

## Implementation Strategy

### For Each Phase:
1. Create new directory
2. Create `index.ts` barrel with all re-exports
3. Extract one module at a time, starting with modules that have no internal deps
4. Run `npm run typecheck` after each file extraction
5. Original file becomes a simple re-export: `export * from './moduleName/index';`
6. Commit after each complete phase

### Backward Compatibility:

```typescript
// Original file (e.g., src/types/layoutDesign.ts)
// AFTER refactor — just re-exports, all existing imports work unchanged
export * from './layoutDesign/index';
```

### Import path for new code:

New code can import from specific submodules for clarity:

```typescript
import type { DetectedComponentEnhanced } from '@/types/layoutDesign/detectedComponent';
```

But the old path continues to work:

```typescript
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
```

---

## Testing Checklist

After each phase:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] Manual test: layout generation and preview works

---

## Post-Completion Updates

- [ ] `MASTER_CONTEXT_VERIFIED.md` — Update file counts and directory structure
- [ ] `CLAUDE.md` — Update directory structure section if significantly changed

---

## Critical Files

| File | Phase | Details |
|------|-------|---------|
| `layoutDesign.ts` | Phase 1 | 2,960 lines, 16 dependents |
| `layoutValidation.ts` | Phase 2 | 1,094 lines |
| `GeminiLayoutService.ts` | Phase 3 | 1,378 lines, 5 dependents |
| `TitanPipelineService.ts` | Phase 4 | 739 lines, 2 dependents |
| `GenericComponentRenderer.tsx` | Phase 5 | 942 lines |
| `themeDefaults.ts` | — | Imported by `defaults.ts` (`NEUTRAL_PALETTE`) |
| `MASTER_CONTEXT_VERIFIED.md` | — | Update after completion |
