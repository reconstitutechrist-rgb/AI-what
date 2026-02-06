/**
 * Gemini Layout Service Helpers
 *
 * Utility functions for coordinate normalization, typography validation,
 * and base64 image processing.
 */

import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { validateFontSizeForContainer } from '@/utils/responsiveTypography';

// ============================================================================
// BASE64 / IMAGE HELPERS
// ============================================================================

/**
 * Convert base64 image to Gemini API part format
 */
export function fileToPart(base64: string) {
  // Extract MIME type from data URI (handles PNG, JPEG, SVG, WebP, etc.)
  const mimeMatch = base64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  // Remove the data URI prefix - broader regex handles uppercase and special chars
  const data = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  return {
    inlineData: {
      data,
      mimeType,
    },
  };
}

// ============================================================================
// COORDINATE NORMALIZATION
// ============================================================================

/**
 * Helper to normalize component coordinates.
 * Handles 0-1000 scale (from new prompts) and converts to 0-100 scale (percentage).
 * Uses Max Value Heuristic to auto-detect scale.
 */
export function normalizeCoordinates(components: unknown[]): unknown[] {
  if (!Array.isArray(components) || components.length === 0) return components;

  // Deep clone to avoid mutating input
  const normalized = JSON.parse(JSON.stringify(components));

  // Heuristic: Check for values > 100 to detect 0-1000 scale
  let maxCoord = 0;

  // Scan all components to find the maximum coordinate value
  normalized.forEach((c: Record<string, unknown>) => {
    const bounds = c?.bounds as Record<string, unknown> | undefined;
    if (bounds) {
      const top = typeof bounds.top === 'string' ? parseFloat(bounds.top) : (bounds.top as number);
      const left =
        typeof bounds.left === 'string' ? parseFloat(bounds.left) : (bounds.left as number);
      const width =
        typeof bounds.width === 'string' ? parseFloat(bounds.width) : (bounds.width as number);
      const height =
        typeof bounds.height === 'string' ? parseFloat(bounds.height) : (bounds.height as number);

      maxCoord = Math.max(maxCoord, top || 0, left || 0, width || 0, height || 0);
    }
  });

  // If max coordinate exceeds 100, assume 0-1000 scale and divide everything by 10
  // We use a threshold slightly above 100 to account for potential small floating point errors or 101%
  const isThousandsScale = maxCoord > 105;

  if (isThousandsScale) {
    console.log(
      '[GeminiLayoutService] Detected 0-1000 scale (max=' +
        maxCoord +
        '). Normalizing to percentages.'
    );
    normalized.forEach((c: Record<string, unknown>) => {
      const bounds = c?.bounds as Record<string, unknown> | undefined;
      if (bounds) {
        const normalize = (val: unknown) => {
          const num = typeof val === 'string' ? parseFloat(val) : (val as number);
          return isNaN(num) ? 0 : num / 10;
        };

        bounds.top = normalize(bounds.top);
        bounds.left = normalize(bounds.left);
        bounds.width = normalize(bounds.width);
        bounds.height = normalize(bounds.height);
      }
    });
  } else {
    console.log(
      '[GeminiLayoutService] Detected 0-100 scale (max=' + maxCoord + '). Keeping as percentages.'
    );
  }

  return normalized;
}

// ============================================================================
// TYPOGRAPHY VALIDATION
// ============================================================================

/**
 * Post-processing: Validate and correct typography scaling.
 * Ensures font sizes don't exceed container dimensions to prevent overflow.
 */
export function validateTypographyScaling(
  components: DetectedComponentEnhanced[]
): DetectedComponentEnhanced[] {
  return components.map((component) => {
    if (!component.style?.fontSize || !component.bounds?.height) return component;

    const validation = validateFontSizeForContainer(
      component.style.fontSize,
      component.bounds.height
    );

    if (!validation.valid && validation.recommendedFontSize) {
      console.log(
        `[GeminiLayoutService] Typography fix: ${component.id} fontSize ${component.style.fontSize} → ${validation.recommendedFontSize}px (container height: ${component.bounds.height}%)`
      );
      return {
        ...component,
        style: {
          ...component.style,
          fontSize: `${validation.recommendedFontSize}px`,
        },
      };
    }

    return component;
  });
}
