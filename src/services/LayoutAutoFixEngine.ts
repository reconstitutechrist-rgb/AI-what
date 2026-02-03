/**
 * Layout Auto-Fix Engine
 *
 * Applies critique corrections to DetectedComponentEnhanced arrays.
 * Uses a blocklist approach: blocks known-dangerous properties,
 * allows everything else through.
 */

import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import type { LayoutDiscrepancy } from '@/types/layoutAnalysis';

// ============================================================================
// TYPES
// ============================================================================

export interface AutoFixResult {
  /** Updated components with corrections applied */
  components: DetectedComponentEnhanced[];
  /** Number of corrections successfully applied */
  appliedCount: number;
  /** Number of corrections skipped (blocked or no matching component) */
  skippedCount: number;
  /** Details of each fix attempt */
  details: FixDetail[];
}

export interface FixDetail {
  componentId: string;
  property: string;
  category: 'style' | 'content' | 'bounds';
  applied: boolean;
  reason?: string;
}

// ============================================================================
// BLOCKLISTS
// ============================================================================

/** Style properties that are unsafe to auto-fix (XSS / injection vectors) */
const BLOCKED_STYLE_PROPERTIES = new Set([
  'content', // CSS content injection
  'behavior', // IE-specific
  '-moz-binding', // XSS vector
]);

/** Content properties that are unsafe to auto-fix */
const BLOCKED_CONTENT_PROPERTIES = new Set([
  'innerHTML',
  'outerHTML',
  'dangerouslySetInnerHTML',
  'script',
  'iframe',
  'object',
  'embed',
]);

/** Pattern for event handler properties (onClick, onLoad, etc.) */
function isEventHandler(property: string): boolean {
  return /^on[A-Z]/.test(property);
}

/** Check style values for injection attempts */
function hasUnsafeValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const lower = value.toLowerCase();
  return (
    lower.includes('expression(') ||
    lower.includes('javascript:') ||
    lower.includes('url(javascript:')
  );
}

// ============================================================================
// ENGINE
// ============================================================================

class LayoutAutoFixEngine {
  /**
   * Apply critique discrepancies to a component array.
   * Returns a new array with corrections applied (does not mutate input).
   */
  applyFixes(
    components: DetectedComponentEnhanced[],
    discrepancies: LayoutDiscrepancy[]
  ): AutoFixResult {
    // Deep clone to avoid mutation
    const updated = structuredClone(components);
    const componentMap = new Map(updated.map((c) => [c.id, c]));

    let appliedCount = 0;
    let skippedCount = 0;
    const details: FixDetail[] = [];

    for (const disc of discrepancies) {
      const component = componentMap.get(disc.componentId);
      if (!component) {
        skippedCount++;
        details.push({
          componentId: disc.componentId,
          property: disc.issue,
          category: 'style',
          applied: false,
          reason: `Component '${disc.componentId}' not found`,
        });
        continue;
      }

      if (!disc.correctionJSON) {
        skippedCount++;
        continue;
      }

      // Apply style corrections
      if (disc.correctionJSON.style) {
        for (const [prop, value] of Object.entries(disc.correctionJSON.style)) {
          const result = this.applyStyleFix(component, prop, value);
          details.push(result);
          if (result.applied) appliedCount++;
          else skippedCount++;
        }
      }

      // Apply content corrections
      if (disc.correctionJSON.content) {
        for (const [prop, value] of Object.entries(disc.correctionJSON.content)) {
          const result = this.applyContentFix(component, prop, value);
          details.push(result);
          if (result.applied) appliedCount++;
          else skippedCount++;
        }
      }

      // Apply bounds corrections
      if (disc.correctionJSON.bounds) {
        for (const [prop, value] of Object.entries(disc.correctionJSON.bounds)) {
          const result = this.applyBoundsFix(component, prop, value);
          details.push(result);
          if (result.applied) appliedCount++;
          else skippedCount++;
        }
      }
    }

    return { components: updated, appliedCount, skippedCount, details };
  }

  private applyStyleFix(
    component: DetectedComponentEnhanced,
    property: string,
    value: unknown
  ): FixDetail {
    const detail: FixDetail = {
      componentId: component.id,
      property: `style.${property}`,
      category: 'style',
      applied: false,
    };

    if (BLOCKED_STYLE_PROPERTIES.has(property)) {
      detail.reason = `Blocked property: ${property}`;
      return detail;
    }

    if (isEventHandler(property)) {
      detail.reason = `Event handler not allowed: ${property}`;
      return detail;
    }

    if (hasUnsafeValue(value)) {
      detail.reason = `Unsafe value detected`;
      return detail;
    }

    // Apply the fix
    (component.style as Record<string, unknown>)[property] = value;
    detail.applied = true;
    return detail;
  }

  private applyContentFix(
    component: DetectedComponentEnhanced,
    property: string,
    value: unknown
  ): FixDetail {
    const detail: FixDetail = {
      componentId: component.id,
      property: `content.${property}`,
      category: 'content',
      applied: false,
    };

    if (BLOCKED_CONTENT_PROPERTIES.has(property)) {
      detail.reason = `Blocked property: ${property}`;
      return detail;
    }

    if (isEventHandler(property)) {
      detail.reason = `Event handler not allowed: ${property}`;
      return detail;
    }

    // Ensure content object exists
    if (!component.content) {
      component.content = {};
    }

    (component.content as Record<string, unknown>)[property] = value;
    detail.applied = true;
    return detail;
  }

  private applyBoundsFix(
    component: DetectedComponentEnhanced,
    property: string,
    value: unknown
  ): FixDetail {
    const detail: FixDetail = {
      componentId: component.id,
      property: `bounds.${property}`,
      category: 'bounds',
      applied: false,
    };

    const validBoundsProps = ['top', 'left', 'width', 'height'];
    if (!validBoundsProps.includes(property)) {
      detail.reason = `Invalid bounds property: ${property}`;
      return detail;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) {
      detail.reason = `Non-numeric bounds value: ${value}`;
      return detail;
    }

    (component.bounds as Record<string, number>)[property] = numValue;
    detail.applied = true;
    return detail;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let instance: LayoutAutoFixEngine | null = null;

export function getLayoutAutoFixEngine(): LayoutAutoFixEngine {
  if (!instance) instance = new LayoutAutoFixEngine();
  return instance;
}
