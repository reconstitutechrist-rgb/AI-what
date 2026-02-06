/**
 * Layout Inference Functions
 *
 * Provides hierarchy validation and layout inference utilities
 * for building and repairing component trees.
 */

import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { CONTAINER_TYPES } from './constants';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of hierarchy validation
 */
export interface HierarchyValidationResult {
  /** Whether the hierarchy is valid */
  valid: boolean;
  /** Components with no parent that should have one */
  orphans: string[];
  /** Components referencing non-existent parents */
  missingParents: string[];
  /** Components involved in circular references */
  circularRefs: string[];
}

/**
 * Result of building a component tree
 */
export interface ComponentTreeResult {
  /** Root components (no parentId) */
  roots: DetectedComponentEnhanced[];
  /** Map of all components by ID for quick lookup */
  componentMap: Map<string, DetectedComponentEnhanced>;
}

// ============================================================================
// HIERARCHY VALIDATION
// ============================================================================

/**
 * Validate parent-child relationships in component hierarchy.
 * Checks for orphans, missing parents, and circular references.
 */
export function validateHierarchy(
  components: DetectedComponentEnhanced[]
): HierarchyValidationResult {
  const result: HierarchyValidationResult = {
    valid: true,
    orphans: [],
    missingParents: [],
    circularRefs: [],
  };

  // Build ID set for quick lookup
  const componentIds = new Set(components.map((c) => c.id));

  for (const component of components) {
    // Check for missing parent references
    if (component.parentId && !componentIds.has(component.parentId)) {
      result.missingParents.push(component.id);
      result.valid = false;
    }

    // Check for potential orphans (leaf-like components without parents)
    // Skip root section types which are expected to have no parent
    const isRootType = CONTAINER_TYPES.has(component.type);
    if (!component.parentId && !isRootType && component.role !== 'overlay') {
      // This might be an orphan - a leaf without a parent
      result.orphans.push(component.id);
    }
  }

  // Check for circular references
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function detectCycle(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;

    visited.add(id);
    inStack.add(id);

    const component = components.find((c) => c.id === id);
    if (component?.parentId) {
      if (detectCycle(component.parentId)) {
        result.circularRefs.push(id);
        result.valid = false;
        return true;
      }
    }

    inStack.delete(id);
    return false;
  }

  for (const component of components) {
    detectCycle(component.id);
  }

  return result;
}

/**
 * Build a component tree from a flat array of components.
 * Returns root components and a map for quick lookup.
 * Works with both hierarchical and flat (legacy) layouts.
 */
export function buildComponentTree(components: DetectedComponentEnhanced[]): ComponentTreeResult {
  const componentMap = new Map<string, DetectedComponentEnhanced>();
  const roots: DetectedComponentEnhanced[] = [];

  // First pass: build the map
  for (const component of components) {
    componentMap.set(component.id, component);
  }

  // Second pass: identify roots (components without parentId)
  for (const component of components) {
    if (!component.parentId) {
      roots.push(component);
    }
  }

  // If no hierarchy exists (legacy flat layout), treat all as roots
  if (roots.length === 0 && components.length > 0) {
    // All components are roots in flat layouts
    return { roots: [...components], componentMap };
  }

  return { roots, componentMap };
}

/**
 * Repair orphan components by attaching them to the nearest container.
 * Uses bounds containment to determine parent relationships.
 */
export function repairOrphans(
  components: DetectedComponentEnhanced[]
): DetectedComponentEnhanced[] {
  const validation = validateHierarchy(components);

  // If no orphans, return as-is
  if (validation.orphans.length === 0) {
    return components;
  }

  // Find all container components
  const containers = components.filter(
    (c) => CONTAINER_TYPES.has(c.type) || c.role === 'container'
  );

  // Create a mutable copy
  const repairedComponents = components.map((c) => ({ ...c }));
  const componentMap = new Map(repairedComponents.map((c) => [c.id, c]));

  // For each orphan, find the best container
  for (const orphanId of validation.orphans) {
    const orphan = componentMap.get(orphanId);
    if (!orphan) continue;

    // Find container that best contains this orphan
    let bestContainer: DetectedComponentEnhanced | null = null;
    let bestScore = -1;

    for (const container of containers) {
      // Skip self
      if (container.id === orphanId) continue;

      // Check if orphan bounds are within container bounds
      const ob = orphan.bounds;
      const cb = container.bounds;

      // Calculate containment score
      const horizontalOverlap = Math.max(
        0,
        Math.min(ob.left + ob.width, cb.left + cb.width) - Math.max(ob.left, cb.left)
      );
      const verticalOverlap = Math.max(
        0,
        Math.min(ob.top + ob.height, cb.top + cb.height) - Math.max(ob.top, cb.top)
      );

      const overlapArea = horizontalOverlap * verticalOverlap;
      const orphanArea = ob.width * ob.height || 1;
      const containmentScore = overlapArea / orphanArea;

      // Prefer containers that fully contain the orphan
      if (containmentScore > bestScore && containmentScore > 0.5) {
        bestScore = containmentScore;
        bestContainer = container;
      }
    }

    // Attach orphan to best container
    if (bestContainer) {
      orphan.parentId = bestContainer.id;

      // Update container's children array
      const containerInMap = componentMap.get(bestContainer.id);
      if (containerInMap) {
        if (!containerInMap.children) {
          containerInMap.children = [];
        }
        if (!containerInMap.children.includes(orphanId)) {
          containerInMap.children.push(orphanId);
        }
      }
    }
  }

  return repairedComponents;
}

// ============================================================================
// LAYOUT INFERENCE
// ============================================================================

/**
 * Infer layout configuration for containers that are missing it.
 * Analyzes child positions to determine if they look like a Row (flex-row), Column (flex-col), or Grid.
 */
export function inferContainerLayouts(
  components: DetectedComponentEnhanced[]
): DetectedComponentEnhanced[] {
  // Create mutable copy
  const updatedComponents = components.map((c) => ({ ...c }));
  const componentMap = new Map(updatedComponents.map((c) => [c.id, c]));

  // Process all containers
  for (const component of updatedComponents) {
    if (
      (component.role === 'container' || (component.children && component.children.length > 0)) &&
      (!component.layout || component.layout.type === 'none')
    ) {
      const children = (component.children || [])
        .map((id: string) => componentMap.get(id))
        .filter((c): c is DetectedComponentEnhanced => !!c);

      if (children.length === 0) continue;

      // Analyze children bounds to guess layout
      // Sort children by top/left
      const byTop = [...children].sort((a, b) => a.bounds.top - b.bounds.top);
      const byLeft = [...children].sort((a, b) => a.bounds.left - b.bounds.left);

      // Check vertical stacking (Column)
      let isVertical = true;
      for (let i = 0; i < byTop.length - 1; i++) {
        const current = byTop[i];
        const next = byTop[i + 1];
        if (current.bounds.top + current.bounds.height <= next.bounds.top + 5) {
          // Clean vertical gap
        } else {
          const horizontalOverlap = Math.max(
            0,
            Math.min(
              current.bounds.left + current.bounds.width,
              next.bounds.left + next.bounds.width
            ) - Math.max(current.bounds.left, next.bounds.left)
          );
          if (horizontalOverlap < Math.min(current.bounds.width, next.bounds.width) * 0.5) {
            isVertical = false;
            break;
          }
        }
      }

      // Check horizontal arrangement (Row)
      let isHorizontal = true;
      for (let i = 0; i < byLeft.length - 1; i++) {
        const current = byLeft[i];
        const next = byLeft[i + 1];

        if (current.bounds.left + current.bounds.width <= next.bounds.left + 5) {
          // Clean horizontal gap
        } else {
          const verticalOverlap = Math.max(
            0,
            Math.min(
              current.bounds.top + current.bounds.height,
              next.bounds.top + next.bounds.height
            ) - Math.max(current.bounds.top, next.bounds.top)
          );
          if (verticalOverlap < Math.min(current.bounds.height, next.bounds.height) * 0.5) {
            isHorizontal = false;
            break;
          }
        }
      }

      // Calculate actual gap from child positions
      const calculateGap = (
        sortedChildren: DetectedComponentEnhanced[],
        direction: 'row' | 'column'
      ): string => {
        if (sortedChildren.length < 2) return '0';
        const gaps: number[] = [];
        for (let i = 0; i < sortedChildren.length - 1; i++) {
          const current = sortedChildren[i];
          const next = sortedChildren[i + 1];
          if (direction === 'column') {
            const gap = next.bounds.top - (current.bounds.top + current.bounds.height);
            if (gap > 0) gaps.push(gap);
          } else {
            const gap = next.bounds.left - (current.bounds.left + current.bounds.width);
            if (gap > 0) gaps.push(gap);
          }
        }
        if (gaps.length === 0) return '0';
        const avgGap = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        return `${avgGap}px`;
      };

      // Assign layout
      if (isVertical) {
        const calculatedGap = calculateGap(byTop, 'column');
        component.layout = {
          type: 'flex',
          direction: 'column',
          gap: calculatedGap,
          align: 'stretch',
          justify: 'start',
        };
        console.log(
          `[inferContainerLayouts] ${component.id}: column layout with gap ${calculatedGap}`
        );
      } else if (isHorizontal) {
        const calculatedGap = calculateGap(byLeft, 'row');
        component.layout = {
          type: 'flex',
          direction: 'row',
          gap: calculatedGap,
          align: 'center',
          justify: 'start',
          wrap: true,
        };
        console.log(
          `[inferContainerLayouts] ${component.id}: row layout with gap ${calculatedGap}`
        );
      } else {
        // Fallback to vertical flow
        component.layout = {
          type: 'flex',
          direction: 'column',
          gap: '16px',
        };
      }
    }
  }

  return updatedComponents;
}

/**
 * Migrate a flat layout to hierarchical structure.
 * Infers parent-child relationships from bounds containment AND infers layout types.
 */
export function migrateToHierarchical(
  components: DetectedComponentEnhanced[]
): DetectedComponentEnhanced[] {
  // If already hierarchical, return as-is
  const hasHierarchy = components.some((c) => c.parentId || (c.children && c.children.length > 0));
  if (hasHierarchy) {
    // Even if hierarchy exists, we might need to infer layout if missing
    return inferContainerLayouts(components);
  }

  // Create mutable copies with role assignment
  const migratedComponents = components.map((c) => ({
    ...c,
    role: CONTAINER_TYPES.has(c.type) ? ('container' as const) : ('leaf' as const),
    children: CONTAINER_TYPES.has(c.type) ? ([] as string[]) : undefined,
  }));

  // Sort by area (largest first) to process containers before leaves
  const sortedByArea = [...migratedComponents].sort((a, b) => {
    const areaA = a.bounds.width * a.bounds.height;
    const areaB = b.bounds.width * b.bounds.height;
    return areaB - areaA;
  });

  // For each leaf, find containing parent
  for (const component of migratedComponents) {
    if (component.role === 'container') continue;

    // Find smallest container that fully contains this component
    let bestParent: (typeof migratedComponents)[0] | null = null;
    let bestArea = Infinity;

    for (const potential of sortedByArea) {
      if (potential.id === component.id) continue;
      if (potential.role !== 'container') continue;

      const pb = potential.bounds;
      const cb = component.bounds;

      // Check containment
      const isContained =
        cb.left >= pb.left - 1 &&
        cb.top >= pb.top - 1 &&
        cb.left + cb.width <= pb.left + pb.width + 1 &&
        cb.top + cb.height <= pb.top + pb.height + 1;

      if (isContained) {
        const area = pb.width * pb.height;
        if (area < bestArea) {
          bestArea = area;
          bestParent = potential;
        }
      }
    }

    if (bestParent) {
      component.parentId = bestParent.id;
      if (!bestParent.children) bestParent.children = [];
      bestParent.children.push(component.id);
    }
  }

  // Final Pass: Infer layout strategies for all containers
  return inferContainerLayouts(migratedComponents);
}
