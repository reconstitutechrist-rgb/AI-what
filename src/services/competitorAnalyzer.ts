/**
 * Competitive Website Analyzer
 *
 * Captures and analyzes competitor websites to extract design patterns,
 * colors, typography, and layout information.
 */

import type { LayoutDesign } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export interface CompetitorAnalysis {
  url: string;
  capturedAt: string;
  screenshotBase64?: string;

  extractedDesign: {
    colors: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background: string;
      text: string;
      palette: string[];
    };
    typography: {
      headingFont?: string;
      bodyFont?: string;
      fontScale: string[];
    };
    spacing: {
      density: 'compact' | 'normal' | 'relaxed';
      containerWidth?: string;
    };
    effects: {
      borderRadius: string;
      shadows: string;
      animations: string[];
    };
    patterns: string[];
  };

  comparison?: {
    similarities: string[];
    differences: string[];
    theyDoWell: string[];
    youDoWell: string[];
    suggestions: string[];
  };
}

export interface CaptureOptions {
  viewport?: {
    width: number;
    height: number;
  };
  fullPage?: boolean;
  waitFor?: number;
}

// ============================================================================
// COLOR EXTRACTION
// ============================================================================

/**
 * Extract colors from CSS color value
 */
function normalizeColor(color: string): string | null {
  if (!color) return null;

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Handle hex
  if (color.startsWith('#')) {
    return color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
  }

  return null;
}

/**
 * Determine if a color is likely primary based on usage
 */
function isPrimaryColor(color: string): boolean {
  // Skip near-white and near-black
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Skip grayscale
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
    return false;
  }

  // Skip very light colors
  if (r > 230 && g > 230 && b > 230) return false;

  // Skip very dark colors
  if (r < 30 && g < 30 && b < 30) return false;

  return true;
}

/**
 * Extract dominant colors from computed styles
 */
function extractColorsFromStyles(
  styles: Array<{ property: string; value: string }>
): CompetitorAnalysis['extractedDesign']['colors'] {
  const colorMap = new Map<string, number>();
  let backgroundColor = '#FFFFFF';
  let textColor = '#000000';

  for (const { property, value } of styles) {
    const normalized = normalizeColor(value);
    if (!normalized) continue;

    if (property === 'background-color' || property === 'backgroundColor') {
      backgroundColor = normalized;
    } else if (property === 'color') {
      textColor = normalized;
    }

    const count = colorMap.get(normalized) || 0;
    colorMap.set(normalized, count + 1);
  }

  // Sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  // Find primary and secondary colors
  const primaryColors = sortedColors.filter(isPrimaryColor);
  const primary = primaryColors[0];
  const secondary = primaryColors[1];
  const accent = primaryColors[2];

  return {
    primary,
    secondary,
    accent,
    background: backgroundColor,
    text: textColor,
    palette: sortedColors.slice(0, 10),
  };
}

// ============================================================================
// TYPOGRAPHY EXTRACTION
// ============================================================================

/**
 * Extract typography information from computed styles
 */
function extractTypographyFromStyles(
  styles: Array<{ property: string; value: string }>
): CompetitorAnalysis['extractedDesign']['typography'] {
  const fontFamilies = new Set<string>();
  const fontSizes = new Set<string>();

  for (const { property, value } of styles) {
    if (property === 'font-family' || property === 'fontFamily') {
      const primaryFont = value.split(',')[0].replace(/['"]/g, '').trim();
      if (primaryFont) fontFamilies.add(primaryFont);
    } else if (property === 'font-size' || property === 'fontSize') {
      fontSizes.add(value);
    }
  }

  const fonts = Array.from(fontFamilies);
  return {
    headingFont: fonts[0],
    bodyFont: fonts[1] || fonts[0],
    fontScale: Array.from(fontSizes).sort(),
  };
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

/**
 * Detect common design patterns from extracted data
 */
function detectPatterns(
  colors: CompetitorAnalysis['extractedDesign']['colors'],
  effects: CompetitorAnalysis['extractedDesign']['effects']
): string[] {
  const patterns: string[] = [];

  // Dark mode detection
  const bgHex = colors.background.replace('#', '');
  const bgBrightness =
    (parseInt(bgHex.substring(0, 2), 16) +
      parseInt(bgHex.substring(2, 4), 16) +
      parseInt(bgHex.substring(4, 6), 16)) /
    3;
  if (bgBrightness < 50) {
    patterns.push('dark-mode');
  }

  // Rounded corners
  if (effects.borderRadius.includes('16') || effects.borderRadius.includes('20')) {
    patterns.push('rounded-corners');
  }

  // Shadow usage
  if (effects.shadows !== 'none') {
    patterns.push('elevated-elements');
  }

  // Monochromatic detection
  if (colors.palette.length < 5) {
    patterns.push('monochromatic');
  }

  // Gradient detection
  if (effects.animations.some((a) => a.includes('gradient'))) {
    patterns.push('gradient-accents');
  }

  return patterns;
}

// ============================================================================
// COMPARISON
// ============================================================================

/**
 * Compare extracted design with current design
 */
export function compareDesigns(
  extracted: CompetitorAnalysis['extractedDesign'],
  current: Partial<LayoutDesign>
): CompetitorAnalysis['comparison'] {
  const similarities: string[] = [];
  const differences: string[] = [];
  const theyDoWell: string[] = [];
  const youDoWell: string[] = [];
  const suggestions: string[] = [];

  const currentColors = current.globalStyles?.colors;

  // Compare color schemes
  if (currentColors?.primary === extracted.colors.primary) {
    similarities.push('Same primary color');
  } else if (extracted.colors.primary) {
    differences.push(
      `They use ${extracted.colors.primary} as primary, you use ${currentColors?.primary || 'default'}`
    );
    suggestions.push(`Consider trying their primary color: ${extracted.colors.primary}`);
  }

  // Compare dark/light mode
  const theirIsDark = extracted.patterns.includes('dark-mode');
  const yoursIsDark = current.basePreferences?.colorScheme === 'dark';
  if (theirIsDark && !yoursIsDark) {
    differences.push('They use a dark color scheme');
    suggestions.push('Consider adding dark mode support');
  } else if (!theirIsDark && yoursIsDark) {
    differences.push('They use a light color scheme');
  }

  // Compare border radius
  const theirRadius = extracted.effects.borderRadius;
  const yourRadius = current.globalStyles?.effects?.borderRadius;
  if (theirRadius.includes('16') || theirRadius.includes('20')) {
    if (yourRadius !== 'xl' && yourRadius !== 'lg') {
      theyDoWell.push('Larger border radius creates a modern, friendly feel');
      suggestions.push('Consider increasing border radius for a more modern look');
    }
  }

  // Compare shadow usage
  if (extracted.patterns.includes('elevated-elements')) {
    if (
      current.globalStyles?.effects?.shadows === 'none' ||
      current.globalStyles?.effects?.shadows === 'subtle'
    ) {
      theyDoWell.push('Strategic use of shadows for depth and hierarchy');
      suggestions.push('Add shadows to create visual hierarchy');
    }
  }

  // Typography comparison
  if (extracted.typography.headingFont) {
    const yourFont = current.globalStyles?.typography?.fontFamily;
    if (yourFont !== extracted.typography.headingFont) {
      differences.push(`They use ${extracted.typography.headingFont} font`);
    }
  }

  // Add general positives for your design
  if (current.globalStyles?.effects?.animations !== 'none') {
    youDoWell.push('You have animations enabled for engagement');
  }

  // Check for professional styling
  if (current.basePreferences?.style === 'professional') {
    youDoWell.push('You have a professional design style');
  } else if (current.basePreferences?.style === 'modern') {
    youDoWell.push('You have a modern design style');
  }

  return {
    similarities,
    differences,
    theyDoWell,
    youDoWell,
    suggestions,
  };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze extracted styles from a captured website
 */
export function analyzeExtractedStyles(
  url: string,
  extractedData: {
    styles: Array<{ property: string; value: string }>;
    computedStyles: {
      borderRadius?: string;
      boxShadow?: string;
    };
  },
  currentDesign?: Partial<LayoutDesign>
): CompetitorAnalysis {
  const colors = extractColorsFromStyles(extractedData.styles);
  const typography = extractTypographyFromStyles(extractedData.styles);

  const effects: CompetitorAnalysis['extractedDesign']['effects'] = {
    borderRadius: extractedData.computedStyles.borderRadius || '4px',
    shadows: extractedData.computedStyles.boxShadow || 'none',
    animations: [],
  };

  const patterns = detectPatterns(colors, effects);

  const extractedDesign: CompetitorAnalysis['extractedDesign'] = {
    colors,
    typography,
    spacing: {
      density: 'normal',
    },
    effects,
    patterns,
  };

  const analysis: CompetitorAnalysis = {
    url,
    capturedAt: new Date().toISOString(),
    extractedDesign,
  };

  // Add comparison if current design provided
  if (currentDesign) {
    analysis.comparison = compareDesigns(extractedDesign, currentDesign);
  }

  return analysis;
}

/**
 * Create a summary report of the analysis
 */
export function formatAnalysisReport(analysis: CompetitorAnalysis): string {
  const { extractedDesign, comparison } = analysis;

  let report = `## Competitor Analysis: ${analysis.url}

**Captured:** ${new Date(analysis.capturedAt).toLocaleString()}

### Colors
${extractedDesign.colors.primary ? `- Primary: ${extractedDesign.colors.primary}` : '- Primary: Not detected'}
${extractedDesign.colors.secondary ? `- Secondary: ${extractedDesign.colors.secondary}` : ''}
${extractedDesign.colors.accent ? `- Accent: ${extractedDesign.colors.accent}` : ''}
- Background: ${extractedDesign.colors.background}
- Text: ${extractedDesign.colors.text}
- Palette: ${extractedDesign.colors.palette.slice(0, 5).join(', ')}

### Typography
${extractedDesign.typography.headingFont ? `- Heading Font: ${extractedDesign.typography.headingFont}` : '- Heading Font: System default'}
${extractedDesign.typography.bodyFont ? `- Body Font: ${extractedDesign.typography.bodyFont}` : ''}

### Visual Effects
- Border Radius: ${extractedDesign.effects.borderRadius}
- Shadows: ${extractedDesign.effects.shadows === 'none' ? 'None' : 'Present'}

### Detected Patterns
${extractedDesign.patterns.length > 0 ? extractedDesign.patterns.map((p) => `- ${p}`).join('\n') : '- No specific patterns detected'}`;

  if (comparison) {
    report += `

### Comparison with Your Design

**Similarities:**
${comparison.similarities.length > 0 ? comparison.similarities.map((s) => `- ${s}`).join('\n') : '- No notable similarities'}

**Differences:**
${comparison.differences.length > 0 ? comparison.differences.map((d) => `- ${d}`).join('\n') : '- No notable differences'}

**What They Do Well:**
${comparison.theyDoWell.length > 0 ? comparison.theyDoWell.map((t) => `- ${t}`).join('\n') : '- Analysis pending'}

**What You Do Well:**
${comparison.youDoWell.length > 0 ? comparison.youDoWell.map((y) => `- ${y}`).join('\n') : '- Analysis pending'}

### Suggestions
${comparison.suggestions.length > 0 ? comparison.suggestions.map((s) => `💡 ${s}`).join('\n') : '- No specific suggestions'}`;
  }

  return report;
}
