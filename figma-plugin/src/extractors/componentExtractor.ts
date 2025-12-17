/**
 * Extract component structure from Figma nodes
 */

import type { ExtractedComponent, ExtractedEffect } from '../types/figma-data';

type ComponentType = ExtractedComponent['type'];

function inferComponentType(node: SceneNode): ComponentType {
  const name = node.name.toLowerCase();

  // Check name for common patterns
  if (name.includes('header') || name.includes('navbar') || name.includes('topbar')) {
    return 'header';
  }
  if (name.includes('sidebar') || name.includes('sidenav') || name.includes('drawer')) {
    return 'sidebar';
  }
  if (name.includes('footer')) {
    return 'footer';
  }
  if (name.includes('hero') || name.includes('banner') || name.includes('jumbotron')) {
    return 'hero';
  }
  if (name.includes('card') || name.includes('tile') || name.includes('item')) {
    return 'card';
  }
  if (name.includes('nav') || name.includes('menu') || name.includes('tabs')) {
    return 'navigation';
  }
  if (name.includes('list') || name.includes('table') || name.includes('grid')) {
    return 'list';
  }

  // Check position for layout inference (only for frames)
  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const parent = node.parent;
    if (parent && 'children' in parent) {
      const siblings = parent.children;
      const nodeIndex = siblings.indexOf(node);

      // First child at top might be header
      if (nodeIndex === 0 && 'height' in node && node.height < 100) {
        return 'header';
      }
      // Last child might be footer
      if (nodeIndex === siblings.length - 1 && 'height' in node && node.height < 150) {
        return 'footer';
      }
    }

    // Check dimensions
    if ('width' in node && 'height' in node) {
      // Narrow and tall = sidebar
      if (node.width < 300 && node.height > 400) {
        return 'sidebar';
      }
      // Wide and short = header or footer
      if (node.width > node.height * 3 && node.height < 100) {
        return 'header';
      }
      // Large prominent section = hero
      if (node.height > 300 && node.width > 600) {
        return 'hero';
      }
      // Square-ish small = card
      if (node.width < 400 && node.height < 400 && Math.abs(node.width - node.height) < 200) {
        return 'card';
      }
    }
  }

  return 'unknown';
}

function processNode(node: SceneNode, depth: number = 0): ExtractedComponent {
  const type = inferComponentType(node);

  const bounds = {
    x: 'x' in node ? node.x : 0,
    y: 'y' in node ? node.y : 0,
    width: 'width' in node ? node.width : 0,
    height: 'height' in node ? node.height : 0,
  };

  const properties: Record<string, unknown> = {
    nodeType: node.type,
  };

  // Extract additional properties based on node type
  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const frame = node as FrameNode;
    properties.layoutMode = frame.layoutMode;
    properties.primaryAxisAlignItems = frame.primaryAxisAlignItems;
    properties.counterAxisAlignItems = frame.counterAxisAlignItems;
    properties.cornerRadius = frame.cornerRadius;
    properties.clipsContent = frame.clipsContent;
  }

  // Process children (limit depth to avoid huge trees)
  const children: ExtractedComponent[] = [];
  if ('children' in node && depth < 3) {
    for (const child of node.children) {
      children.push(processNode(child, depth + 1));
    }
  }

  return {
    id: node.id,
    name: node.name,
    type,
    bounds,
    children,
    properties,
  };
}

export function extractComponents(nodes: readonly SceneNode[]): ExtractedComponent[] {
  const components: ExtractedComponent[] = [];

  for (const node of nodes) {
    components.push(processNode(node));
  }

  return components;
}

export function extractEffects(nodes: readonly SceneNode[]): ExtractedEffect[] {
  const effects: ExtractedEffect[] = [];
  const seenEffects = new Set<string>();

  function processNode(node: SceneNode): void {
    if ('effects' in node && Array.isArray(node.effects)) {
      for (const effect of node.effects) {
        if (!effect.visible) continue;

        const key = `${effect.type}-${JSON.stringify(effect)}`;
        if (seenEffects.has(key)) continue;
        seenEffects.add(key);

        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          effects.push({
            type: effect.type,
            radius: effect.radius,
            color: effect.color,
            offset: effect.offset,
            spread: effect.spread,
          });
        } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
          effects.push({
            type: effect.type,
            radius: effect.radius,
          });
        }
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        processNode(child);
      }
    }
  }

  for (const node of nodes) {
    processNode(node);
  }

  return effects;
}

export function extractCornerRadius(nodes: readonly SceneNode[]): number {
  const radii: number[] = [];

  function processNode(node: SceneNode): void {
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
      radii.push(node.cornerRadius);
    }

    if ('children' in node) {
      for (const child of node.children) {
        processNode(child);
      }
    }
  }

  for (const node of nodes) {
    processNode(node);
  }

  if (radii.length === 0) return 8; // Default

  // Return most common radius
  const counts = new Map<number, number>();
  for (const r of radii) {
    counts.set(r, (counts.get(r) || 0) + 1);
  }

  let maxCount = 0;
  let mostCommon = 8;
  for (const [radius, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = radius;
    }
  }

  return mostCommon;
}

export function inferEffectsSettings(
  effects: ExtractedEffect[],
  cornerRadius: number
): {
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadows: 'none' | 'subtle' | 'medium' | 'strong';
  blur: 'none' | 'subtle' | 'medium' | 'strong';
} {
  // Border radius
  const borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' =
    cornerRadius <= 0
      ? 'none'
      : cornerRadius <= 4
        ? 'sm'
        : cornerRadius <= 8
          ? 'md'
          : cornerRadius <= 12
            ? 'lg'
            : cornerRadius <= 24
              ? 'xl'
              : 'full';

  // Shadows
  const shadowEffects = effects.filter(
    (e) => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW'
  );
  const maxShadowRadius =
    shadowEffects.length > 0 ? Math.max(...shadowEffects.map((e) => e.radius)) : 0;

  const shadows: 'none' | 'subtle' | 'medium' | 'strong' =
    maxShadowRadius <= 0
      ? 'none'
      : maxShadowRadius <= 4
        ? 'subtle'
        : maxShadowRadius <= 16
          ? 'medium'
          : 'strong';

  // Blur
  const blurEffects = effects.filter(
    (e) => e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR'
  );
  const maxBlurRadius = blurEffects.length > 0 ? Math.max(...blurEffects.map((e) => e.radius)) : 0;

  const blur: 'none' | 'subtle' | 'medium' | 'strong' =
    maxBlurRadius <= 0
      ? 'none'
      : maxBlurRadius <= 8
        ? 'subtle'
        : maxBlurRadius <= 20
          ? 'medium'
          : 'strong';

  return { borderRadius, shadows, blur };
}

export function inferLayoutStructure(components: ExtractedComponent[]): {
  hasHeader: boolean;
  hasSidebar: boolean;
  hasFooter: boolean;
  sidebarPosition: 'left' | 'right';
  type: 'single-page' | 'multi-page' | 'dashboard';
} {
  const flatComponents = flattenComponents(components);

  const hasHeader = flatComponents.some((c) => c.type === 'header');
  const hasSidebar = flatComponents.some((c) => c.type === 'sidebar');
  const hasFooter = flatComponents.some((c) => c.type === 'footer');

  // Determine sidebar position
  const sidebar = flatComponents.find((c) => c.type === 'sidebar');
  const sidebarPosition: 'left' | 'right' = sidebar && sidebar.bounds.x > 200 ? 'right' : 'left';

  // Determine layout type
  let type: 'single-page' | 'multi-page' | 'dashboard' = 'single-page';
  if (hasSidebar) {
    type = 'dashboard';
  } else if (flatComponents.filter((c) => c.type === 'navigation').length > 1) {
    type = 'multi-page';
  }

  return { hasHeader, hasSidebar, hasFooter, sidebarPosition, type };
}

function flattenComponents(components: ExtractedComponent[]): ExtractedComponent[] {
  const result: ExtractedComponent[] = [];

  function flatten(comp: ExtractedComponent): void {
    result.push(comp);
    for (const child of comp.children) {
      flatten(child);
    }
  }

  for (const comp of components) {
    flatten(comp);
  }

  return result;
}
