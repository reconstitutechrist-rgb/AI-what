/**
 * Extract spacing and layout from Figma nodes
 */

import type { ExtractedSpacing } from '../types/figma-data';

interface SpacingValues {
  itemSpacings: number[];
  paddings: { top: number; right: number; bottom: number; left: number }[];
  gaps: number[];
}

function processNode(node: SceneNode, values: SpacingValues): void {
  // Extract auto-layout spacing
  if (
    (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') &&
    'layoutMode' in node &&
    node.layoutMode !== 'NONE'
  ) {
    const frame = node as FrameNode;

    // Item spacing
    if (typeof frame.itemSpacing === 'number') {
      values.itemSpacings.push(frame.itemSpacing);
    }

    // Padding
    values.paddings.push({
      top: frame.paddingTop || 0,
      right: frame.paddingRight || 0,
      bottom: frame.paddingBottom || 0,
      left: frame.paddingLeft || 0,
    });
  }

  // Recurse into children
  if ('children' in node) {
    for (const child of node.children) {
      processNode(child, values);
    }
  }
}

export function extractSpacing(nodes: readonly SceneNode[]): ExtractedSpacing {
  const values: SpacingValues = {
    itemSpacings: [],
    paddings: [],
    gaps: [],
  };

  for (const node of nodes) {
    processNode(node, values);
  }

  // Calculate averages
  const avgItemSpacing =
    values.itemSpacings.length > 0
      ? values.itemSpacings.reduce((a, b) => a + b, 0) / values.itemSpacings.length
      : 16;

  const avgPadding =
    values.paddings.length > 0
      ? {
          top: values.paddings.reduce((sum, p) => sum + p.top, 0) / values.paddings.length,
          right: values.paddings.reduce((sum, p) => sum + p.right, 0) / values.paddings.length,
          bottom: values.paddings.reduce((sum, p) => sum + p.bottom, 0) / values.paddings.length,
          left: values.paddings.reduce((sum, p) => sum + p.left, 0) / values.paddings.length,
        }
      : { top: 16, right: 16, bottom: 16, left: 16 };

  // Determine primary layout mode from root nodes
  let layoutMode: ExtractedSpacing['layoutMode'] = 'NONE';
  for (const node of nodes) {
    if (
      (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') &&
      'layoutMode' in node
    ) {
      layoutMode = node.layoutMode;
      break;
    }
  }

  return {
    itemSpacing: Math.round(avgItemSpacing),
    paddingTop: Math.round(avgPadding.top),
    paddingRight: Math.round(avgPadding.right),
    paddingBottom: Math.round(avgPadding.bottom),
    paddingLeft: Math.round(avgPadding.left),
    layoutMode,
  };
}

export function inferSpacingSettings(spacing: ExtractedSpacing): {
  density: 'compact' | 'normal' | 'relaxed';
  sectionPadding: 'sm' | 'md' | 'lg' | 'xl';
  componentGap: 'sm' | 'md' | 'lg';
} {
  // Density based on item spacing
  const density: 'compact' | 'normal' | 'relaxed' =
    spacing.itemSpacing <= 8 ? 'compact' : spacing.itemSpacing >= 24 ? 'relaxed' : 'normal';

  // Section padding based on average padding
  const avgPadding =
    (spacing.paddingTop + spacing.paddingRight + spacing.paddingBottom + spacing.paddingLeft) / 4;

  const sectionPadding: 'sm' | 'md' | 'lg' | 'xl' =
    avgPadding <= 8 ? 'sm' : avgPadding <= 16 ? 'md' : avgPadding <= 32 ? 'lg' : 'xl';

  // Component gap based on item spacing
  const componentGap: 'sm' | 'md' | 'lg' =
    spacing.itemSpacing <= 8 ? 'sm' : spacing.itemSpacing >= 24 ? 'lg' : 'md';

  return { density, sectionPadding, componentGap };
}
