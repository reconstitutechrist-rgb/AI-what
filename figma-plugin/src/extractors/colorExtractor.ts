/**
 * Extract colors from Figma nodes
 */

import type { ExtractedColor } from '../types/figma-data';

interface ColorCount {
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
  usage: ExtractedColor['usage'];
  count: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function extractPaintColor(paint: Paint, usage: ExtractedColor['usage']): ColorCount | null {
  if (paint.type === 'SOLID' && paint.visible !== false) {
    const { r, g, b } = paint.color;
    const a = paint.opacity ?? 1;
    return {
      hex: rgbToHex(r, g, b),
      rgba: { r, g, b, a },
      usage,
      count: 1,
    };
  }
  return null;
}

function processNode(node: SceneNode, colorMap: Map<string, ColorCount>): void {
  // Extract fill colors
  if ('fills' in node && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      const color = extractPaintColor(fill, node.type === 'TEXT' ? 'text' : 'fill');
      if (color) {
        const key = `${color.hex}-${color.usage}`;
        const existing = colorMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(key, color);
        }
      }
    }
  }

  // Extract stroke colors
  if ('strokes' in node && Array.isArray(node.strokes)) {
    for (const stroke of node.strokes) {
      const color = extractPaintColor(stroke, 'stroke');
      if (color) {
        const key = `${color.hex}-${color.usage}`;
        const existing = colorMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(key, color);
        }
      }
    }
  }

  // Extract background color from frames
  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    if ('backgrounds' in node && Array.isArray(node.backgrounds)) {
      for (const bg of node.backgrounds) {
        const color = extractPaintColor(bg, 'background');
        if (color) {
          const key = `${color.hex}-background`;
          const existing = colorMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(key, color);
          }
        }
      }
    }
  }

  // Recurse into children
  if ('children' in node) {
    for (const child of node.children) {
      processNode(child, colorMap);
    }
  }
}

export function extractColors(nodes: readonly SceneNode[]): ExtractedColor[] {
  const colorMap = new Map<string, ColorCount>();

  for (const node of nodes) {
    processNode(node, colorMap);
  }

  // Convert to array and sort by frequency
  const colors: ExtractedColor[] = Array.from(colorMap.values()).map((c) => ({
    hex: c.hex,
    rgba: c.rgba,
    usage: c.usage,
    frequency: c.count,
  }));

  // Sort by frequency (most used first)
  colors.sort((a, b) => b.frequency - a.frequency);

  return colors;
}

export function inferColorRoles(colors: ExtractedColor[]): {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  surface: string;
  accent: string;
} {
  // Separate by usage
  const fillColors = colors.filter((c) => c.usage === 'fill');
  const textColors = colors.filter((c) => c.usage === 'text');
  const bgColors = colors.filter((c) => c.usage === 'background');
  const strokeColors = colors.filter((c) => c.usage === 'stroke');

  // Helper to get most frequent color or default
  const getMostFrequent = (arr: ExtractedColor[], fallback: string): string => {
    return arr.length > 0 ? arr[0].hex : fallback;
  };

  // Helper to check if color is light
  const isLight = (hex: string): boolean => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  // Infer roles
  const background = getMostFrequent(bgColors, '#FFFFFF');
  const text = getMostFrequent(textColors, isLight(background) ? '#000000' : '#FFFFFF');

  // Primary is the most frequent saturated fill color
  const saturatedFills = fillColors.filter((c) => {
    const { r, g, b } = c.rgba;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return saturation > 0.2; // Has some saturation
  });

  const primary = getMostFrequent(saturatedFills, '#6366F1');

  // Secondary is second most frequent saturated color
  const secondary =
    saturatedFills.length > 1 ? saturatedFills[1].hex : getMostFrequent(fillColors, '#EC4899');

  // Accent is a vibrant color if available
  const accent = saturatedFills.length > 2 ? saturatedFills[2].hex : primary;

  // Border from strokes
  const border = getMostFrequent(strokeColors, '#E5E7EB');

  // Surface is a lighter version of background or second bg color
  const surface =
    bgColors.length > 1 ? bgColors[1].hex : isLight(background) ? '#F9FAFB' : '#1F2937';

  return { primary, secondary, background, text, border, surface, accent };
}
