# AI App Builder - Technical Debt & Improvement Plan

> Generated: December 8, 2025
> Based on comprehensive codebase assessment

---

## Priority 1: Address Soon

### 1.1 Fix React Hook Dependency Warnings (6 instances)

These missing dependencies can cause stale closures and subtle bugs.

- [ ] `src/components/AIBuilder.tsx:601` - missing `currentComponent`
- [ ] `src/components/ComponentPreview.tsx:459` - missing `dimensions.width`
- [ ] `src/components/LayoutBuilderWizard.tsx:1228` - missing `design`
- [ ] `src/components/LayoutPreview.tsx:1460` - missing `concept.coreFeatures`
- [ ] `src/components/NaturalConversationWizard.tsx:164` - check dependencies
- [ ] `src/components/NaturalConversationWizard.tsx:608` - check dependencies
- [ ] `src/components/NaturalConversationWizard.tsx:707` - check dependencies

**How to fix:**
```bash
npm run lint -- --fix  # Try auto-fix first
```
Then manually review each instance to either:
- Add the missing dependency
- Wrap in useCallback/useMemo
- Add eslint-disable comment with justification if intentional

---

### 1.2 Replace `<img>` with Next.js `<Image>` (6 instances)

Improves LCP (Largest Contentful Paint) and reduces bandwidth costs.

- [ ] `src/components/LayoutPreview.tsx` - dynamic preview images
- [ ] `src/components/ComponentPreview.tsx` - component thumbnails
- [ ] `src/components/TemplatePreview.tsx` - template images
- [ ] `src/components/storage/FileCard.tsx` - file thumbnails
- [ ] `src/components/FeatureLibrary.tsx` - feature icons
- [ ] `src/components/ExamplePrompts.tsx` - example images

**Note:** Some instances may need to remain as `<img>` for dynamic/external URLs. Add eslint-disable comment with justification for those cases.

**How to fix:**
```tsx
// Before
<img src={url} alt="description" />

// After
import Image from 'next/image';
<Image src={url} alt="description" width={300} height={200} />
```

---

### 1.3 Enable TypeScript Strict Mode

Currently `strict: false` in tsconfig.json reduces type safety benefits.

- [ ] Enable `strict: true` in `tsconfig.json`
- [ ] Fix resulting type errors (estimate: 20-50 errors)
- [ ] Focus on:
  - Implicit `any` types
  - Null/undefined checks
  - Function parameter types

**Gradual approach:**
```json
// tsconfig.json - enable incrementally
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,        // Start here
    "strictNullChecks": true,     // Then this
    "strictFunctionTypes": true,  // Then this
    "strict": true                // Finally enable all
  }
}
```

---

## Priority 2: Medium Term

### 2.1 Extend Test Coverage

Current: 52 tests passing (good foundation, needs expansion)

**Unit Tests to Add:**
- [ ] `src/services/analyzers/SecurityAnalyzer.ts`
- [ ] `src/services/analyzers/PerformanceAnalyzer.ts`
- [ ] `src/services/analyzers/ReactAnalyzer.ts`
- [ ] `src/services/ImpactAnalyzer.ts`
- [ ] `src/services/RollbackService.ts`

**API Route Tests to Add:**
- [ ] `src/app/api/ai-builder/route.ts`
- [ ] `src/app/api/ai-builder/full-app/route.ts`
- [ ] `src/app/api/ai-builder/full-app-stream/route.ts`
- [ ] `src/app/api/images/generate/route.ts`
- [ ] `src/app/api/auth/login/route.ts`

**Component Tests to Add:**
- [ ] `src/components/AIBuilder.tsx` - critical user flows
- [ ] `src/components/ChatPanel.tsx` - message handling
- [ ] `src/components/SettingsPage.tsx` - settings persistence

---

### 2.2 Add End-to-End Tests

- [ ] Set up Playwright or Cypress
- [ ] Create E2E tests for critical workflows:
  - [ ] App generation flow (prompt → preview)
  - [ ] Code modification flow
  - [ ] Version rollback
  - [ ] Settings persistence
  - [ ] Authentication flow

---

### 2.3 Sanitize Console Output for Production

- [ ] Create logger utility with environment awareness
- [ ] Replace `console.log/warn/error` with structured logger
- [ ] Ensure API keys and sensitive data never logged
- [ ] Add log levels (debug, info, warn, error)

**Files to update:**
- [ ] `src/services/dalleService.ts` - API key warnings
- [ ] `src/app/api/ai-builder/*/route.ts` - error logging
- [ ] `src/services/CodeParser.ts` - parse errors

---

### 2.4 Add Security Headers

- [ ] Create `next.config.js` security headers:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
];
```

---

## Priority 3: Nice to Have

### 3.1 Split Zustand Store

Current store has grown large with multiple slices.

- [ ] Extract chat slice → `src/store/chatStore.ts`
- [ ] Extract version control slice → `src/store/versionStore.ts`
- [ ] Extract UI slice → `src/store/uiStore.ts`
- [ ] Keep core app state in `src/store/useAppStore.ts`

---

### 3.2 Refactor Large Components

**AIBuilder.tsx (1570 lines)**
- [ ] Extract chat logic → `useAIBuilderChat.ts`
- [ ] Extract generation logic → `useAIBuilderGeneration.ts`
- [ ] Extract UI sections → smaller sub-components

**NaturalConversationWizard.tsx**
- [ ] Extract step components
- [ ] Extract validation logic

---

### 3.3 Add Storybook

- [ ] Install Storybook: `npx storybook@latest init`
- [ ] Create stories for UI components:
  - [ ] Button variants
  - [ ] Modal components
  - [ ] Form inputs
  - [ ] Cards and panels
- [ ] Document component props and usage

---

### 3.4 Add Rate Limiting to API Routes

- [ ] Create rate limiting middleware
- [ ] Apply to AI generation routes
- [ ] Apply to authentication routes
- [ ] Add Redis for distributed rate limiting (optional)

---

## Tracking

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| P1 Fixes | 14 | 0 | 14 |
| P2 Fixes | 20 | 0 | 20 |
| P3 Fixes | 10 | 0 | 10 |
| **Total** | **44** | **0** | **44** |

---

## Notes

- Run `npm run lint` to see current warnings
- Run `npm run typecheck` to verify TypeScript
- Run `npm test` to verify tests pass
- Always commit and push after completing a section
