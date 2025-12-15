/**
 * Design Analyzer
 *
 * Analyzes a design for issues, inconsistencies, and opportunities.
 * Used for proactive design analysis and design critique mode.
 */

import type { LayoutDesign } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export type IssueSeverity = 'info' | 'warning' | 'critical';

export interface DesignIssue {
  id: string;
  severity: IssueSeverity;
  area: string;
  message: string;
  suggestedFix?: string;
  affectedProperty?: string;
  suggestedValue?: unknown;
}

export interface ScoreBreakdown {
  contrast: number;
  spacing: number;
  hierarchy: number;
  consistency: number;
  accessibility: number;
}

export interface ProactiveAnalysis {
  designScore: number;
  grade?: string; // Letter grade (A, B, C, D, F)
  scoreBreakdown: ScoreBreakdown;
  autoDetectedIssues: DesignIssue[];
  opportunities: string[];
}

export type AnalysisDepth = 'quick' | 'standard' | 'thorough';

export type AnalysisArea =
  | 'contrast'
  | 'spacing'
  | 'hierarchy'
  | 'consistency'
  | 'accessibility'
  | 'color'
  | 'typography';

// ============================================================================
// CONTRAST ANALYSIS
// ============================================================================

/**
 * Calculate relative luminance of a color
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const adjust = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
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
 * Analyze contrast issues in the design
 */
function analyzeContrast(design: Partial<LayoutDesign>): {
  score: number;
  issues: DesignIssue[];
} {
  const issues: DesignIssue[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  const colors = design.globalStyles?.colors;
  if (!colors) {
    return { score: 50, issues: [] };
  }

  // Check text on background
  if (colors.text && colors.background) {
    totalChecks++;
    const ratio = getContrastRatio(colors.text, colors.background);
    if (ratio >= 4.5) {
      passedChecks++;
    } else {
      issues.push({
        id: 'contrast-text-bg',
        severity: ratio < 3 ? 'critical' : 'warning',
        area: 'contrast',
        message: `Text contrast ratio (${ratio.toFixed(2)}:1) is below WCAG AA standard (4.5:1)`,
        suggestedFix: 'Lighten the text color or darken the background',
        affectedProperty: 'globalStyles.colors.text',
      });
    }
  }

  // Check muted text on background
  if (colors.textMuted && colors.background) {
    totalChecks++;
    const ratio = getContrastRatio(colors.textMuted, colors.background);
    if (ratio >= 4.5) {
      passedChecks++;
    } else if (ratio >= 3) {
      passedChecks += 0.5; // Partial credit for large text standard
      issues.push({
        id: 'contrast-muted-bg',
        severity: 'warning',
        area: 'contrast',
        message: `Muted text contrast (${ratio.toFixed(2)}:1) may be hard to read for some users`,
        suggestedFix: 'Consider using a slightly lighter muted text color',
        affectedProperty: 'globalStyles.colors.textMuted',
      });
    } else {
      issues.push({
        id: 'contrast-muted-bg',
        severity: 'critical',
        area: 'contrast',
        message: `Muted text contrast (${ratio.toFixed(2)}:1) fails WCAG standards`,
        suggestedFix: 'Use a lighter color for muted text',
        affectedProperty: 'globalStyles.colors.textMuted',
      });
    }
  }

  // Check text on surface
  if (colors.text && colors.surface) {
    totalChecks++;
    const ratio = getContrastRatio(colors.text, colors.surface);
    if (ratio >= 4.5) {
      passedChecks++;
    } else {
      issues.push({
        id: 'contrast-text-surface',
        severity: ratio < 3 ? 'critical' : 'warning',
        area: 'contrast',
        message: `Text on surface cards has low contrast (${ratio.toFixed(2)}:1)`,
        suggestedFix: 'Adjust surface color or text color for better readability',
        affectedProperty: 'globalStyles.colors.surface',
      });
    }
  }

  // Check primary color accessibility
  if (colors.primary && colors.background) {
    totalChecks++;
    const ratio = getContrastRatio(colors.primary, colors.background);
    if (ratio >= 3) {
      passedChecks++;
    } else {
      issues.push({
        id: 'contrast-primary-bg',
        severity: 'warning',
        area: 'contrast',
        message: `Primary color may not be visible enough against background (${ratio.toFixed(2)}:1)`,
        suggestedFix: 'Choose a more contrasting primary color',
        affectedProperty: 'globalStyles.colors.primary',
      });
    }
  }

  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 50;
  return { score, issues };
}

// ============================================================================
// SPACING ANALYSIS
// ============================================================================

/**
 * Analyze spacing consistency and appropriateness
 */
function analyzeSpacing(design: Partial<LayoutDesign>): {
  score: number;
  issues: DesignIssue[];
} {
  const issues: DesignIssue[] = [];
  let score = 80; // Start with a good score

  const spacing = design.globalStyles?.spacing;
  if (!spacing) {
    return { score: 50, issues: [] };
  }

  // Check for appropriate density
  const density = spacing.density || 'normal';
  const sectionPadding = spacing.sectionPadding || 'lg';
  const componentGap = spacing.componentGap || 'md';

  // Density-padding mismatch
  if (density === 'compact' && sectionPadding === 'xl') {
    score -= 15;
    issues.push({
      id: 'spacing-density-padding-mismatch',
      severity: 'warning',
      area: 'spacing',
      message: 'Compact density with extra large padding creates visual tension',
      suggestedFix: 'Either increase density to normal/relaxed or reduce section padding',
      affectedProperty: 'globalStyles.spacing.sectionPadding',
      suggestedValue: 'md',
    });
  }

  if (density === 'relaxed' && sectionPadding === 'sm') {
    score -= 15;
    issues.push({
      id: 'spacing-density-padding-mismatch',
      severity: 'warning',
      area: 'spacing',
      message: 'Relaxed density with small padding feels inconsistent',
      suggestedFix: 'Increase section padding to match the relaxed density',
      affectedProperty: 'globalStyles.spacing.sectionPadding',
      suggestedValue: 'lg',
    });
  }

  // Gap-padding ratio check
  const paddingScale = ['sm', 'md', 'lg', 'xl'];
  const paddingIndex = paddingScale.indexOf(sectionPadding);
  const gapIndex = paddingScale.indexOf(componentGap);

  if (Math.abs(paddingIndex - gapIndex) > 2) {
    score -= 10;
    issues.push({
      id: 'spacing-gap-padding-ratio',
      severity: 'info',
      area: 'spacing',
      message: 'Large difference between section padding and component gap',
      suggestedFix: 'Consider aligning gap and padding values for visual harmony',
    });
  }

  return { score: Math.max(0, score), issues };
}

// ============================================================================
// HIERARCHY ANALYSIS
// ============================================================================

/**
 * Analyze visual hierarchy
 */
function analyzeHierarchy(design: Partial<LayoutDesign>): {
  score: number;
  issues: DesignIssue[];
} {
  const issues: DesignIssue[] = [];
  let score = 85;

  const typography = design.globalStyles?.typography;
  const effects = design.globalStyles?.effects;

  // Check heading weight
  const headingWeight = typography?.headingWeight || 'semibold';
  const bodyWeight = typography?.bodyWeight || 'normal';

  if (headingWeight === 'light' || headingWeight === 'normal') {
    if (bodyWeight === 'normal' || bodyWeight === 'medium') {
      score -= 15;
      issues.push({
        id: 'hierarchy-heading-weight',
        severity: 'warning',
        area: 'hierarchy',
        message: 'Headings may not stand out enough from body text',
        suggestedFix: 'Use a heavier weight for headings (semibold or bold)',
        affectedProperty: 'globalStyles.typography.headingWeight',
        suggestedValue: 'semibold',
      });
    }
  }

  // Check if shadows help establish hierarchy
  const shadows = effects?.shadows || 'medium';
  if (shadows === 'none') {
    score -= 5;
    issues.push({
      id: 'hierarchy-no-shadows',
      severity: 'info',
      area: 'hierarchy',
      message: 'No shadows may make it harder to distinguish elevated elements',
      suggestedFix: 'Consider adding subtle shadows for depth',
      affectedProperty: 'globalStyles.effects.shadows',
      suggestedValue: 'subtle',
    });
  }

  return { score: Math.max(0, score), issues };
}

// ============================================================================
// CONSISTENCY ANALYSIS
// ============================================================================

/**
 * Analyze design consistency
 */
function analyzeConsistency(design: Partial<LayoutDesign>): {
  score: number;
  issues: DesignIssue[];
} {
  const issues: DesignIssue[] = [];
  let score = 90;

  const effects = design.globalStyles?.effects;
  const components = design.components;

  // Check border radius consistency
  const globalRadius = effects?.borderRadius || 'lg';

  // If cards have a different hover effect that might clash
  const cardHover = components?.cards?.hoverEffect;
  if (cardHover === 'glow' && effects?.shadows === 'none') {
    score -= 10;
    issues.push({
      id: 'consistency-hover-shadow',
      severity: 'info',
      area: 'consistency',
      message: 'Glow hover effect without base shadows may look inconsistent',
      suggestedFix: 'Add subtle base shadows to complement glow effects',
      affectedProperty: 'globalStyles.effects.shadows',
      suggestedValue: 'subtle',
    });
  }

  // Check animation consistency
  const animations = effects?.animations || 'smooth';
  if (animations === 'playful') {
    const style = design.basePreferences?.style;
    if (style === 'professional' || style === 'minimalist') {
      score -= 10;
      issues.push({
        id: 'consistency-animation-style',
        severity: 'warning',
        area: 'consistency',
        message: 'Playful animations may not match the professional/minimalist style',
        suggestedFix: 'Consider using subtle or smooth animations instead',
        affectedProperty: 'globalStyles.effects.animations',
        suggestedValue: 'subtle',
      });
    }
  }

  return { score: Math.max(0, score), issues };
}

// ============================================================================
// ACCESSIBILITY ANALYSIS
// ============================================================================

/**
 * Analyze accessibility concerns
 */
function analyzeAccessibility(design: Partial<LayoutDesign>): {
  score: number;
  issues: DesignIssue[];
} {
  const issues: DesignIssue[] = [];
  let score = 85;

  const effects = design.globalStyles?.effects;
  const typography = design.globalStyles?.typography;

  // Check for excessive animations
  const animations = effects?.animations || 'smooth';
  if (animations === 'playful') {
    score -= 5;
    issues.push({
      id: 'a11y-animations',
      severity: 'info',
      area: 'accessibility',
      message: 'Playful animations may cause issues for users with vestibular disorders',
      suggestedFix: 'Consider respecting prefers-reduced-motion or providing animation toggle',
    });
  }

  // Check font size
  const bodySize = typography?.bodySize || 'base';
  if (bodySize === 'xs') {
    score -= 15;
    issues.push({
      id: 'a11y-font-size',
      severity: 'warning',
      area: 'accessibility',
      message: 'Extra small body text may be difficult to read',
      suggestedFix: 'Use at least small (sm) or base size for body text',
      affectedProperty: 'globalStyles.typography.bodySize',
      suggestedValue: 'sm',
    });
  }

  // Check line height
  const lineHeight = typography?.lineHeight || 'normal';
  if (lineHeight === 'tight') {
    score -= 10;
    issues.push({
      id: 'a11y-line-height',
      severity: 'warning',
      area: 'accessibility',
      message: 'Tight line height reduces readability',
      suggestedFix: 'Use normal or relaxed line height for better readability',
      affectedProperty: 'globalStyles.typography.lineHeight',
      suggestedValue: 'normal',
    });
  }

  return { score: Math.max(0, score), issues };
}

// ============================================================================
// OPPORTUNITIES DETECTION
// ============================================================================

/**
 * Detect design opportunities and suggestions
 */
function detectOpportunities(design: Partial<LayoutDesign>): string[] {
  const opportunities: string[] = [];

  const structure = design.structure;
  const components = design.components;
  const effects = design.globalStyles?.effects;

  // Footer opportunities
  if (structure?.hasFooter && components?.footer) {
    if (!components.footer.showSocial) {
      opportunities.push('Consider adding social links to your footer');
    }
    if (!components.footer.showNewsletter) {
      opportunities.push('A newsletter signup in the footer can help grow your audience');
    }
  }

  // Header opportunities
  if (structure?.hasHeader && components?.header) {
    if (!components.header.hasCTA) {
      opportunities.push('Adding a call-to-action button in the header can improve conversions');
    }
    if (!components.header.hasSearch) {
      opportunities.push('Consider adding search functionality for better navigation');
    }
  }

  // Hero opportunities
  if (components?.hero?.visible) {
    if (!components.hero.hasSubtitle) {
      opportunities.push('A subtitle in your hero section can clarify your value proposition');
    }
    if (!components.hero.hasCTA) {
      opportunities.push('Add a call-to-action button to your hero section');
    }
  }

  // Effect opportunities
  if (!effects?.gradients) {
    opportunities.push('Subtle gradients can add visual interest and depth');
  }

  if (effects?.animations === 'none') {
    opportunities.push('Adding subtle animations can make your design feel more polished');
  }

  return opportunities;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Perform comprehensive design analysis
 */
export function analyzeDesign(
  design: Partial<LayoutDesign>,
  depth: AnalysisDepth = 'standard',
  focusAreas?: AnalysisArea[]
): ProactiveAnalysis {
  const allIssues: DesignIssue[] = [];
  const scores: ScoreBreakdown = {
    contrast: 0,
    spacing: 0,
    hierarchy: 0,
    consistency: 0,
    accessibility: 0,
  };

  // Determine which areas to analyze based on depth and focus
  const analyzeAreas: AnalysisArea[] = focusAreas || [];

  if (!focusAreas) {
    // Default areas based on depth
    if (depth === 'quick') {
      analyzeAreas.push('contrast', 'spacing');
    } else if (depth === 'standard') {
      analyzeAreas.push('contrast', 'spacing', 'hierarchy', 'consistency');
    } else {
      // thorough
      analyzeAreas.push('contrast', 'spacing', 'hierarchy', 'consistency', 'accessibility');
    }
  }

  // Run analyses
  if (analyzeAreas.includes('contrast')) {
    const { score, issues } = analyzeContrast(design);
    scores.contrast = score;
    allIssues.push(...issues);
  } else {
    scores.contrast = 75; // Default when not analyzed
  }

  if (analyzeAreas.includes('spacing')) {
    const { score, issues } = analyzeSpacing(design);
    scores.spacing = score;
    allIssues.push(...issues);
  } else {
    scores.spacing = 75;
  }

  if (analyzeAreas.includes('hierarchy')) {
    const { score, issues } = analyzeHierarchy(design);
    scores.hierarchy = score;
    allIssues.push(...issues);
  } else {
    scores.hierarchy = 75;
  }

  if (analyzeAreas.includes('consistency')) {
    const { score, issues } = analyzeConsistency(design);
    scores.consistency = score;
    allIssues.push(...issues);
  } else {
    scores.consistency = 75;
  }

  if (analyzeAreas.includes('accessibility')) {
    const { score, issues } = analyzeAccessibility(design);
    scores.accessibility = score;
    allIssues.push(...issues);
  } else {
    scores.accessibility = 75;
  }

  // Calculate overall score (weighted average)
  const weights = {
    contrast: 0.25,
    spacing: 0.15,
    hierarchy: 0.2,
    consistency: 0.2,
    accessibility: 0.2,
  };

  const designScore = Math.round(
    scores.contrast * weights.contrast +
      scores.spacing * weights.spacing +
      scores.hierarchy * weights.hierarchy +
      scores.consistency * weights.consistency +
      scores.accessibility * weights.accessibility
  );

  // Detect opportunities
  const opportunities = detectOpportunities(design);

  // Sort issues by severity (critical first)
  const severityOrder: Record<IssueSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    designScore,
    scoreBreakdown: scores,
    autoDetectedIssues: allIssues,
    opportunities,
  };
}

/**
 * Get a letter grade from a numeric score
 */
export function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Format analysis results as a human-readable summary
 */
export function formatAnalysisSummary(analysis: ProactiveAnalysis): string {
  const { designScore, scoreBreakdown, autoDetectedIssues, opportunities } = analysis;
  const grade = getGrade(designScore);

  const criticalIssues = autoDetectedIssues.filter((i) => i.severity === 'critical');
  const warningIssues = autoDetectedIssues.filter((i) => i.severity === 'warning');
  const infoIssues = autoDetectedIssues.filter((i) => i.severity === 'info');

  let summary = `## Design Analysis\n\n`;
  summary += `**Overall Score: ${designScore}/100 (${grade})**\n\n`;

  summary += `### Score Breakdown\n`;
  summary += `- Contrast: ${scoreBreakdown.contrast}/100\n`;
  summary += `- Spacing: ${scoreBreakdown.spacing}/100\n`;
  summary += `- Hierarchy: ${scoreBreakdown.hierarchy}/100\n`;
  summary += `- Consistency: ${scoreBreakdown.consistency}/100\n`;
  summary += `- Accessibility: ${scoreBreakdown.accessibility}/100\n\n`;

  if (criticalIssues.length > 0) {
    summary += `### 🔴 Critical Issues (${criticalIssues.length})\n`;
    criticalIssues.forEach((issue) => {
      summary += `- **${issue.message}**`;
      if (issue.suggestedFix) summary += ` → ${issue.suggestedFix}`;
      summary += '\n';
    });
    summary += '\n';
  }

  if (warningIssues.length > 0) {
    summary += `### 🟡 Warnings (${warningIssues.length})\n`;
    warningIssues.forEach((issue) => {
      summary += `- ${issue.message}`;
      if (issue.suggestedFix) summary += ` → ${issue.suggestedFix}`;
      summary += '\n';
    });
    summary += '\n';
  }

  if (infoIssues.length > 0 && infoIssues.length <= 3) {
    summary += `### ℹ️ Suggestions (${infoIssues.length})\n`;
    infoIssues.forEach((issue) => {
      summary += `- ${issue.message}\n`;
    });
    summary += '\n';
  }

  if (opportunities.length > 0) {
    summary += `### 💡 Opportunities\n`;
    opportunities.slice(0, 3).forEach((opp) => {
      summary += `- ${opp}\n`;
    });
  }

  return summary;
}

export default {
  analyzeDesign,
  getGrade,
  formatAnalysisSummary,
};
