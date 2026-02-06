/**
 * AI Enhancement Types
 * Proactive analysis, critiques, workflows, variants, and design system generation
 */

import type { LayoutDesign } from './layoutDesignType';

// ============================================================================
// AI ENHANCEMENT TYPES (Proactive Analysis, Critique, Workflows, Variants)
// ============================================================================

/**
 * Severity level for design issues
 */
export type IssueSeverity = 'info' | 'warning' | 'critical';

/**
 * Individual design issue detected by analysis
 */
export interface DesignIssue {
  id: string;
  severity: IssueSeverity;
  area: string;
  message: string;
  suggestedFix?: string;
  affectedProperty?: string;
  suggestedValue?: unknown;
}

/**
 * Score breakdown by design principle
 */
export interface ScoreBreakdown {
  contrast: number;
  spacing: number;
  hierarchy: number;
  consistency: number;
  accessibility: number;
}

/**
 * Proactive design analysis result
 */
export interface ProactiveAnalysis {
  designScore: number;
  grade?: string; // Letter grade (A, B, C, D, F)
  scoreBreakdown: ScoreBreakdown;
  autoDetectedIssues: DesignIssue[];
  opportunities: string[];
}

/**
 * Analysis depth level
 */
export type AnalysisDepth = 'quick' | 'standard' | 'thorough';

/**
 * Areas that can be analyzed
 */
export type DesignAnalysisArea =
  | 'contrast'
  | 'spacing'
  | 'hierarchy'
  | 'consistency'
  | 'accessibility'
  | 'color'
  | 'typography';

/**
 * Design critique principle score
 */
export interface PrincipleScore {
  score: number;
  issues: string[];
  fixes: string[];
}

/**
 * Full design critique result
 */
export interface DesignCritique {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  principleScores: {
    visualHierarchy: PrincipleScore;
    consistency: PrincipleScore;
    contrast: PrincipleScore;
    whitespace: PrincipleScore;
    colorHarmony: PrincipleScore;
    alignment: PrincipleScore;
    typography: PrincipleScore;
    accessibility: PrincipleScore;
  };
  priorityFixes: Array<{
    severity: 'critical' | 'major' | 'minor';
    principle: string;
    issue: string;
    currentValue: string;
    suggestedValue: string;
    propertyPath: string;
    rationale: string;
  }>;
  strengths: string[];
  quickFixActions: Array<{
    label: string;
    fixes: Array<{ property: string; value: unknown }>;
  }>;
}

/**
 * Design variant for A/B comparison
 */
export interface DesignVariant {
  id: string;
  name: string;
  description: string;
  changes: Partial<LayoutDesign>;
  tradeOffs: {
    pros: string[];
    cons: string[];
  };
  bestFor: string[];
  previewDescription: string;
}

/**
 * Design variants comparison result
 */
export interface DesignVariants {
  baseDesign: Partial<LayoutDesign>;
  variants: DesignVariant[];
  comparisonNotes: string;
}

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  focusElements: string[];
  suggestedActions: string[];
  completionCriteria: string[];
  tips: string[];
}

/**
 * Workflow template definition
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  steps: WorkflowStep[];
}

/**
 * Active workflow state
 */
export interface WorkflowState {
  workflowId: string;
  workflowType: string;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  stepNotes: Record<string, string>;
  startedAt: string;
  designSnapshotAtStart: Partial<LayoutDesign>;
}

/**
 * Design system token definition
 */
export interface TokenDefinition {
  value: string | number;
  type: string;
  description?: string;
  category?: string;
}

/**
 * Component specification for design system
 */
export interface ComponentSpec {
  name: string;
  variants: string[];
  defaultProps: Record<string, unknown>;
  tokenUsage: string[];
}

/**
 * Generated design system
 */
export interface GeneratedDesignSystem {
  metadata: {
    name: string;
    version: string;
    generatedAt: string;
    sourceDesignId: string;
  };
  tokens: {
    colors: Record<string, TokenDefinition>;
    typography: Record<string, TokenDefinition>;
    spacing: Record<string, TokenDefinition>;
    borderRadius: Record<string, TokenDefinition>;
    shadows: Record<string, TokenDefinition>;
    animations: Record<string, TokenDefinition>;
  };
  components: Record<string, ComponentSpec>;
  exports: {
    styleDictionary?: string;
    tailwindConfig?: string;
    cssVariables?: string;
    scssVariables?: string;
  };
  documentation?: {
    colorUsage: string;
    typographyScale: string;
    spacingSystem: string;
    componentGuidelines: string;
  };
}

/**
 * Competitor website analysis result
 */
export interface CompetitorAnalysis {
  url: string;
  capturedAt: string;
  screenshotBase64?: string;
  extractedDesign: {
    colors: {
      primary: string;
      secondary?: string;
      accent?: string;
      background: string;
      text: string;
      palette: string[];
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      fontScale: string[];
    };
    spacing: {
      density: 'compact' | 'normal' | 'relaxed';
      containerWidth: string;
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
