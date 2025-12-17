/**
 * Design Linter
 *
 * Checks design consistency and provides actionable suggestions.
 * Rules cover: colors, typography, spacing, border radius, shadows.
 */

import type {
  LayoutDesign,
  ColorSettings,
  TypographySettings,
  SpacingSettings,
  EffectsSettings,
} from '@/types/layoutDesign';

// ============================================================================
// LINT TYPES
// ============================================================================

export type LintSeverity = 'error' | 'warning' | 'info';

export type LintCategory = 'colors' | 'typography' | 'spacing' | 'effects' | 'accessibility';

export interface LintIssue {
  id: string;
  severity: LintSeverity;
  category: LintCategory;
  message: string;
  details?: string;
  suggestion?: string;
  fix?: () => Partial<LayoutDesign>;
  autoFixable: boolean;
}

export interface LintResult {
  issues: LintIssue[];
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Parse hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance for WCAG contrast
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors are similar (within threshold)
 */
function areColorsSimilar(color1: string, color2: string, threshold = 30): boolean {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return false;

  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2)
  );

  return distance < threshold;
}

// ============================================================================
// LINT RULES
// ============================================================================

/**
 * Check color accessibility (WCAG contrast)
 */
function checkColorAccessibility(colors: ColorSettings): LintIssue[] {
  const issues: LintIssue[] = [];

  // Text on background should have 4.5:1 contrast (WCAG AA)
  const textBgContrast = getContrastRatio(colors.text, colors.background);
  if (textBgContrast < 4.5) {
    issues.push({
      id: 'color-contrast-text-bg',
      severity: 'error',
      category: 'accessibility',
      message: 'Text color has insufficient contrast with background',
      details: `Contrast ratio: ${textBgContrast.toFixed(2)}:1 (minimum 4.5:1 required)`,
      suggestion: 'Darken text color or lighten background',
      autoFixable: false,
    });
  }

  // Muted text on background (3:1 minimum for large text)
  if (colors.textMuted) {
    const mutedBgContrast = getContrastRatio(colors.textMuted, colors.background);
    if (mutedBgContrast < 3) {
      issues.push({
        id: 'color-contrast-muted-bg',
        severity: 'warning',
        category: 'accessibility',
        message: 'Muted text may be hard to read',
        details: `Contrast ratio: ${mutedBgContrast.toFixed(2)}:1 (minimum 3:1 recommended)`,
        suggestion: 'Increase contrast for muted text',
        autoFixable: false,
      });
    }
  }

  // Primary on background (interactive elements)
  const primaryBgContrast = getContrastRatio(colors.primary, colors.background);
  if (primaryBgContrast < 3) {
    issues.push({
      id: 'color-contrast-primary-bg',
      severity: 'warning',
      category: 'accessibility',
      message: 'Primary color may not be visible enough on background',
      details: `Contrast ratio: ${primaryBgContrast.toFixed(2)}:1`,
      suggestion: 'Consider a darker or more saturated primary color',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Check color palette consistency
 */
function checkColorConsistency(colors: ColorSettings): LintIssue[] {
  const issues: LintIssue[] = [];

  // Check if secondary and accent are too similar to primary
  if (colors.secondary && areColorsSimilar(colors.primary, colors.secondary, 50)) {
    issues.push({
      id: 'color-similar-primary-secondary',
      severity: 'info',
      category: 'colors',
      message: 'Primary and secondary colors are very similar',
      details: 'Consider using more distinct colors for visual hierarchy',
      autoFixable: false,
    });
  }

  // Check if surface is distinct from background
  if (colors.surface && areColorsSimilar(colors.background, colors.surface, 10)) {
    issues.push({
      id: 'color-similar-bg-surface',
      severity: 'info',
      category: 'colors',
      message: 'Surface and background colors are nearly identical',
      details: 'Cards and panels may not stand out from the page',
      suggestion: 'Add slight color difference for depth',
      autoFixable: false,
    });
  }

  // Check for status color conflicts
  if (colors.error && colors.success && areColorsSimilar(colors.error, colors.success, 100)) {
    issues.push({
      id: 'color-status-conflict',
      severity: 'error',
      category: 'colors',
      message: 'Error and success colors are too similar',
      details: 'This could confuse users about the state of actions',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Check typography consistency
 */
function checkTypography(typography: TypographySettings): LintIssue[] {
  const issues: LintIssue[] = [];

  // Check if heading font is specified when different from body
  if (!typography.headingFont || typography.headingFont === typography.fontFamily) {
    // This is fine, just informational
  }

  // Check for system font fallbacks
  if (
    typography.fontFamily &&
    !typography.fontFamily.includes('system') &&
    !typography.fontFamily.includes('sans-serif')
  ) {
    issues.push({
      id: 'typography-no-fallback',
      severity: 'info',
      category: 'typography',
      message: 'Font stack may not have system fallbacks',
      suggestion: 'Add system-ui, sans-serif as fallback fonts',
      autoFixable: false,
    });
  }

  // Check line height for readability
  if (typography.lineHeight === 'tight') {
    issues.push({
      id: 'typography-tight-lineheight',
      severity: 'warning',
      category: 'typography',
      message: 'Tight line height may affect readability',
      details: 'Line height of 1.25 can make text harder to read',
      suggestion: 'Consider using normal (1.5) or relaxed (1.75) line height',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Check spacing consistency
 */
function checkSpacing(spacing: SpacingSettings): LintIssue[] {
  const issues: LintIssue[] = [];

  // Validate spacing density matches component gap
  const densityGapMap: Record<string, string[]> = {
    compact: ['sm'],
    normal: ['sm', 'md'],
    relaxed: ['md', 'lg'],
  };

  const expectedGaps = densityGapMap[spacing.density] || ['md'];
  if (!expectedGaps.includes(spacing.componentGap)) {
    issues.push({
      id: 'spacing-density-gap-mismatch',
      severity: 'info',
      category: 'spacing',
      message: 'Component gap may not match spacing density',
      details: `Density is "${spacing.density}" but gap is "${spacing.componentGap}"`,
      suggestion: `Consider using ${expectedGaps.join(' or ')} gap for ${spacing.density} density`,
      autoFixable: false,
    });
  }

  // Check container width and section padding relationship
  if (spacing.containerWidth === 'full' && spacing.sectionPadding === 'sm') {
    issues.push({
      id: 'spacing-full-width-small-padding',
      severity: 'warning',
      category: 'spacing',
      message: 'Full-width container with small padding',
      details: 'Content may appear too close to screen edges',
      suggestion: 'Use larger section padding with full-width containers',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Check effects consistency
 */
function checkEffects(effects: EffectsSettings): LintIssue[] {
  const issues: LintIssue[] = [];

  // Check for shadow without border radius
  if (effects.shadows !== 'none' && effects.borderRadius === 'none') {
    issues.push({
      id: 'effects-shadow-no-radius',
      severity: 'info',
      category: 'effects',
      message: 'Shadows on sharp corners can look dated',
      suggestion: 'Consider adding slight border radius with shadows',
      autoFixable: false,
    });
  }

  // Check for too many effects combined
  const activeEffects = [
    effects.shadows !== 'none',
    effects.blur !== 'none',
    effects.gradients,
    effects.animations !== 'none',
  ].filter(Boolean).length;

  if (activeEffects >= 4) {
    issues.push({
      id: 'effects-too-many',
      severity: 'warning',
      category: 'effects',
      message: 'Many effects enabled may impact performance',
      details: 'Shadows, blur, gradients, and animations are all active',
      suggestion: 'Consider reducing effects for better performance',
      autoFixable: false,
    });
  }

  // Check for playful animations in professional context
  if (effects.animations === 'playful') {
    issues.push({
      id: 'effects-playful-animations',
      severity: 'info',
      category: 'effects',
      message: 'Playful animations may not suit all contexts',
      details: 'Consider if playful animations match your brand',
      autoFixable: false,
    });
  }

  return issues;
}

// ============================================================================
// MAIN LINTER
// ============================================================================

/**
 * Run all lint checks on a design
 */
export function lintDesign(design: Partial<LayoutDesign>): LintResult {
  const issues: LintIssue[] = [];

  const globalStyles = design.globalStyles;
  if (!globalStyles) {
    return {
      issues: [
        {
          id: 'no-global-styles',
          severity: 'error',
          category: 'colors',
          message: 'Design has no global styles defined',
          autoFixable: false,
        },
      ],
      score: 0,
      grade: 'F',
      summary: { errors: 1, warnings: 0, info: 0 },
    };
  }

  // Run all checks
  if (globalStyles.colors) {
    issues.push(...checkColorAccessibility(globalStyles.colors));
    issues.push(...checkColorConsistency(globalStyles.colors));
  }

  if (globalStyles.typography) {
    issues.push(...checkTypography(globalStyles.typography));
  }

  if (globalStyles.spacing) {
    issues.push(...checkSpacing(globalStyles.spacing));
  }

  if (globalStyles.effects) {
    issues.push(...checkEffects(globalStyles.effects));
  }

  // Calculate score
  const summary = {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  // Score: start at 100, deduct for issues
  // Errors: -15, Warnings: -5, Info: -1
  const score = Math.max(0, 100 - summary.errors * 15 - summary.warnings * 5 - summary.info * 1);

  // Grade based on score
  const grade: LintResult['grade'] =
    score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return {
    issues,
    score,
    grade,
    summary,
  };
}

/**
 * Get issues by category
 */
export function getIssuesByCategory(result: LintResult): Record<LintCategory, LintIssue[]> {
  const grouped: Record<LintCategory, LintIssue[]> = {
    colors: [],
    typography: [],
    spacing: [],
    effects: [],
    accessibility: [],
  };

  for (const issue of result.issues) {
    grouped[issue.category].push(issue);
  }

  return grouped;
}

/**
 * Get severity icon/color for display
 */
export function getSeverityInfo(severity: LintSeverity): {
  icon: string;
  color: string;
  bgColor: string;
} {
  switch (severity) {
    case 'error':
      return { icon: '✕', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    case 'warning':
      return { icon: '⚠', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    case 'info':
      return { icon: 'ℹ', color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
  }
}

/**
 * Get grade color for display
 */
export function getGradeColor(grade: LintResult['grade']): string {
  switch (grade) {
    case 'A':
      return 'text-green-400';
    case 'B':
      return 'text-lime-400';
    case 'C':
      return 'text-yellow-400';
    case 'D':
      return 'text-orange-400';
    case 'F':
      return 'text-red-400';
  }
}
