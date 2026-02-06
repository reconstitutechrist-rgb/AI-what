/**
 * Overlap Resolution Functions
 *
 * Provides functions to detect and resolve overlapping components
 * in layout hierarchies.
 */

import type { DetectedComponentEnhanced } from '@/types/layoutDesign';

/**
 * Resolve overlaps between root components by stacking them vertically.
 * This ensures that sections like Header, Hero, Features, and Footer don't pile on top of each other.
 */
export function resolveRootOverlaps(
  components: DetectedComponentEnhanced[]
): DetectedComponentEnhanced[] {
  // Create mutable copy
  const updatedComponents = components.map((c) => ({ ...c }));

  // 1. Identify root components (parentId == null/undefined)
  const roots = updatedComponents.filter((c) => !c.parentId);

  if (roots.length < 2) return updatedComponents;

  // 2. Sort by bounds.top to process in visual order
  roots.sort((a, b) => a.bounds.top - b.bounds.top);

  // 3. Walk sorted list and resolve overlaps
  // We skip the first one (anchored at top) and adjust subsequent ones
  for (let i = 0; i < roots.length - 1; i++) {
    const current = roots[i];
    const next = roots[i + 1];

    // Skip sidebar detection: if any root has left > 5 or width < 90,
    // it may be a sidebar or overlay — skip pushing those down
    // (Assuming 0-100 percentage scale)
    if (next.bounds.left > 5 || next.bounds.width < 90) {
      continue;
    }

    // Default gap to leave between sections (2%)
    const GAP = 2;

    // Calculate where the current component ends
    const currentBottom = current.bounds.top + current.bounds.height;

    // Check if next component overlaps (starts before current ends)
    // or is too close
    if (next.bounds.top < currentBottom + GAP) {
      // Push next component down
      const newTop = currentBottom + GAP;

      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[resolveRootOverlaps] Pushing ${next.id} down from ${next.bounds.top} to ${newTop} (overlaps ${current.id})`
        );
      }

      next.bounds.top = newTop;

      // Important: Since we modified 'next', subsequent iterations will use its NEW top
      // to calculate the position of the one after it.
    }
  }

  // Reflect changes back into the main array (already done via reference, but good for clarity)
  return updatedComponents;
}

/**
 * Detect overlapping components within a set of siblings.
 * Returns pairs of component IDs that overlap.
 */
export function detectOverlaps(
  components: DetectedComponentEnhanced[]
): Array<{ a: string; b: string; overlapArea: number }> {
  const overlaps: Array<{ a: string; b: string; overlapArea: number }> = [];

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i];
      const b = components[j];

      // Calculate overlap
      const horizontalOverlap = Math.max(
        0,
        Math.min(a.bounds.left + a.bounds.width, b.bounds.left + b.bounds.width) -
          Math.max(a.bounds.left, b.bounds.left)
      );
      const verticalOverlap = Math.max(
        0,
        Math.min(a.bounds.top + a.bounds.height, b.bounds.top + b.bounds.height) -
          Math.max(a.bounds.top, b.bounds.top)
      );

      const overlapArea = horizontalOverlap * verticalOverlap;

      if (overlapArea > 0) {
        overlaps.push({ a: a.id, b: b.id, overlapArea });
      }
    }
  }

  return overlaps;
}
