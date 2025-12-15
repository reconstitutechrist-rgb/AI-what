/**
 * Design Critique Engine
 *
 * Evaluates designs against a comprehensive set of design rules
 * and produces actionable critique reports with scores and fixes.
 */

import type { LayoutDesign } from '@/types/layoutDesign';
import {
  CRITIQUE_RULES,
  getAllPrinciples,
  type CritiqueRule,
  type CritiqueViolation,
  type CritiquePrinciple,
  type CritiqueSeverity,
} from '@/data/designCritiqueRules';

// ============================================================================
// TYPES
// ============================================================================

export interface PrincipleScore {
  score: number;
  issues: string[];
  fixes: string[];
}

export interface QuickFixAction {
  label: string;
  fixes: Array<{ property: string; value: unknown }>;
}

export interface DesignCritique {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  principleScores: Record<CritiquePrinciple, PrincipleScore>;

  priorityFixes: Array<{
    severity: CritiqueSeverity;
    principle: CritiquePrinciple;
    issue: string;
    currentValue?: string;
    suggestedValue?: string;
    propertyPath?: string;
    rationale: string;
  }>;

  strengths: string[];

  quickFixActions: QuickFixAction[];

  summary: string;
}

export interface CritiqueOptions {
  focusAreas?: CritiquePrinciple[];
  severityThreshold?: 'all' | 'major' | 'critical';
  includeStrengths?: boolean;
}

// ============================================================================
// SCORING
// ============================================================================

/**
 * Calculate score based on violations
 */
function calculatePrincipleScore(violations: CritiqueViolation[]): number {
  if (violations.length === 0) return 100;

  let deductions = 0;
  for (const v of violations) {
    switch (v.severity) {
      case 'critical':
        deductions += 25;
        break;
      case 'major':
        deductions += 15;
        break;
      case 'minor':
        deductions += 5;
        break;
    }
  }

  return Math.max(0, 100 - deductions);
}

/**
 * Calculate overall score from principle scores
 */
function calculateOverallScore(principleScores: Record<CritiquePrinciple, PrincipleScore>): number {
  const scores = Object.values(principleScores).map((p) => p.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg);
}

/**
 * Get letter grade from score
 */
function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ============================================================================
// STRENGTHS DETECTION
// ============================================================================

/**
 * Detect design strengths based on what's working well
 */
function detectStrengths(design: Partial<LayoutDesign>): string[] {
  const strengths: string[] = [];

  // Check for good contrast
  const colors = design.globalStyles?.colors;
  if (colors?.text && colors?.background) {
    // If we got here without contrast violations, contrast is good
    strengths.push('Good text contrast for readability');
  }

  // Check for consistent styling
  if (design.basePreferences?.style && design.globalStyles?.effects?.animations) {
    const style = design.basePreferences.style;
    const animations = design.globalStyles.effects.animations;

    if (
      (style === 'professional' && animations === 'subtle') ||
      (style === 'minimalist' && animations === 'subtle') ||
      (style === 'playful' && animations === 'playful')
    ) {
      strengths.push('Animation style matches design personality');
    }
  }

  // Check for complete color palette
  if (colors?.primary && colors?.secondary && colors?.accent) {
    strengths.push('Complete color palette with primary, secondary, and accent');
  }

  // Check for proper typography hierarchy
  const typography = design.globalStyles?.typography;
  if (typography?.headingSize && typography?.bodySize) {
    const sizeOrder = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
    const headingIndex = sizeOrder.indexOf(typography.headingSize);
    const bodyIndex = sizeOrder.indexOf(typography.bodySize);
    if (headingIndex > bodyIndex + 1) {
      strengths.push('Clear typography hierarchy between headings and body');
    }
  }

  // Check for good spacing
  const spacing = design.globalStyles?.spacing;
  if (spacing?.density === 'relaxed' || spacing?.sectionPadding === 'lg') {
    strengths.push('Generous whitespace for comfortable reading');
  }

  // Check for shadows/depth
  const effects = design.globalStyles?.effects;
  if (effects?.shadows === 'medium' || effects?.shadows === 'strong') {
    strengths.push('Good use of shadows for visual depth');
  }

  // Check for hero section
  if (design.components?.hero?.visible && design.components.hero.hasCTA) {
    strengths.push('Hero section with clear call-to-action');
  }

  // Check for complete header
  if (design.components?.header?.visible && design.components.header.hasCTA) {
    strengths.push('Header includes navigation and CTA');
  }

  return strengths;
}

// ============================================================================
// QUICK FIX GENERATION
// ============================================================================

/**
 * Generate quick fix actions from violations
 */
function generateQuickFixes(violations: CritiqueViolation[]): QuickFixAction[] {
  const fixes: QuickFixAction[] = [];

  // Group by type of fix
  const contrastFixes = violations.filter((v) => v.principle === 'contrast');
  const spacingFixes = violations.filter(
    (v) => v.principle === 'whitespace' || v.propertyPath?.includes('spacing')
  );
  const typographyFixes = violations.filter((v) => v.principle === 'typography');

  if (contrastFixes.length > 0) {
    fixes.push({
      label: 'Fix All Contrast Issues',
      fixes: contrastFixes
        .filter((v) => v.propertyPath && v.suggestedValue)
        .map((v) => ({
          property: v.propertyPath!,
          value: v.suggestedValue,
        })),
    });
  }

  if (spacingFixes.length > 0) {
    fixes.push({
      label: 'Improve Spacing',
      fixes: spacingFixes
        .filter((v) => v.propertyPath && v.suggestedValue)
        .map((v) => ({
          property: v.propertyPath!,
          value: v.suggestedValue,
        })),
    });
  }

  if (typographyFixes.length > 0) {
    fixes.push({
      label: 'Fix Typography Issues',
      fixes: typographyFixes
        .filter((v) => v.propertyPath && v.suggestedValue)
        .map((v) => ({
          property: v.propertyPath!,
          value: v.suggestedValue,
        })),
    });
  }

  return fixes;
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate a human-readable summary
 */
function generateSummary(
  score: number,
  grade: string,
  violations: CritiqueViolation[],
  strengths: string[]
): string {
  const criticalCount = violations.filter((v) => v.severity === 'critical').length;
  const majorCount = violations.filter((v) => v.severity === 'major').length;
  const minorCount = violations.filter((v) => v.severity === 'minor').length;

  let summary = `Your design scores ${score}/100 (Grade: ${grade}). `;

  if (criticalCount > 0) {
    summary += `Found ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} that need immediate attention. `;
  }

  if (majorCount > 0) {
    summary += `${majorCount} major issue${majorCount > 1 ? 's' : ''} would significantly improve the design. `;
  }

  if (minorCount > 0) {
    summary += `${minorCount} minor suggestion${minorCount > 1 ? 's' : ''} for polish. `;
  }

  if (violations.length === 0) {
    summary += 'No issues found - excellent work! ';
  }

  if (strengths.length > 0) {
    summary += `Strengths: ${strengths.slice(0, 2).join(', ')}.`;
  }

  return summary;
}

// ============================================================================
// MAIN CRITIQUE FUNCTION
// ============================================================================

/**
 * Critique a design and return comprehensive feedback
 */
export function critiqueDesign(
  design: Partial<LayoutDesign>,
  options: CritiqueOptions = {}
): DesignCritique {
  const { focusAreas, severityThreshold = 'all', includeStrengths = true } = options;

  // Filter rules by focus areas if specified
  let rulesToCheck = CRITIQUE_RULES;
  if (focusAreas && focusAreas.length > 0) {
    rulesToCheck = CRITIQUE_RULES.filter((rule) => focusAreas.includes(rule.principle));
  }

  // Filter by severity threshold
  if (severityThreshold !== 'all') {
    const severityLevels: CritiqueSeverity[] =
      severityThreshold === 'critical' ? ['critical'] : ['critical', 'major'];
    rulesToCheck = rulesToCheck.filter((rule) => severityLevels.includes(rule.severity));
  }

  // Run all rules and collect violations
  const allViolations: CritiqueViolation[] = [];
  for (const rule of rulesToCheck) {
    const violation = rule.check(design);
    if (violation) {
      allViolations.push(violation);
    }
  }

  // Calculate scores per principle
  const principles = getAllPrinciples();
  const principleScores: Record<CritiquePrinciple, PrincipleScore> = {} as Record<
    CritiquePrinciple,
    PrincipleScore
  >;

  for (const principle of principles) {
    const principleViolations = allViolations.filter((v) => v.principle === principle);
    principleScores[principle] = {
      score: calculatePrincipleScore(principleViolations),
      issues: principleViolations.map((v) => v.issue),
      fixes: principleViolations.filter((v) => v.suggestedValue).map((v) => v.suggestedValue!),
    };
  }

  // Calculate overall score
  const overallScore = calculateOverallScore(principleScores);
  const grade = getGrade(overallScore);

  // Sort violations by severity for priority fixes
  const priorityFixes = allViolations
    .sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .map((v) => ({
      severity: v.severity,
      principle: v.principle,
      issue: v.issue,
      currentValue: v.currentValue,
      suggestedValue: v.suggestedValue,
      propertyPath: v.propertyPath,
      rationale: v.rationale,
    }));

  // Detect strengths
  const strengths = includeStrengths ? detectStrengths(design) : [];

  // Generate quick fix actions
  const quickFixActions = generateQuickFixes(allViolations);

  // Generate summary
  const summary = generateSummary(overallScore, grade, allViolations, strengths);

  return {
    overallScore,
    grade,
    principleScores,
    priorityFixes,
    strengths,
    quickFixActions,
    summary,
  };
}

/**
 * Get a quick score without full critique
 */
export function getQuickScore(design: Partial<LayoutDesign>): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  criticalIssues: number;
} {
  const violations: CritiqueViolation[] = [];

  for (const rule of CRITIQUE_RULES) {
    const violation = rule.check(design);
    if (violation) {
      violations.push(violation);
    }
  }

  const principles = getAllPrinciples();
  const principleScores: Record<CritiquePrinciple, PrincipleScore> = {} as Record<
    CritiquePrinciple,
    PrincipleScore
  >;

  for (const principle of principles) {
    const principleViolations = violations.filter((v) => v.principle === principle);
    principleScores[principle] = {
      score: calculatePrincipleScore(principleViolations),
      issues: [],
      fixes: [],
    };
  }

  const score = calculateOverallScore(principleScores);

  return {
    score,
    grade: getGrade(score),
    criticalIssues: violations.filter((v) => v.severity === 'critical').length,
  };
}

/**
 * Format critique for display
 */
export function formatCritiqueReport(critique: DesignCritique): string {
  let report = `# Design Critique Report\n\n`;
  report += `**Score: ${critique.overallScore}/100 (Grade: ${critique.grade})**\n\n`;

  if (critique.priorityFixes.length > 0) {
    report += `## Issues Found\n\n`;

    const criticalFixes = critique.priorityFixes.filter((f) => f.severity === 'critical');
    const majorFixes = critique.priorityFixes.filter((f) => f.severity === 'major');
    const minorFixes = critique.priorityFixes.filter((f) => f.severity === 'minor');

    if (criticalFixes.length > 0) {
      report += `### Critical Issues\n`;
      for (const fix of criticalFixes) {
        report += `- **${fix.issue}**\n`;
        if (fix.suggestedValue) {
          report += `  - Fix: ${fix.suggestedValue}\n`;
        }
        report += `  - Why: ${fix.rationale}\n`;
      }
      report += `\n`;
    }

    if (majorFixes.length > 0) {
      report += `### Major Issues\n`;
      for (const fix of majorFixes) {
        report += `- ${fix.issue}\n`;
        if (fix.suggestedValue) {
          report += `  - Fix: ${fix.suggestedValue}\n`;
        }
      }
      report += `\n`;
    }

    if (minorFixes.length > 0) {
      report += `### Minor Suggestions\n`;
      for (const fix of minorFixes) {
        report += `- ${fix.issue}\n`;
      }
      report += `\n`;
    }
  }

  if (critique.strengths.length > 0) {
    report += `## Strengths\n\n`;
    for (const strength of critique.strengths) {
      report += `- ${strength}\n`;
    }
    report += `\n`;
  }

  report += `## Scores by Principle\n\n`;
  for (const [principle, data] of Object.entries(critique.principleScores)) {
    const emoji = data.score >= 80 ? '✓' : data.score >= 60 ? '○' : '✗';
    report += `- ${emoji} ${principle}: ${data.score}/100\n`;
  }

  return report;
}
