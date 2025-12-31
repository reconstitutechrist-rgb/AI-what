# AI Model Upgrade Plan

## Overview

Update AI models across the codebase to use latest versions for improved quality, speed, and cost efficiency.

---

## Changes

### 1. Gemini Update (High Priority)

**File:** `src/services/GeminiLayoutService.ts`
**Line:** ~166

```typescript
// Before
this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// After
this.model = this.client.getGenerativeModel({ model: 'gemini-3-flash' });
```

**Reason:** `gemini-2.0-flash-exp` is experimental. Upgrade to `gemini-3-flash` - the latest model with 78% SWE-bench score, outperforms all previous versions.

---

### 2. Claude Sonnet 4 → 4.5 (High Priority)

Update two routes still using the older May 2025 model.

**File 1:** `src/app/api/figma/generate-code/route.ts`
**Line:** ~70

```typescript
// Before
model: 'claude-sonnet-4-20250514',

// After
model: 'claude-sonnet-4-5-20250929',
```

**File 2:** `src/app/api/ai-builder/analyze-semantic/route.ts`
Find and update any `claude-sonnet-4-20250514` references to `claude-sonnet-4-5-20250929`.

**Reason:** Consistency with rest of codebase; newer model has better coding/reasoning.

---

### 3. DALL-E 3 → GPT Image 1 (High Priority)

**Status:** OPENAI_API_KEY confirmed in Railway - implementing migration.

**File:** `src/services/dalleService.ts`

**Changes needed:**

1. Update model name (line ~127):

```typescript
// Before
model: 'dall-e-3',

// After
model: 'gpt-image-1',
```

2. Update size mapping (line ~14):

```typescript
// Before
export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

// After
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
```

3. Remove unsupported parameters from API call (lines ~126-133):
   - Remove `quality` parameter
   - Remove `style` parameter

4. Update cost tracking (lines ~62-69):

```typescript
// New GPT Image 1 pricing (75% cheaper)
const COST_PER_IMAGE: Record<string, number> = {
  '1536x1024': 0.02,
  '1024x1536': 0.02,
  '1024x1024': 0.015,
  auto: 0.015,
};
```

5. Add size mapping helper:

```typescript
private mapSize(oldSize: string): ImageSize {
  const sizeMap: Record<string, ImageSize> = {
    '1024x1024': '1024x1024',
    '1792x1024': '1536x1024',
    '1024x1792': '1024x1536',
  };
  return sizeMap[oldSize] || '1024x1024';
}
```

6. Update type definitions - remove `ImageQuality` and `ImageStyle` types.

7. Update cache key generation to remove quality/style parameters.

**Reason:** DALL-E 3 deprecated November 2025, removal May 2026. GPT Image 1 is 75% cheaper.

---

### 4. Opus for Planning (Optional - Quality Improvement)

Upgrade phase/architecture planning to use Claude Opus 4.5 for better reasoning.

**File 1:** `src/app/api/wizard/generate-phases/route.ts`
**File 2:** `src/app/api/wizard/generate-architecture/route.ts`

```typescript
// Before
model: 'claude-sonnet-4-5-20250929',

// After
model: 'claude-opus-4-5-20251101',
```

**Reason:** Opus excels at long-horizon planning and sustained reasoning. Planning is a one-time cost per app, so higher price is justified.

**Trade-off:** Higher cost (~$15/$75 per million tokens vs $3/$15 for Sonnet).

---

## Execution Order

1. **Gemini update** - Simple one-line change, low risk
2. **Claude Sonnet consistency** - Simple model ID updates
3. **DALL-E migration** - More complex, only if using image generation
4. **Opus upgrade** - Optional, discuss cost implications first

---

## Testing

After each change:

1. Run `npm run typecheck` - Verify no type errors
2. Run `npm run build` - Verify build succeeds
3. Test affected features manually:
   - Gemini: Layout builder visual analysis
   - Sonnet updates: Figma import, semantic analysis
   - DALL-E: Image generation in layout preview (if enabled)
   - Opus: Phase generation wizard

---

## Rollback

All changes are simple model ID swaps. To rollback, revert the model string to the previous value.
