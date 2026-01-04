# UX Restructure: Separate Pages with Guided Flow

## Overview

Restructure the AI App Builder from a single-page tab system to separate Next.js pages with a logical guided flow while maintaining all functionality and applying landing page styling.

## User Flow

**Guided Flow (New Users):**

```
Landing → Auth (Login/Signup) → Wizard → Design → Build → Builder
```

**Free Navigation (Experienced Users):**

- Can skip directly to Builder or any page
- Full navigation available at all times
- "Skip to Builder" option prominently available

## Current Problems

1. **Duplicate Navigation**: Header has "Layout" and "Wizard" buttons AND TabNavigation has the same as tabs
2. **Single Page Architecture**: All views conditionally rendered in one page based on `activeView` state
3. **Inconsistent Styling**: App pages don't match landing page design
4. **No Guided Flow**: New users don't have a clear path through the app

## Goals

- Create separate routes in logical order: `/app/wizard`, `/app/design`, `/app/build`, `/app` (builder)
- Implement guided flow with "Next Step" navigation
- Allow experienced users to skip/navigate freely
- Remove duplicate navigation buttons
- Apply landing page styling (dark theme, gradients, glassmorphism)
- Create slide-out menu for secondary actions (User, Project Docs, etc.)
- Move PLAN/ACT toggle into Builder chat panel
- Maintain all existing functionality

---

## Implementation Plan

### Phase 1: Create Page Structure

**New Routes:**

```
src/app/(protected)/app/
  layout.tsx         # NEW - Shared navigation + styling wrapper
  page.tsx           # MODIFY - Main Builder only
  wizard/
    page.tsx         # NEW - NaturalConversationWizard
  design/
    page.tsx         # NEW - LayoutBuilderWizard
  build/
    page.tsx         # NEW - PhasedBuildPanel
```

**Files to Create:**

- `src/app/(protected)/app/layout.tsx` - Shared app layout with navigation
- `src/app/(protected)/app/wizard/page.tsx`
- `src/app/(protected)/app/design/page.tsx`
- `src/app/(protected)/app/build/page.tsx`

### Phase 2: Create Unified Navigation Component

**Create:** `src/components/AppNavigation.tsx`

Replace both BuilderHeader + TabNavigation with a single unified navigation:

- Use Next.js `usePathname()` for active state detection
- Use `router.push()` for navigation instead of `setActiveView()`
- Match landing page styling:
  - `bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5`
  - Gradient accents on active items
  - Framer Motion hover animations

**Navigation Structure (reflects guided flow order):**

```
[Logo] [Project Name] | [Wizard] [Design] [Build] [Builder] | [Save] [Menu Icon →]
                         1→        2→       3→      4→ (final destination)
```

**Visual Progress Indicator:**

- Show step numbers or progress dots under nav items
- Highlight completed steps with checkmarks
- Active step highlighted with gradient

**"Skip to Builder" Option:**

- Prominent button/link for experienced users
- Available on every page: "Skip → Go directly to Builder"

The Menu Icon opens a slide-out side drawer.

### Phase 3: Create Slide-Out Side Drawer

**Create:** `src/components/SideDrawer.tsx`

A slide-out drawer from the right side containing:

- User profile/account
- Project Docs toggle
- Theme settings
- Help/Support links
- Any other displaced buttons from header cleanup

**Styling:**

```css
/* Overlay */
fixed inset-0 bg-black/50 backdrop-blur-sm z-50

/* Drawer Panel */
fixed right-0 top-0 h-full w-80
bg-[#0a0a0f]/95 backdrop-blur-xl
border-l border-white/10
transform transition-transform
```

**Animation:** Slide in from right with Framer Motion

### Phase 4: Extract MainBuilderView Component

**Create:** `src/components/MainBuilderView.tsx`

Extract lines ~1582-1700 from AIBuilder.tsx containing:

- ResizablePanelGroup
- ChatPanel (with PLAN/ACT toggle integrated)
- AppConceptPanel
- PreviewPanel

This component renders only the main builder view.

### Phase 5: Move PLAN/ACT Toggle into ChatPanel

**Modify:** `src/components/ChatPanel.tsx`

Add PLAN/ACT mode toggle to the chat panel header:

- Positioned prominently at top of chat panel
- Styled to match landing page buttons
- Toggle updates `builderMode` in Zustand store

```tsx
// In ChatPanel header area
<div className="flex items-center gap-2">
  <button className={mode === 'PLAN' ? 'active-gradient' : 'inactive'}>Plan</button>
  <button className={mode === 'ACT' ? 'active-gradient' : 'inactive'}>Act</button>
</div>
```

### Phase 6: Update Page Components with Guided Flow

Each page has:

- "Continue to Next Step" button (primary action)
- "Skip to Builder" link (for experienced users)
- Back navigation to previous step

**`/app/wizard/page.tsx` (Step 1):**

```tsx
<NaturalConversationWizard
  onComplete={() => router.push('/app/design')} // → Next: Design
  onSkip={() => router.push('/app')} // → Skip to Builder
  isFullPage={true}
/>
// Bottom: [Continue to Design →] [Skip to Builder]
```

**`/app/design/page.tsx` (Step 2):**

```tsx
<LayoutBuilderWizard
  isOpen={true}
  onComplete={() => router.push('/app/build')} // → Next: Build
  onBack={() => router.push('/app/wizard')} // ← Back to Wizard
  onSkip={() => router.push('/app')} // → Skip to Builder
  isFullPage={true}
/>
// Bottom: [← Back] [Continue to Build →] [Skip to Builder]
```

**`/app/build/page.tsx` (Step 3):**

```tsx
<PhasedBuildPanel
  isOpen={true}
  onComplete={() => router.push('/app')} // → Final: Builder
  onBack={() => router.push('/app/design')} // ← Back to Design
  isFullPage={true}
/>
// Bottom: [← Back] [Open in Builder →]
// Empty state: "Start with Wizard" button if no plan
```

**`/app/page.tsx` (Step 4 - Final Destination):**

```tsx
<MainBuilderView />
// This is the final builder - full editing capabilities
// Navigation shows all steps as "completed" for users who went through flow
```

### Phase 7: Remove Duplicate Navigation

**DELETE:** `src/components/TabNavigation.tsx` (replaced by AppNavigation)

**DELETE:** `src/components/BuilderHeader.tsx` (replaced by AppNavigation)

All header functionality consolidated into AppNavigation + SideDrawer.

### Phase 8: Apply Landing Page Styling

**Update:** `src/app/(protected)/app/layout.tsx`

Apply consistent styling across all app pages:

```css
/* Background */
bg-[#0a0a0f]

/* Navigation bar */
bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5

/* Active nav items */
bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30

/* Cards/Panels */
bg-zinc-900/50 border border-zinc-800 rounded-xl

/* Primary Buttons */
bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25
hover:shadow-blue-500/40 hover:scale-105

/* Secondary Buttons */
border border-zinc-700 text-zinc-300 hover:bg-white/5
```

**Add animated background gradients (like landing hero):**

```tsx
<motion.div className="absolute bg-blue-600/10 blur-[120px]" />
<motion.div className="absolute bg-purple-600/10 blur-[120px]" />
```

**Add page transitions:**

- Framer Motion fade/slide on route change
- Consistent with landing page animations

### Phase 9: Update AIBuilder.tsx

**Simplify orchestrator:**

- Remove conditional view rendering (lines 1582-1785)
- Keep: Hook initialization, modal coordination, provider wrapping
- The component becomes a layout/provider wrapper only

**Remove `activeView` usage:**

- Mark as deprecated in useAppStore
- Navigation now handled by Next.js routing

### Phase 10: Update Auth Pages Styling

**Update:** `src/app/login/page.tsx` and `src/app/signup/page.tsx`

Apply consistent landing page styling to auth pages:

- Dark background `bg-[#0a0a0f]`
- Animated gradient blobs (like landing hero)
- Glass card for auth form
- Gradient primary buttons
- Consistent typography

```tsx
// Auth page structure
<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
  {/* Animated background gradients */}
  <motion.div className="absolute bg-blue-600/20 blur-[120px]" />
  <motion.div className="absolute bg-purple-600/20 blur-[120px]" />

  {/* Glass auth card */}
  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
    <h1 className="text-2xl font-bold text-white">Sign In</h1>
    {/* Form fields with dark styling */}
    <input className="bg-zinc-800 border-zinc-700 text-white" />
    {/* Gradient submit button */}
    <button className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25">
      Continue
    </button>
  </div>
</div>
```

### Phase 11: Update All Panel/Page Styling

Update each major component to match landing page design:

**NaturalConversationWizard.tsx:**

- Dark background with subtle gradient
- Glass card styling for message bubbles
- Gradient buttons

**LayoutBuilderWizard.tsx:**

- Consistent dark theme
- Glass panels for tool panels
- Gradient accents

**PhasedBuildPanel.tsx:**

- Phase cards with glass styling
- Progress indicators with gradient colors
- Consistent button styling

---

## Files Summary

| File                                           | Action                                        |
| ---------------------------------------------- | --------------------------------------------- |
| `src/app/(protected)/app/layout.tsx`           | CREATE - Shared app layout with nav           |
| `src/app/(protected)/app/page.tsx`             | MODIFY - Render MainBuilderView only          |
| `src/app/(protected)/app/wizard/page.tsx`      | CREATE                                        |
| `src/app/(protected)/app/design/page.tsx`      | CREATE                                        |
| `src/app/(protected)/app/build/page.tsx`       | CREATE                                        |
| `src/components/AppNavigation.tsx`             | CREATE - Unified navigation bar               |
| `src/components/SideDrawer.tsx`                | CREATE - Slide-out menu for secondary actions |
| `src/components/MainBuilderView.tsx`           | CREATE - Extracted from AIBuilder             |
| `src/components/ChatPanel.tsx`                 | MODIFY - Add PLAN/ACT toggle                  |
| `src/components/AIBuilder.tsx`                 | MODIFY - Remove view switching, simplify      |
| `src/components/BuilderHeader.tsx`             | DELETE - Replaced by AppNavigation            |
| `src/components/TabNavigation.tsx`             | DELETE - Replaced by AppNavigation            |
| `src/store/useAppStore.ts`                     | MODIFY - Deprecate activeView                 |
| `src/components/NaturalConversationWizard.tsx` | MODIFY - Update styling                       |
| `src/components/LayoutBuilderWizard.tsx`       | MODIFY - Update styling                       |
| `src/components/modals/PhasedBuildPanel.tsx`   | MODIFY - Update styling                       |
| `src/app/login/page.tsx`                       | MODIFY - Apply landing page styling           |
| `src/app/signup/page.tsx`                      | MODIFY - Apply landing page styling           |

---

## Functionality Preservation (CRITICAL)

**ALL existing functionality MUST remain intact.** This is a UI/UX restructure only - no features removed.

### Features to Preserve Per Page:

**Wizard Page:**

- [ ] Natural conversation flow with AI
- [ ] Draft auto-save and recovery
- [ ] Image upload for inspiration
- [ ] App concept extraction
- [ ] Phase plan generation
- [ ] Suggested actions

**Design Page:**

- [ ] Visual layout builder
- [ ] AI vision capabilities (screenshot analysis)
- [ ] Design token editing (colors, typography, spacing)
- [ ] Animation timeline
- [ ] Responsive breakpoint editor
- [ ] Dark mode editor
- [ ] Template/blueprint selection
- [ ] Export to CSS/Tailwind/Figma

**Build Page:**

- [ ] Phased code generation
- [ ] Phase progress tracking
- [ ] Pause/resume/retry phases
- [ ] Code preview per phase
- [ ] Error handling and auto-fix

**Builder Page:**

- [ ] Chat with AI (PLAN/ACT modes)
- [ ] Live code preview (Sandpack)
- [ ] Code editor
- [ ] Version history and rollback
- [ ] Undo/redo
- [ ] Component library
- [ ] Export options
- [ ] Save to cloud

---

## Workflow Persistence (CRITICAL)

**Progress MUST persist across page navigation.** Users should never lose work.

### State Flow Between Pages:

```
Wizard → Design → Build → Builder
   │        │        │        │
   │        │        │        └── Receives: appConcept, layoutDesign, generatedCode
   │        │        └── Receives: appConcept, layoutDesign, phasePlan
   │        └── Receives: appConcept (can enhance with visual design)
   └── Creates: appConcept, phasePlan
```

### Zustand State Persistence:

| State                 | Created In    | Used In                | Persists?       |
| --------------------- | ------------- | ---------------------- | --------------- |
| `appConcept`          | Wizard        | Design, Build, Builder | ✅ Yes          |
| `currentLayoutDesign` | Design        | Wizard, Build, Builder | ✅ Yes          |
| `dynamicPhasePlan`    | Wizard        | Build                  | ✅ Yes          |
| `newAppStagePlan`     | Wizard        | Build                  | ✅ Yes          |
| `currentComponent`    | Build/Builder | Builder                | ✅ Yes          |
| `chatMessages`        | All pages     | All pages              | ✅ Yes          |
| `versionHistory`      | Builder       | Builder                | ✅ Yes          |
| `undoStack/redoStack` | Builder       | Builder                | ✅ Yes          |
| `wizardDraft`         | Wizard        | Wizard                 | ✅ localStorage |

### How Persistence Works:

1. **Zustand Store** - Single store shared across all pages via client-side navigation
2. **localStorage** - Draft persistence for wizard (survives refresh)
3. **Supabase** - Cloud save for projects (survives logout)

### Navigation Scenarios:

| Scenario                 | Expected Behavior                                         |
| ------------------------ | --------------------------------------------------------- |
| Wizard → Design          | appConcept available in Design page                       |
| Design → Wizard          | Can go back, layoutDesign preserved                       |
| Wizard → Skip to Builder | appConcept still available                                |
| Build → Back to Design   | Can modify design, return to Build                        |
| Browser refresh          | localStorage draft recovery in Wizard                     |
| Page deep link           | State loads if previously set, empty state shows guidance |

---

## State Management

**No changes to state architecture** - Zustand state persists across client-side navigation:

- `appConcept` - Created in wizard, used in builder/build
- `currentLayoutDesign` - Created in design, used in wizard
- `dynamicPhasePlan` - Created in wizard, used in build
- All modals, undo/redo, chat messages persist

---

## Testing Checklist

**Navigation & Flow:**

- [ ] Navigation between all 4 pages works
- [ ] Guided flow: Wizard → Design → Build → Builder works
- [ ] "Skip to Builder" works from every page
- [ ] Back navigation works on each page
- [ ] Progress indicator shows correct step
- [ ] Browser back/forward works
- [ ] Deep linking works (/app/wizard direct access)

**State Persistence:**

- [ ] State persists across page navigation
- [ ] Draft recovery works in wizard
- [ ] Phase plan persists wizard → design → build
- [ ] Layout design persists design → wizard → build

**UI Components:**

- [ ] Slide-out drawer opens/closes correctly
- [ ] PLAN/ACT toggle works in chat panel
- [ ] Modals work on all pages
- [ ] No duplicate buttons anywhere
- [ ] Styling matches landing page on all pages
- [ ] Mobile responsive navigation works

**Auth:**

- [ ] New users redirected to Wizard after auth
- [ ] Returning users can go directly to Builder
- [ ] Auth redirects work correctly

---

## Decisions Made

1. **Project Docs** → Moved to slide-out side drawer
2. **PLAN/ACT toggle** → Moved into ChatPanel on Builder page
3. **Route naming** → `/app/design` for layout builder
4. **Navigation** → Single unified nav bar + side drawer for secondary actions
5. **Page Flow** → Wizard → Design → Build → Builder (logical progression)
6. **Guided vs Free** → New users follow guided flow, experienced users can skip to Builder anytime
7. **Navigation Order** → Nav items ordered left-to-right matching the flow (Wizard first, Builder last)
