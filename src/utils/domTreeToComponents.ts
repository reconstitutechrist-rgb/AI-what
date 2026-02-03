/**
 * DOM Tree → DetectedComponentEnhanced Converter
 *
 * Converts the Surveyor's recursive dom_tree (VisualManifest.global_theme.dom_tree)
 * into a flat DetectedComponentEnhanced[] array suitable for the LayoutAutoFixEngine
 * and componentsToReactCode converter.
 */

import type { DomTreeNode } from '@/types/titanPipeline';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversionResult {
  components: DetectedComponentEnhanced[];
  warnings: string[];
}

// ============================================================================
// STYLE MAPPING
// ============================================================================

/**
 * Map dom_tree CSS-style property names to DetectedComponentEnhanced style fields.
 * Most are direct passthrough; a few need renaming.
 */
function mapStyles(
  styles: Record<string, string> | undefined
): DetectedComponentEnhanced['style'] {
  if (!styles) return {};

  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null || value === '') continue;

    switch (key) {
      // Renamed properties
      case 'color':
        mapped.textColor = value;
        break;
      case 'boxShadow':
        mapped.shadow = value;
        break;

      // Direct passthrough properties
      case 'backgroundColor':
      case 'borderRadius':
      case 'padding':
      case 'fontSize':
      case 'fontWeight':
      case 'fontFamily':
      case 'fontStyle':
      case 'textAlign':
      case 'textTransform':
      case 'textDecoration':
      case 'textShadow':
      case 'letterSpacing':
      case 'lineHeight':
      case 'backgroundImage':
      case 'backgroundSize':
      case 'backgroundPosition':
      case 'backgroundRepeat':
      case 'opacity':
      case 'backdropFilter':
      case 'transform':
      case 'filter':
      case 'mixBlendMode':
      case 'overflow':
      case 'cursor':
      case 'margin':
      case 'maxWidth':
      case 'maxHeight':
      case 'minHeight':
      case 'aspectRatio':
      case 'whiteSpace':
      case 'textOverflow':
      case 'wordBreak':
      case 'animation':
      case 'transition':
      case 'gap':
        mapped[key] = value;
        break;

      // Border parsing
      case 'border': {
        // Parse shorthand like "1px solid #ccc"
        const parts = value.split(/\s+/);
        if (parts.length >= 1) mapped.borderWidth = parts[0];
        if (parts.length >= 2) mapped.borderStyle = parts[1];
        if (parts.length >= 3) mapped.borderColor = parts[2];
        break;
      }
      case 'borderWidth':
      case 'borderColor':
      case 'borderStyle':
        mapped[key] = value;
        break;

      // Layout-related (also stored in style for code generation)
      case 'display':
      case 'flexDirection':
      case 'justifyContent':
      case 'alignItems':
      case 'flexWrap':
      case 'gridTemplateColumns':
      case 'position':
      case 'top':
      case 'right':
      case 'bottom':
      case 'left':
      case 'zIndex':
        mapped[key] = value;
        break;

      // Anything else: pass through into customCSS
      default: {
        if (!mapped.customCSS) mapped.customCSS = {};
        (mapped.customCSS as Record<string, string>)[key] = value;
        break;
      }
    }
  }

  // Infer hasBackground
  if (mapped.backgroundColor && mapped.backgroundColor !== 'transparent') {
    mapped.hasBackground = true;
  }

  return mapped as DetectedComponentEnhanced['style'];
}

// ============================================================================
// LAYOUT INFERENCE
// ============================================================================

/** Map CSS justify-content values to short-form layout values */
function mapJustifyReverse(value: string | undefined): DetectedComponentEnhanced['layout'] extends { justify?: infer J } ? J : undefined {
  const map: Record<string, string> = {
    'flex-start': 'start',
    'center': 'center',
    'flex-end': 'end',
    'space-between': 'between',
    'space-around': 'around',
    'space-evenly': 'evenly',
  };
  return (map[value || ''] || undefined) as ReturnType<typeof mapJustifyReverse>;
}

/** Map CSS align-items values to short-form layout values */
function mapAlignReverse(value: string | undefined): 'start' | 'center' | 'end' | 'stretch' | undefined {
  const map: Record<string, string> = {
    'flex-start': 'start',
    'center': 'center',
    'flex-end': 'end',
    'stretch': 'stretch',
  };
  return (map[value || ''] || undefined) as ReturnType<typeof mapAlignReverse>;
}

function inferLayout(
  styles: Record<string, string> | undefined,
  hasChildren: boolean
): DetectedComponentEnhanced['layout'] | undefined {
  if (!hasChildren) return undefined;

  const display = styles?.display;
  const flexDir = styles?.flexDirection;

  if (display === 'grid') {
    return {
      type: 'grid' as const,
      columns: styles?.gridTemplateColumns,
      gap: styles?.gap,
      justify: mapJustifyReverse(styles?.justifyContent),
      align: mapAlignReverse(styles?.alignItems),
    };
  }

  // Default to flex for containers
  return {
    type: 'flex' as const,
    direction: (flexDir === 'row' ? 'row' : 'column') as 'row' | 'column',
    gap: styles?.gap,
    justify: mapJustifyReverse(styles?.justifyContent),
    align: mapAlignReverse(styles?.alignItems),
    wrap: styles?.flexWrap === 'wrap',
  };
}

// ============================================================================
// BOUNDS ESTIMATION
// ============================================================================

interface BoundsContext {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Estimate bounds for a child based on parent bounds and sibling layout.
 * This is an approximation — the component-to-code converter uses flex/grid
 * layout so exact bounds are for the critic's spatial reference, not positioning.
 */
function estimateChildBounds(
  parentBounds: BoundsContext,
  siblingIndex: number,
  siblingCount: number,
  direction: 'row' | 'column'
): BoundsContext {
  if (siblingCount === 0) return parentBounds;

  if (direction === 'row') {
    const childWidth = parentBounds.width / siblingCount;
    return {
      top: parentBounds.top,
      left: parentBounds.left + childWidth * siblingIndex,
      width: childWidth,
      height: parentBounds.height,
    };
  }

  // column
  const childHeight = parentBounds.height / siblingCount;
  return {
    top: parentBounds.top + childHeight * siblingIndex,
    left: parentBounds.left,
    width: parentBounds.width,
    height: childHeight,
  };
}

// ============================================================================
// TYPE MAPPING
// ============================================================================

/** Map HTML element types to semantic component types */
function mapElementType(type: string): string {
  const typeMap: Record<string, string> = {
    div: 'container',
    section: 'content-section',
    nav: 'navigation',
    header: 'header',
    footer: 'footer',
    main: 'container',
    aside: 'sidebar',
    article: 'content-section',
    form: 'form',
    ul: 'list',
    ol: 'list',
    li: 'list',
    table: 'table',
  };
  // Keep specific types as-is (button, p, h1, img, svg, span, input, etc.)
  return typeMap[type] || type;
}

// ============================================================================
// CONVERTER
// ============================================================================

/**
 * Convert a Surveyor dom_tree into a flat DetectedComponentEnhanced array.
 */
export function domTreeToComponents(
  domTree: DomTreeNode,
  _canvas?: { width: number; height: number; background?: string }
): ConversionResult {
  const components: DetectedComponentEnhanced[] = [];
  const warnings: string[] = [];
  const usedIds = new Set<string>();

  function generateId(node: DomTreeNode, depth: number, siblingIndex: number): string {
    // Use node's own ID if available and unique
    if (node.id && !usedIds.has(node.id)) {
      usedIds.add(node.id);
      return node.id;
    }
    // Generate deterministic ID
    const generated = `node-${depth}-${siblingIndex}`;
    if (usedIds.has(generated)) {
      const fallback = `node-${depth}-${siblingIndex}-${usedIds.size}`;
      usedIds.add(fallback);
      return fallback;
    }
    usedIds.add(generated);
    return generated;
  }

  function walkTree(
    node: DomTreeNode,
    parentId: string | undefined,
    depth: number,
    siblingIndex: number,
    parentBounds: BoundsContext,
    parentDirection: 'row' | 'column'
  ): string {
    const id = generateId(node, depth, siblingIndex);
    const nodeType = typeof node.type === 'string' ? node.type : 'div';
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const styles = node.styles as Record<string, string> | undefined;

    // Determine bounds
    let bounds: BoundsContext;
    if (node.extractionBounds) {
      bounds = { ...node.extractionBounds };
    } else if (!parentId) {
      // Root node
      bounds = { top: 0, left: 0, width: 100, height: 100 };
    } else {
      // Parent already subdivides bounds before calling walkTree, so each
      // child occupies its full allocated slot (1 child per slot).
      bounds = estimateChildBounds(
        parentBounds,
        siblingIndex,
        1,
        parentDirection
      );
    }

    // Map style
    const style = mapStyles(styles);

    // Map content
    const content: DetectedComponentEnhanced['content'] = {};
    if (typeof node.text === 'string' && node.text.trim()) {
      content.text = node.text;
    }
    if (node.iconSvgPath) {
      content.iconSvgPath = node.iconSvgPath as string;
      content.hasIcon = true;
    }
    if (nodeType === 'img') {
      content.hasImage = true;
      if (typeof node.src === 'string') {
        content.imageDescription = node.src as string;
      }
    }

    // Determine role
    const role = hasChildren ? 'container' : 'leaf';

    // Infer layout for containers
    const layout = inferLayout(styles, hasChildren);

    // Determine child layout direction for bounds estimation
    const childDirection: 'row' | 'column' =
      styles?.flexDirection === 'row' ? 'row' : 'column';

    // Process children
    const childIds: string[] = [];
    if (hasChildren) {
      const childCount = node.children!.length;
      node.children!.forEach((child, childIndex) => {
        // Re-estimate with correct sibling count
        const childBounds = estimateChildBounds(
          bounds,
          childIndex,
          childCount,
          childDirection
        );

        const childId = walkTree(
          child,
          id,
          depth + 1,
          childIndex,
          childBounds,
          childDirection
        );
        childIds.push(childId);
      });
    }

    // Build component
    const component: DetectedComponentEnhanced = {
      id,
      type: mapElementType(nodeType),
      bounds: {
        top: Math.round(bounds.top * 100) / 100,
        left: Math.round(bounds.left * 100) / 100,
        width: Math.round(bounds.width * 100) / 100,
        height: Math.round(bounds.height * 100) / 100,
      },
      style,
      content: Object.keys(content).length > 0 ? content : undefined,
      role,
      layout,
      parentId,
      children: childIds.length > 0 ? childIds : undefined,
      confidence: 0.7,
      zIndex: styles?.zIndex ? parseInt(styles.zIndex, 10) : undefined,
    };

    components.push(component);
    return id;
  }

  try {
    walkTree(domTree, undefined, 0, 0, { top: 0, left: 0, width: 100, height: 100 }, 'column');
  } catch (error) {
    warnings.push(
      `dom_tree conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (components.length === 0) {
    warnings.push('dom_tree produced no components');
  }

  return { components, warnings };
}
