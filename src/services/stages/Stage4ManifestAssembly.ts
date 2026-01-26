/**
 * Stage 4: Manifest Assembly
 *
 * PURE TRANSLATOR - No design decisions, no defaults, no assumptions.
 * Takes whatever Gemini returned and converts it to UISpecNode format.
 */

import type { LayoutManifest, UISpecNode, ComponentType } from '@/types/schema';
import type { ColorPalette } from '@/utils/colorExtraction';
import type { Stage1Output, DetectedComponent } from './Stage1ComponentDetection';
import type { Stage2Output, ComponentStyle } from './Stage2StyleExtraction';
import type { Stage3Output } from './Stage3EffectDetection';

export interface Stage4Input {
  stage1: Stage1Output;
  stage2: Stage2Output;
  stage3: Stage3Output;
  extractedColors: ColorPalette;
}

/**
 * Convert CSS property to Tailwind arbitrary value
 * Pure translation - no interpretation
 */
function cssToTailwind(property: string, value: string | number): string | null {
  const val = String(value);

  // Direct mappings for common properties
  const propertyMap: Record<string, (v: string) => string> = {
    fontSize: (v) => `text-[${v}]`,
    lineHeight: (v) => `leading-[${v}]`,
    letterSpacing: (v) => `tracking-[${v}]`,
    fontWeight: (v) => `font-[${v}]`,
    padding: (v) => `p-[${v.replace(/\s+/g, '_')}]`,
    margin: (v) => `m-[${v.replace(/\s+/g, '_')}]`,
    gap: (v) => `gap-[${v}]`,
    borderRadius: (v) => `rounded-[${v}]`,
    borderWidth: (v) => `border-[${v}]`,
    width: (v) => `w-[${v}]`,
    height: (v) => `h-[${v}]`,
    minHeight: (v) => `min-h-[${v}]`,
    maxWidth: (v) => `max-w-[${v}]`,
    opacity: (v) => `opacity-[${v}]`,
  };

  // Handle display/flex/grid
  if (property === 'display') {
    if (val === 'flex') return 'flex';
    if (val === 'grid') return 'grid';
    if (val === 'block') return 'block';
    if (val === 'inline-flex') return 'inline-flex';
    if (val === 'inline') return 'inline';
    return null;
  }

  if (property === 'flexDirection') {
    if (val === 'column') return 'flex-col';
    if (val === 'row') return 'flex-row';
    return null;
  }

  if (property === 'alignItems') {
    if (val === 'center') return 'items-center';
    if (val === 'flex-start' || val === 'start') return 'items-start';
    if (val === 'flex-end' || val === 'end') return 'items-end';
    if (val === 'stretch') return 'items-stretch';
    if (val === 'baseline') return 'items-baseline';
    return null;
  }

  if (property === 'justifyContent') {
    if (val === 'center') return 'justify-center';
    if (val === 'flex-start' || val === 'start') return 'justify-start';
    if (val === 'flex-end' || val === 'end') return 'justify-end';
    if (val === 'space-between') return 'justify-between';
    if (val === 'space-around') return 'justify-around';
    if (val === 'space-evenly') return 'justify-evenly';
    return null;
  }

  if (property === 'textAlign') {
    if (val === 'center') return 'text-center';
    if (val === 'left') return 'text-left';
    if (val === 'right') return 'text-right';
    return null;
  }

  if (property === 'position') {
    if (val === 'relative') return 'relative';
    if (val === 'absolute') return 'absolute';
    if (val === 'fixed') return 'fixed';
    if (val === 'sticky') return 'sticky';
    return null;
  }

  // Use the property map if available
  if (propertyMap[property]) {
    return propertyMap[property](val);
  }

  return null;
}

/**
 * Convert styles to Tailwind classes + customCSS
 * No defaults - only what Gemini provided
 */
function convertStyles(
  styles: ComponentStyle,
  effects: string | undefined
): { tailwindClasses: string; customCSS?: string } {
  const tailwindClasses: string[] = [];
  const customCSSParts: string[] = [];

  for (const [property, value] of Object.entries(styles)) {
    if (value === undefined || value === null) continue;

    const tailwindClass = cssToTailwind(property, value);
    if (tailwindClass) {
      tailwindClasses.push(tailwindClass);
    } else {
      // Properties that can't be converted to Tailwind go to customCSS
      // Convert camelCase to kebab-case
      const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      customCSSParts.push(`${kebabProperty}: ${value};`);
    }
  }

  // Add effects CSS if present
  if (effects) {
    customCSSParts.push(effects);
  }

  return {
    tailwindClasses: tailwindClasses.join(' '),
    customCSS: customCSSParts.length > 0 ? customCSSParts.join(' ') : undefined,
  };
}

/**
 * Determine UISpecNode type from Gemini's description
 * Minimal mapping - default to container
 */
function determineNodeType(component: DetectedComponent): ComponentType {
  const type = component.type.toLowerCase();
  const desc = (component.description + ' ' + component.visualDescription).toLowerCase();

  // Check for specific interactive elements
  if (type.includes('button') || type.includes('btn') || type.includes('cta')) {
    return 'button';
  }
  if (type.includes('input') || type.includes('text-field') || type.includes('search')) {
    return 'input';
  }
  if (
    type.includes('image') ||
    type.includes('img') ||
    type.includes('photo') ||
    type.includes('logo')
  ) {
    return 'image';
  }
  if (type.includes('icon')) {
    return 'icon';
  }
  if (
    type.includes('text') ||
    type.includes('heading') ||
    type.includes('title') ||
    type.includes('paragraph') ||
    type.includes('label') ||
    type.includes('caption')
  ) {
    return 'text';
  }
  if (type.includes('list')) {
    return 'list';
  }

  // Check description for clues
  if (desc.includes('clickable') || desc.includes('click')) {
    return 'button';
  }
  if (desc.includes('text input') || desc.includes('form field')) {
    return 'input';
  }

  // Default to container for anything else
  return 'container';
}

/**
 * Generate attributes based on component type and description
 */
function generateAttributes(
  component: DetectedComponent,
  nodeType: ComponentType
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};

  if (nodeType === 'text') {
    // Use description as placeholder text
    attrs.text = component.description || 'Text';
  }

  if (nodeType === 'input') {
    attrs.placeholder = component.description || 'Enter text...';
    attrs.type = 'text';
  }

  if (nodeType === 'image') {
    const desc = encodeURIComponent(component.description || 'Image');
    attrs.src = `https://placehold.co/400x300/e2e8f0/64748b?text=${desc}`;
    attrs.alt = component.description || 'Image';
  }

  if (nodeType === 'icon') {
    // Try to guess icon from description
    const desc = component.visualDescription.toLowerCase();
    if (desc.includes('menu') || desc.includes('hamburger') || desc.includes('three line')) {
      attrs.src = 'Menu';
    } else if (desc.includes('search') || desc.includes('magnif')) {
      attrs.src = 'Search';
    } else if (desc.includes('user') || desc.includes('person') || desc.includes('avatar')) {
      attrs.src = 'User';
    } else if (desc.includes('arrow right')) {
      attrs.src = 'ArrowRight';
    } else if (desc.includes('arrow left')) {
      attrs.src = 'ArrowLeft';
    } else if (desc.includes('chevron')) {
      attrs.src = 'ChevronRight';
    } else if (desc.includes('close') || desc.includes('x ')) {
      attrs.src = 'X';
    } else if (desc.includes('check')) {
      attrs.src = 'Check';
    } else if (desc.includes('plus') || desc.includes('add')) {
      attrs.src = 'Plus';
    } else if (desc.includes('heart')) {
      attrs.src = 'Heart';
    } else if (desc.includes('star')) {
      attrs.src = 'Star';
    } else if (desc.includes('settings') || desc.includes('gear') || desc.includes('cog')) {
      attrs.src = 'Settings';
    } else {
      attrs.src = 'Circle'; // Default icon
    }
  }

  return attrs;
}

/**
 * Find effects CSS for a specific element
 */
function findEffectsForElement(elementId: string, stage3: Stage3Output): string | undefined {
  // Look for exact match or partial match in element ID
  const matchingEffects = stage3.effects.filter((effect) => {
    const effectId = effect.elementId.toLowerCase();
    const targetId = elementId.toLowerCase();
    return effectId === targetId || effectId.includes(targetId) || targetId.includes(effectId);
  });

  if (matchingEffects.length === 0) return undefined;

  return matchingEffects.map((e) => e.css).join(' ');
}

/**
 * Assemble the complete LayoutManifest
 * Pure translation - no design decisions
 */
export function assembleManifest(input: Stage4Input): LayoutManifest {
  const { stage1, stage2, stage3, extractedColors } = input;

  console.log('[Stage4] Assembling manifest (pure translation mode)...');

  const nodeMap = new Map<string, UISpecNode>();

  // First pass: Create all nodes
  for (const component of stage1.components) {
    const styles = stage2.styles[component.id] || {};
    const effectsCSS = findEffectsForElement(component.id, stage3);
    const nodeType = determineNodeType(component);

    const { tailwindClasses, customCSS } = convertStyles(styles, effectsCSS);

    const node: UISpecNode = {
      id: component.id,
      type: nodeType,
      semanticTag: component.type, // Keep Gemini's original type as semantic tag
      styles: {
        tailwindClasses,
        customCSS,
      },
      attributes: generateAttributes(component, nodeType),
      layout: {
        mode: 'absolute',
        bounds: {
          x: component.bounds.x,
          y: component.bounds.y,
          width: component.bounds.width,
          height: component.bounds.height,
          unit: '%',
        },
      },
      children: [],
    };

    nodeMap.set(component.id, node);
  }

  // Second pass: Build hierarchy based on parentId
  for (const component of stage1.components) {
    if (component.parentId && nodeMap.has(component.parentId)) {
      const parent = nodeMap.get(component.parentId)!;
      const child = nodeMap.get(component.id)!;
      parent.children = parent.children || [];
      parent.children.push(child);
    }
  }

  // Find root nodes (no parent or parent not in our list)
  const rootNodes = stage1.components
    .filter((c) => !c.parentId || !nodeMap.has(c.parentId))
    .map((c) => nodeMap.get(c.id)!)
    .filter(Boolean)
    .sort((a, b) => (a.layout?.bounds?.y || 0) - (b.layout?.bounds?.y || 0));

  // Create root container
  const root: UISpecNode = {
    id: 'root',
    type: 'container',
    semanticTag: 'root',
    styles: {
      tailwindClasses: 'relative min-h-screen w-full',
    },
    attributes: {},
    layout: { mode: 'flow' },
    children: rootNodes,
  };

  const manifest: LayoutManifest = {
    id: `manifest-${Date.now()}`,
    version: '2.0.0',
    root,
    definitions: {},
    detectedFeatures: [...new Set(stage1.components.map((c) => c.type))],
    designSystem: {
      colors: {
        primary: extractedColors.primary,
        secondary: extractedColors.secondary,
        accent: extractedColors.accent,
        background: extractedColors.background,
        surface: extractedColors.surface,
        text: extractedColors.text,
        textMuted: extractedColors.textMuted || extractedColors.text,
        border: extractedColors.border,
      },
      fonts: {
        heading: 'system-ui',
        body: 'system-ui',
      },
    },
  };

  console.log(
    `[Stage4] Assembled manifest with ${rootNodes.length} root elements, ${stage1.components.length} total`
  );

  return manifest;
}
