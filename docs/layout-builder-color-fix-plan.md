# Layout Builder Visual Analysis Fix Plan

> **Date:** 2026-01-24
> **Status:** Ready for Implementation
> **Issue:** Layout builder produces grey default colors instead of extracting from images

## Problem Summary

The layout builder fails to properly extract colors and structure from uploaded images/videos, producing:

1. **Grey default colors** (`#6B7280`, `#9CA3AF`, etc.) instead of colors from the image
2. **Poor layout structure** that doesn't match the visual reference

## Root Cause Analysis

### Issue 1: AI "Laziness" - Gemini Defaults to Training Average

Without deterministic inputs (like extracted hex codes), LLMs gravitate towards their training data's "average," which is generic grey wireframes. The prompt asks for colors but doesn't provide ground truth data.

### Issue 2: Vibe Route Overwrites Architect's Work

The `BuilderService` (Vibe Coding) often overwrites the `ArchitectService`'s work. If the Architect extracts "Deep Blue," but the Builder applies a "Modern Clean" metaphor without strict constraints, it resets to generic colors.

### Issue 3: Client-Side Color Extraction Unused

[colorExtraction.ts](../src/utils/colorExtraction.ts) has robust k-means color extraction but it's **never called** in the Architect flow. The entire color extraction burden is on Gemini's vision analysis, which is inconsistent.

### Issue 4: No Color Fidelity in Style Synthesis

The `synthesizeStyles` function in the vibe route doesn't enforce using the manifest's existing `designSystem.colors` - it just applies metaphor-based styling which can overwrite specific colors with generic Tailwind classes.

## Solution: Hybrid Approach (Deterministic Code + AI Reasoning)

The fix uses **client-side k-means clustering** to extract colors mathematically, then injects this "ground truth" into Gemini's prompt as hard constraints.

## Files to Modify

| File                                                                                                    | Changes                                                        |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [src/components/LayoutBuilderWizard.tsx](../src/components/LayoutBuilderWizard.tsx)                     | Pre-extract colors client-side using k-means before API call   |
| [src/services/ArchitectService.ts](../src/services/ArchitectService.ts)                                 | Accept and pass extracted palette to server                    |
| [src/app/api/architect/generate-manifest/route.ts](../src/app/api/architect/generate-manifest/route.ts) | Inject extracted colors as "GROUND TRUTH" constraint in prompt |
| [src/app/api/builder/vibe/route.ts](../src/app/api/builder/vibe/route.ts)                               | Update synthesizeStyles to enforce design system colors        |

## Implementation Details

### 1. LayoutBuilderWizard.tsx - Client-Side Color Extraction

**Add import:**

```typescript
import { extractColorsFromFile, type ColorPalette } from '@/utils/colorExtraction';
```

**In `handleInitialGeneration`, before calling architect:**

```typescript
// 0. PRE-PROCESSING: Extract Colors Client-Side
let detectedPalette: ColorPalette | undefined;
if (mediaFiles && mediaFiles.length > 0) {
  const imageFile = mediaFiles.find((f) => f.type.startsWith('image/'));
  if (imageFile) {
    try {
      setLoadingStage('Extracting Palette...');
      const result = await extractColorsFromFile(imageFile);
      detectedPalette = result.palette;
      console.log('Client-side extracted palette:', detectedPalette);
    } catch (e) {
      console.warn('Failed to extract colors client-side:', e);
    }
  }
}

// Pass to architect
const newManifest = await architect.generateLayoutManifest(
  appConcept,
  effectivePrompt,
  mediaFiles,
  detectedPalette // NEW PARAMETER
);
```

### 2. ArchitectService.ts - Carry Palette to Server

**Update method signature:**

```typescript
async generateLayoutManifest(
  concept: AppConcept | null | undefined,
  userPrompt: string,
  mediaFiles?: File[],
  extractedColors?: ColorPalette  // NEW PARAMETER
): Promise<LayoutManifest>
```

**Add to request body:**

```typescript
if (extractedColors) {
  requestBody.extractedColors = extractedColors;
}
```

### 3. generate-manifest/route.ts - Inject Ground Truth

**Add to request interface:**

```typescript
extractedColors?: ColorPalette;
```

**Build color injection context (the critical fix):**

```typescript
const colorInjectionLine = extractedColors
  ? `\nDETECTED COLOR PALETTE (GROUND TRUTH - HIGH PRIORITY):
The following colors were algorithmically extracted from the source image. You MUST use these values in the designSystem.colors object unless explicitly instructed otherwise.
- Primary: ${extractedColors.primary}
- Secondary: ${extractedColors.secondary}
- Background: ${extractedColors.background}
- Surface: ${extractedColors.surface}
- Text: ${extractedColors.text}
- Border: ${extractedColors.border}
- Accent: ${extractedColors.accent}

DO NOT use generic greys (#6B7280, etc) if these specific colors are provided.`
  : '';
```

**Include in system prompt:**

```typescript
const systemPrompt = `
ROLE: Expert Frontend Architect...
${contextLine}${imageContextLine}
${colorInjectionLine}  // <-- ADD THIS
...
`;
```

### 4. vibe/route.ts - Enforce Color Fidelity in Style Synthesis

**Update `synthesizeStyles` prompt to use manifest colors:**

```typescript
async function synthesizeStyles(model: any, manifest: LayoutManifest, metaphor: string): Promise<LayoutManifest> {
  const colors = manifest.designSystem?.colors || {};
  const colorContext = Object.entries(colors)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const prompt = `
ROLE: "Flash UI" - Tailwind CSS styling engine.

CRITICAL PRIORITY - COLOR FIDELITY:
You MUST use the specific colors defined in the manifest's Design System.
Do NOT use generic Tailwind colors (like 'bg-blue-500') if a custom color is defined.
Use arbitrary values to match exact hex codes:
- Primary (${colors.primary || 'N/A'}) -> use 'bg-[${colors.primary}]' or 'text-[${colors.primary}]'
- Secondary (${colors.secondary || 'N/A'}) -> use 'bg-[${colors.secondary}]'
- Background (${colors.background || 'N/A'}) -> use 'bg-[${colors.background}]'

METAPHOR: "${metaphor}"

DESIGN SYSTEM COLORS:
${colorContext}

STYLE INSTRUCTIONS:
1. Apply the Metaphor's texture/physics (blur, shadow, border) using Tailwind.
2. Apply the Design System's COLORS to backgrounds, text, and borders.
3. Modify ONLY the 'styles.tailwindClasses'.
4. Preserve ALL other fields exactly.
...
`;
```

## Data Flow After Fix

```
User uploads image
       ↓
[Client] extractColorsFromFile() → k-means clustering → ColorPalette
       ↓
[Client] ArchitectService.generateLayoutManifest(palette)
       ↓
[Server] generate-manifest/route.ts receives palette as "GROUND TRUTH"
       ↓
[Server] Gemini generates manifest with ENFORCED colors
       ↓
[Server] vibe/route.ts synthesizeStyles RESPECTS designSystem.colors
       ↓
Output: Layout with ACTUAL colors from image
```

## Verification Plan

1. **Test with color-rich image:** Upload a branded website screenshot (e.g., Stripe's purple gradient)
   - Expected: Primary should be Stripe's purple, not grey
   - Verify: Check `designSystem.colors` in manifest

2. **Test with dark theme image:** Upload a dark UI screenshot
   - Expected: Background should be actual dark color from image

3. **Test multi-image merge:** "Layout from Image 1, colors from Image 2"
   - Expected: Structure matches Image 1, colors match Image 2

4. **Test vibe preservation:** After initial generation, apply a vibe like "glass"
   - Expected: Metaphor effects applied BUT colors remain from original extraction

## Why This Works

1. **Deterministic First:** k-means clustering mathematically extracts dominant colors - no AI guessing
2. **AI Constrained:** Gemini receives colors as "GROUND TRUTH" with explicit prohibition against defaults
3. **End-to-End Fidelity:** Both Architect AND Builder respect the extracted colors
4. **Graceful Degradation:** If client-side extraction fails, Gemini still tries (just less reliably)

## Related Files

- [colorExtraction.ts](../src/utils/colorExtraction.ts) - K-means color extraction utility
- [LayoutBuilderWizard.tsx](../src/components/LayoutBuilderWizard.tsx) - Main wizard component
- [ArchitectService.ts](../src/services/ArchitectService.ts) - Client-side service
- [generate-manifest/route.ts](../src/app/api/architect/generate-manifest/route.ts) - Server API route
- [vibe/route.ts](../src/app/api/builder/vibe/route.ts) - Vibe coding API route
