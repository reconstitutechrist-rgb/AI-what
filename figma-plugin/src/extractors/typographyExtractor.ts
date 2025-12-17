/**
 * Extract typography from Figma nodes
 */

import type { ExtractedTypography } from '../types/figma-data';

interface TypographyCount {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number | 'auto';
  letterSpacing: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  count: number;
}

function processNode(node: SceneNode, typographyMap: Map<string, TypographyCount>): void {
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;

    // Handle mixed fonts - get the first segment
    const fontName =
      typeof textNode.fontName === 'symbol'
        ? { family: 'Inter', style: 'Regular' }
        : textNode.fontName;

    const fontSize = typeof textNode.fontSize === 'symbol' ? 16 : textNode.fontSize;

    const lineHeight =
      typeof textNode.lineHeight === 'symbol'
        ? 'auto'
        : textNode.lineHeight.unit === 'AUTO'
          ? 'auto'
          : textNode.lineHeight.unit === 'PIXELS'
            ? textNode.lineHeight.value
            : (textNode.lineHeight.value / 100) * fontSize;

    const letterSpacing =
      typeof textNode.letterSpacing === 'symbol'
        ? 0
        : textNode.letterSpacing.unit === 'PIXELS'
          ? textNode.letterSpacing.value
          : (textNode.letterSpacing.value / 100) * fontSize;

    const textCase = typeof textNode.textCase === 'symbol' ? 'ORIGINAL' : textNode.textCase;

    // Convert font style to weight
    const fontWeight = styleToWeight(fontName.style);

    const key = `${fontName.family}-${fontWeight}-${fontSize}`;

    const existing = typographyMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      typographyMap.set(key, {
        fontFamily: fontName.family,
        fontWeight,
        fontSize,
        lineHeight,
        letterSpacing,
        textCase,
        count: 1,
      });
    }
  }

  // Recurse into children
  if ('children' in node) {
    for (const child of node.children) {
      processNode(child, typographyMap);
    }
  }
}

function styleToWeight(style: string): number {
  const styleLower = style.toLowerCase();

  if (styleLower.includes('thin') || styleLower.includes('hairline')) return 100;
  if (styleLower.includes('extralight') || styleLower.includes('ultralight')) return 200;
  if (styleLower.includes('light')) return 300;
  if (styleLower.includes('regular') || styleLower.includes('normal')) return 400;
  if (styleLower.includes('medium')) return 500;
  if (styleLower.includes('semibold') || styleLower.includes('demibold')) return 600;
  if (styleLower.includes('bold') && !styleLower.includes('extra') && !styleLower.includes('ultra'))
    return 700;
  if (styleLower.includes('extrabold') || styleLower.includes('ultrabold')) return 800;
  if (styleLower.includes('black') || styleLower.includes('heavy')) return 900;

  return 400;
}

function inferUsage(fontSize: number, fontWeight: number): ExtractedTypography['usage'] {
  // Large and/or bold text is likely a heading
  if (fontSize >= 24 || (fontSize >= 18 && fontWeight >= 600)) {
    return 'heading';
  }
  // Small text is likely caption
  if (fontSize <= 12) {
    return 'caption';
  }
  // Default to body
  return 'body';
}

export function extractTypography(nodes: readonly SceneNode[]): ExtractedTypography[] {
  const typographyMap = new Map<string, TypographyCount>();

  for (const node of nodes) {
    processNode(node, typographyMap);
  }

  // Convert to array with usage inference
  const typography: ExtractedTypography[] = Array.from(typographyMap.values()).map((t) => ({
    fontFamily: t.fontFamily,
    fontWeight: t.fontWeight,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    textCase: t.textCase,
    usage: inferUsage(t.fontSize, t.fontWeight),
    frequency: t.count,
  }));

  // Sort by frequency
  typography.sort((a, b) => b.frequency - a.frequency);

  return typography;
}

export function inferTypographySettings(typography: ExtractedTypography[]): {
  fontFamily: string;
  headingFont: string;
  headingWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  bodyWeight: 'light' | 'normal' | 'medium';
  headingSize: 'sm' | 'md' | 'lg' | 'xl';
  bodySize: 'xs' | 'sm' | 'base';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  letterSpacing: 'tight' | 'normal' | 'wide';
} {
  // Get most common fonts
  const fontCounts = new Map<string, number>();
  for (const t of typography) {
    const count = fontCounts.get(t.fontFamily) || 0;
    fontCounts.set(t.fontFamily, count + t.frequency);
  }

  const sortedFonts = Array.from(fontCounts.entries()).sort((a, b) => b[1] - a[1]);
  const primaryFont = sortedFonts.length > 0 ? sortedFonts[0][0] : 'Inter';

  // Get heading styles
  const headings = typography.filter((t) => t.usage === 'heading');
  const bodies = typography.filter((t) => t.usage === 'body');

  // Heading font (might be different from body)
  const headingFont = headings.length > 0 ? headings[0].fontFamily : primaryFont;

  // Heading weight
  const avgHeadingWeight =
    headings.length > 0
      ? headings.reduce((sum, h) => sum + h.fontWeight, 0) / headings.length
      : 600;

  const headingWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' =
    avgHeadingWeight >= 700
      ? 'bold'
      : avgHeadingWeight >= 600
        ? 'semibold'
        : avgHeadingWeight >= 500
          ? 'medium'
          : avgHeadingWeight >= 400
            ? 'normal'
            : 'light';

  // Body weight
  const avgBodyWeight =
    bodies.length > 0 ? bodies.reduce((sum, b) => sum + b.fontWeight, 0) / bodies.length : 400;

  const bodyWeight: 'light' | 'normal' | 'medium' =
    avgBodyWeight >= 500 ? 'medium' : avgBodyWeight >= 400 ? 'normal' : 'light';

  // Heading size
  const maxHeadingSize = headings.length > 0 ? Math.max(...headings.map((h) => h.fontSize)) : 32;

  const headingSize: 'sm' | 'md' | 'lg' | 'xl' =
    maxHeadingSize >= 48 ? 'xl' : maxHeadingSize >= 36 ? 'lg' : maxHeadingSize >= 24 ? 'md' : 'sm';

  // Body size
  const avgBodySize =
    bodies.length > 0 ? bodies.reduce((sum, b) => sum + b.fontSize, 0) / bodies.length : 16;

  const bodySize: 'xs' | 'sm' | 'base' =
    avgBodySize <= 12 ? 'xs' : avgBodySize <= 14 ? 'sm' : 'base';

  // Line height
  const lineHeights = typography
    .filter((t) => typeof t.lineHeight === 'number')
    .map((t) => (t.lineHeight as number) / t.fontSize);

  const avgLineHeight =
    lineHeights.length > 0 ? lineHeights.reduce((a, b) => a + b, 0) / lineHeights.length : 1.5;

  const lineHeight: 'tight' | 'normal' | 'relaxed' =
    avgLineHeight <= 1.3 ? 'tight' : avgLineHeight >= 1.7 ? 'relaxed' : 'normal';

  // Letter spacing
  const letterSpacings = typography.map((t) => t.letterSpacing / t.fontSize);
  const avgLetterSpacing =
    letterSpacings.length > 0
      ? letterSpacings.reduce((a, b) => a + b, 0) / letterSpacings.length
      : 0;

  const letterSpacing: 'tight' | 'normal' | 'wide' =
    avgLetterSpacing < -0.01 ? 'tight' : avgLetterSpacing > 0.01 ? 'wide' : 'normal';

  return {
    fontFamily: primaryFont,
    headingFont,
    headingWeight,
    bodyWeight,
    headingSize,
    bodySize,
    lineHeight,
    letterSpacing,
  };
}
