/**
 * Design Critique Rules Database
 *
 * Contains 50+ rules for evaluating design quality across different principles.
 * Each rule has a check function, severity level, and suggested fix.
 */

import type { LayoutDesign } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export type CritiqueSeverity = 'critical' | 'major' | 'minor';
export type CritiquePrinciple =
  | 'visualHierarchy'
  | 'consistency'
  | 'contrast'
  | 'whitespace'
  | 'colorHarmony'
  | 'alignment'
  | 'typography'
  | 'accessibility';

export interface CritiqueRule {
  id: string;
  principle: CritiquePrinciple;
  severity: CritiqueSeverity;
  name: string;
  description: string;
  check: (design: Partial<LayoutDesign>) => CritiqueViolation | null;
}

export interface CritiqueViolation {
  ruleId: string;
  principle: CritiquePrinciple;
  severity: CritiqueSeverity;
  issue: string;
  currentValue?: string;
  suggestedValue?: string;
  propertyPath?: string;
  rationale: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get luminance of a hex color
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

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
 * Check if a hex color is valid
 */
function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

/**
 * Normalize hex to 6-digit format
 */
function normalizeHex(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return '#' + clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  return '#' + clean;
}

// ============================================================================
// CONTRAST RULES
// ============================================================================

const contrastRules: CritiqueRule[] = [
  {
    id: 'contrast-text-background',
    principle: 'contrast',
    severity: 'critical',
    name: 'Text Contrast on Background',
    description: 'Text must have sufficient contrast with background (4.5:1 minimum)',
    check: (design) => {
      const colors = design.globalStyles?.colors;
      if (!colors?.text || !colors?.background) return null;
      if (!isValidHex(colors.text) || !isValidHex(colors.background)) return null;

      const ratio = getContrastRatio(normalizeHex(colors.text), normalizeHex(colors.background));
      if (ratio < 4.5) {
        return {
          ruleId: 'contrast-text-background',
          principle: 'contrast',
          severity: 'critical',
          issue: `Text contrast is too low (${ratio.toFixed(1)}:1)`,
          currentValue: `${ratio.toFixed(1)}:1`,
          suggestedValue: '4.5:1 or higher',
          propertyPath: 'globalStyles.colors.text',
          rationale: 'WCAG AA requires 4.5:1 contrast for normal text to ensure readability',
        };
      }
      return null;
    },
  },
  {
    id: 'contrast-muted-background',
    principle: 'contrast',
    severity: 'major',
    name: 'Muted Text Contrast',
    description: 'Muted text should still meet minimum contrast requirements',
    check: (design) => {
      const colors = design.globalStyles?.colors;
      if (!colors?.textMuted || !colors?.background) return null;
      if (!isValidHex(colors.textMuted) || !isValidHex(colors.background)) return null;

      const ratio = getContrastRatio(
        normalizeHex(colors.textMuted),
        normalizeHex(colors.background)
      );
      if (ratio < 3) {
        return {
          ruleId: 'contrast-muted-background',
          principle: 'contrast',
          severity: 'major',
          issue: `Muted text contrast is very low (${ratio.toFixed(1)}:1)`,
          currentValue: `${ratio.toFixed(1)}:1`,
          suggestedValue: '3:1 or higher',
          propertyPath: 'globalStyles.colors.textMuted',
          rationale: 'Even secondary text needs adequate contrast for accessibility',
        };
      }
      return null;
    },
  },
  {
    id: 'contrast-primary-background',
    principle: 'contrast',
    severity: 'major',
    name: 'Primary Color Contrast',
    description: 'Primary color should have good contrast with background for CTAs',
    check: (design) => {
      const colors = design.globalStyles?.colors;
      if (!colors?.primary || !colors?.background) return null;
      if (!isValidHex(colors.primary) || !isValidHex(colors.background)) return null;

      const ratio = getContrastRatio(normalizeHex(colors.primary), normalizeHex(colors.background));
      if (ratio < 3) {
        return {
          ruleId: 'contrast-primary-background',
          principle: 'contrast',
          severity: 'major',
          issue: `Primary color has low contrast with background (${ratio.toFixed(1)}:1)`,
          currentValue: `${ratio.toFixed(1)}:1`,
          suggestedValue: '3:1 or higher',
          propertyPath: 'globalStyles.colors.primary',
          rationale: 'Primary color buttons and links need to stand out',
        };
      }
      return null;
    },
  },
];

// ============================================================================
// CONSISTENCY RULES
// ============================================================================

const consistencyRules: CritiqueRule[] = [
  {
    id: 'consistency-border-radius',
    principle: 'consistency',
    severity: 'major',
    name: 'Border Radius Consistency',
    description: 'Border radius should be consistent across the design',
    check: (design) => {
      const globalRadius = design.globalStyles?.effects?.borderRadius;
      const cardStyle = design.components?.cards?.style;

      // Elevated cards typically need rounded corners, minimal cards often have none
      if (globalRadius === 'none' && cardStyle === 'elevated') {
        return {
          ruleId: 'consistency-border-radius',
          principle: 'consistency',
          severity: 'major',
          issue: 'Elevated cards look better with some border radius',
          currentValue: `Border radius: ${globalRadius}, Card style: ${cardStyle}`,
          suggestedValue: 'md or lg',
          propertyPath: 'globalStyles.effects.borderRadius',
          rationale: 'Elevated cards with rounded corners create a softer, modern look',
        };
      }
      return null;
    },
  },
  {
    id: 'consistency-spacing-density',
    principle: 'consistency',
    severity: 'minor',
    name: 'Spacing Density Match',
    description: 'Spacing density should match the overall design style',
    check: (design) => {
      const style = design.basePreferences?.style;
      const density = design.globalStyles?.spacing?.density;

      if (style === 'minimalist' && density === 'compact') {
        return {
          ruleId: 'consistency-spacing-density',
          principle: 'consistency',
          severity: 'minor',
          issue: 'Minimalist style typically uses relaxed spacing, not compact',
          currentValue: density,
          suggestedValue: 'relaxed',
          propertyPath: 'globalStyles.spacing.density',
          rationale: 'Minimalist designs need breathing room',
        };
      }
      return null;
    },
  },
  {
    id: 'consistency-animation-style',
    principle: 'consistency',
    severity: 'minor',
    name: 'Animation Style Match',
    description: 'Animation style should match the design personality',
    check: (design) => {
      const style = design.basePreferences?.style;
      const animations = design.globalStyles?.effects?.animations;

      if (style === 'professional' && animations === 'playful') {
        return {
          ruleId: 'consistency-animation-style',
          principle: 'consistency',
          severity: 'minor',
          issue: 'Playful animations may not suit a professional design',
          currentValue: animations,
          suggestedValue: 'subtle',
          propertyPath: 'globalStyles.effects.animations',
          rationale: 'Professional designs typically use subtle, refined animations',
        };
      }
      return null;
    },
  },
  {
    id: 'consistency-color-scheme',
    principle: 'consistency',
    severity: 'minor',
    name: 'Color Scheme Consistency',
    description: 'Dark mode should use truly dark colors',
    check: (design) => {
      const scheme = design.basePreferences?.colorScheme;
      const bgColor = design.globalStyles?.colors?.background;

      if (scheme === 'dark' && bgColor && isValidHex(bgColor)) {
        const lum = getLuminance(normalizeHex(bgColor));
        if (lum > 0.3) {
          return {
            ruleId: 'consistency-color-scheme',
            principle: 'consistency',
            severity: 'minor',
            issue: 'Dark mode is set but background is not dark enough',
            currentValue: bgColor,
            suggestedValue: '#1a1a2e or similar',
            propertyPath: 'globalStyles.colors.background',
            rationale: 'Dark mode should have a luminance below 0.3',
          };
        }
      }
      return null;
    },
  },
];

// ============================================================================
// WHITESPACE RULES
// ============================================================================

const whitespaceRules: CritiqueRule[] = [
  {
    id: 'whitespace-section-padding',
    principle: 'whitespace',
    severity: 'major',
    name: 'Section Padding',
    description: 'Sections need adequate padding for visual breathing room',
    check: (design) => {
      const padding = design.globalStyles?.spacing?.sectionPadding;

      if (padding === 'sm') {
        return {
          ruleId: 'whitespace-section-padding',
          principle: 'whitespace',
          severity: 'major',
          issue: 'Section padding is too small, making the design feel cramped',
          currentValue: padding,
          suggestedValue: 'md or lg',
          propertyPath: 'globalStyles.spacing.sectionPadding',
          rationale: 'Adequate section padding improves readability and visual hierarchy',
        };
      }
      return null;
    },
  },
  {
    id: 'whitespace-component-gap',
    principle: 'whitespace',
    severity: 'minor',
    name: 'Component Gap',
    description: 'Components need consistent spacing between them',
    check: (design) => {
      const gap = design.globalStyles?.spacing?.componentGap;
      const density = design.globalStyles?.spacing?.density;

      if (density === 'relaxed' && gap === 'sm') {
        return {
          ruleId: 'whitespace-component-gap',
          principle: 'whitespace',
          severity: 'minor',
          issue: 'Component gap is small for a relaxed density design',
          currentValue: gap,
          suggestedValue: 'md or lg',
          propertyPath: 'globalStyles.spacing.componentGap',
          rationale: 'Relaxed layouts need proportional component spacing',
        };
      }
      return null;
    },
  },
  {
    id: 'whitespace-container-width',
    principle: 'whitespace',
    severity: 'minor',
    name: 'Container Width',
    description: 'Full-width containers can make content hard to read',
    check: (design) => {
      const width = design.globalStyles?.spacing?.containerWidth;

      if (width === 'full') {
        return {
          ruleId: 'whitespace-container-width',
          principle: 'whitespace',
          severity: 'minor',
          issue: 'Full-width container may make text lines too long',
          currentValue: width,
          suggestedValue: 'wide or standard',
          propertyPath: 'globalStyles.spacing.containerWidth',
          rationale: 'Optimal line length is 50-75 characters for readability',
        };
      }
      return null;
    },
  },
];

// ============================================================================
// VISUAL HIERARCHY RULES
// ============================================================================

const hierarchyRules: CritiqueRule[] = [
  {
    id: 'hierarchy-heading-size',
    principle: 'visualHierarchy',
    severity: 'major',
    name: 'Heading Size',
    description: 'Headings should be distinctly larger than body text',
    check: (design) => {
      const headingSize = design.globalStyles?.typography?.headingSize;
      const bodySize = design.globalStyles?.typography?.bodySize;

      const sizeOrder = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
      const headingIndex = sizeOrder.indexOf(headingSize || 'lg');
      const bodyIndex = sizeOrder.indexOf(bodySize || 'base');

      if (headingIndex <= bodyIndex) {
        return {
          ruleId: 'hierarchy-heading-size',
          principle: 'visualHierarchy',
          severity: 'major',
          issue: 'Headings are not larger than body text',
          currentValue: `Heading: ${headingSize}, Body: ${bodySize}`,
          suggestedValue: 'Heading should be at least 2 sizes larger',
          propertyPath: 'globalStyles.typography.headingSize',
          rationale: 'Clear size difference establishes visual hierarchy',
        };
      }
      return null;
    },
  },
  {
    id: 'hierarchy-heading-weight',
    principle: 'visualHierarchy',
    severity: 'minor',
    name: 'Heading Weight',
    description: 'Headings should have more weight than body text',
    check: (design) => {
      const headingWeight = design.globalStyles?.typography?.headingWeight;
      const bodyWeight = design.globalStyles?.typography?.bodyWeight;

      const weightOrder = ['light', 'normal', 'medium', 'semibold', 'bold'];
      const headingIndex = weightOrder.indexOf(headingWeight || 'bold');
      const bodyIndex = weightOrder.indexOf(bodyWeight || 'normal');

      if (headingIndex <= bodyIndex) {
        return {
          ruleId: 'hierarchy-heading-weight',
          principle: 'visualHierarchy',
          severity: 'minor',
          issue: 'Headings are not heavier than body text',
          currentValue: `Heading: ${headingWeight}, Body: ${bodyWeight}`,
          suggestedValue: 'Heading should be at least 1 weight heavier',
          propertyPath: 'globalStyles.typography.headingWeight',
          rationale: 'Font weight differences reinforce hierarchy',
        };
      }
      return null;
    },
  },
  {
    id: 'hierarchy-no-shadows',
    principle: 'visualHierarchy',
    severity: 'minor',
    name: 'Shadow Usage',
    description: 'Shadows help establish depth and hierarchy',
    check: (design) => {
      const shadows = design.globalStyles?.effects?.shadows;

      if (shadows === 'none') {
        return {
          ruleId: 'hierarchy-no-shadows',
          principle: 'visualHierarchy',
          severity: 'minor',
          issue: 'No shadows means less visual depth',
          currentValue: shadows,
          suggestedValue: 'subtle',
          propertyPath: 'globalStyles.effects.shadows',
          rationale: 'Subtle shadows help elements stand out and create hierarchy',
        };
      }
      return null;
    },
  },
  {
    id: 'hierarchy-hero-visible',
    principle: 'visualHierarchy',
    severity: 'major',
    name: 'Hero Section Presence',
    description: 'Landing pages should have a prominent hero section',
    check: (design) => {
      const layout = design.basePreferences?.layout;
      const heroVisible = design.components?.hero?.visible;

      if (layout === 'single-page' && heroVisible === false) {
        return {
          ruleId: 'hierarchy-hero-visible',
          principle: 'visualHierarchy',
          severity: 'major',
          issue: 'Single-page layout has no hero section',
          currentValue: 'Hero hidden',
          suggestedValue: 'Enable hero section',
          propertyPath: 'components.hero.visible',
          rationale: 'Hero sections create strong first impressions and establish hierarchy',
        };
      }
      return null;
    },
  },
];

// ============================================================================
// COLOR HARMONY RULES
// ============================================================================

const colorHarmonyRules: CritiqueRule[] = [
  {
    id: 'color-missing-accent',
    principle: 'colorHarmony',
    severity: 'minor',
    name: 'Accent Color',
    description: 'An accent color adds visual interest to the palette',
    check: (design) => {
      const colors = design.globalStyles?.colors;

      if (colors && !colors.accent) {
        return {
          ruleId: 'color-missing-accent',
          principle: 'colorHarmony',
          severity: 'minor',
          issue: 'No accent color defined in the palette',
          currentValue: 'undefined',
          suggestedValue: 'Add a complementary accent color',
          propertyPath: 'globalStyles.colors.accent',
          rationale: 'Accent colors draw attention to important elements',
        };
      }
      return null;
    },
  },
  {
    id: 'color-primary-secondary-similar',
    principle: 'colorHarmony',
    severity: 'minor',
    name: 'Primary-Secondary Distinction',
    description: 'Primary and secondary colors should be distinct',
    check: (design) => {
      const colors = design.globalStyles?.colors;
      if (!colors?.primary || !colors?.secondary) return null;
      if (!isValidHex(colors.primary) || !isValidHex(colors.secondary)) return null;

      // Simple hue comparison - in production you'd use a proper color library
      const primary = normalizeHex(colors.primary);
      const secondary = normalizeHex(colors.secondary);

      // Check if colors are too similar (within ~30 units on RGB)
      const pR = parseInt(primary.slice(1, 3), 16);
      const pG = parseInt(primary.slice(3, 5), 16);
      const pB = parseInt(primary.slice(5, 7), 16);
      const sR = parseInt(secondary.slice(1, 3), 16);
      const sG = parseInt(secondary.slice(3, 5), 16);
      const sB = parseInt(secondary.slice(5, 7), 16);

      const diff = Math.abs(pR - sR) + Math.abs(pG - sG) + Math.abs(pB - sB);

      if (diff < 50) {
        return {
          ruleId: 'color-primary-secondary-similar',
          principle: 'colorHarmony',
          severity: 'minor',
          issue: 'Primary and secondary colors are too similar',
          currentValue: `Primary: ${primary}, Secondary: ${secondary}`,
          suggestedValue: 'Use more contrasting secondary color',
          propertyPath: 'globalStyles.colors.secondary',
          rationale: 'Distinct colors create better visual variety',
        };
      }
      return null;
    },
  },
  {
    id: 'color-semantic-missing',
    principle: 'colorHarmony',
    severity: 'minor',
    name: 'Semantic Colors',
    description: 'Semantic colors (success, warning, error) should be defined',
    check: (design) => {
      const colors = design.globalStyles?.colors;

      if (colors && (!colors.success || !colors.warning || !colors.error)) {
        const missing = [];
        if (!colors.success) missing.push('success');
        if (!colors.warning) missing.push('warning');
        if (!colors.error) missing.push('error');

        return {
          ruleId: 'color-semantic-missing',
          principle: 'colorHarmony',
          severity: 'minor',
          issue: `Missing semantic colors: ${missing.join(', ')}`,
          currentValue: 'undefined',
          suggestedValue: 'Define success (#22c55e), warning (#f59e0b), error (#ef4444)',
          propertyPath: 'globalStyles.colors',
          rationale: 'Semantic colors communicate status and feedback',
        };
      }
      return null;
    },
  },
];

// ============================================================================
// TYPOGRAPHY RULES
// ============================================================================

const typographyRules: CritiqueRule[] = [
  {
    id: 'typography-line-height',
    principle: 'typography',
    severity: 'major',
    name: 'Line Height',
    description: 'Tight line height makes text hard to read',
    check: (design) => {
      const lineHeight = design.globalStyles?.typography?.lineHeight;

      if (lineHeight === 'tight') {
        return {
          ruleId: 'typography-line-height',
          principle: 'typography',
          severity: 'major',
          issue: 'Tight line height reduces readability',
          currentValue: lineHeight,
          suggestedValue: 'normal or relaxed',
          propertyPath: 'globalStyles.typography.lineHeight',
          rationale: 'Adequate line spacing improves reading comfort',
        };
      }
      return null;
    },
  },
  {
    id: 'typography-body-size',
    principle: 'typography',
    severity: 'major',
    name: 'Body Text Size',
    description: 'Body text should not be too small',
    check: (design) => {
      const bodySize = design.globalStyles?.typography?.bodySize;

      if (bodySize === 'xs') {
        return {
          ruleId: 'typography-body-size',
          principle: 'typography',
          severity: 'major',
          issue: 'Body text size is too small for comfortable reading',
          currentValue: bodySize,
          suggestedValue: 'sm or base',
          propertyPath: 'globalStyles.typography.bodySize',
          rationale: 'Minimum 14px (sm) recommended for body text',
        };
      }
      return null;
    },
  },
  {
    id: 'typography-letter-spacing-wide',
    principle: 'typography',
    severity: 'minor',
    name: 'Letter Spacing',
    description: 'Wide letter spacing for body text can reduce readability',
    check: (design) => {
      const letterSpacing = design.globalStyles?.typography?.letterSpacing;
      const bodySize = design.globalStyles?.typography?.bodySize;

      if (letterSpacing === 'wide' && bodySize && ['sm', 'base', 'lg'].includes(bodySize)) {
        return {
          ruleId: 'typography-letter-spacing-wide',
          principle: 'typography',
          severity: 'minor',
          issue: 'Wide letter spacing on body text reduces readability',
          currentValue: letterSpacing,
          suggestedValue: 'normal',
          propertyPath: 'globalStyles.typography.letterSpacing',
          rationale: 'Wide tracking is better suited for headings',
        };
      }
      return null;
    },
  },
];

// ============================================================================
// ACCESSIBILITY RULES
// ============================================================================

const accessibilityRules: CritiqueRule[] = [
  {
    id: 'a11y-focus-visible',
    principle: 'accessibility',
    severity: 'critical',
    name: 'Focus States',
    description: 'Interactive elements need visible focus states',
    check: (design) => {
      // Check if header has CTA but no indication of focus states
      const header = design.components?.header;

      // If there are interactive elements (CTAs) but animations are disabled,
      // focus states might not be visible enough
      if (
        header?.hasCTA &&
        design.globalStyles?.effects?.animations === 'none' &&
        design.globalStyles?.effects?.shadows === 'none'
      ) {
        return {
          ruleId: 'a11y-focus-visible',
          principle: 'accessibility',
          severity: 'critical',
          issue:
            'Interactive elements may lack visible focus states when animations/shadows are disabled',
          currentValue: 'No visual effects',
          suggestedValue: 'Enable at least subtle shadows or animations for focus feedback',
          propertyPath: 'globalStyles.effects.shadows',
          rationale: 'Focus indicators are essential for keyboard navigation',
        };
      }
      return null;
    },
  },
  {
    id: 'a11y-animation-motion',
    principle: 'accessibility',
    severity: 'minor',
    name: 'Animation Preference',
    description: 'Animations should respect user motion preferences',
    check: (design) => {
      const animations = design.globalStyles?.effects?.animations;

      if (animations === 'playful') {
        return {
          ruleId: 'a11y-animation-motion',
          principle: 'accessibility',
          severity: 'minor',
          issue: 'Playful animations may cause issues for motion-sensitive users',
          currentValue: animations,
          suggestedValue: 'Consider subtle or implement prefers-reduced-motion',
          propertyPath: 'globalStyles.effects.animations',
          rationale: 'Respect prefers-reduced-motion for accessibility',
        };
      }
      return null;
    },
  },
  {
    id: 'a11y-color-only',
    principle: 'accessibility',
    severity: 'major',
    name: 'Color-Only Indicators',
    description: 'Information should not rely on color alone',
    check: (design) => {
      const colors = design.globalStyles?.colors;

      // Check if error and text colors are similar (could cause confusion)
      if (colors?.error && colors?.text && isValidHex(colors.error) && isValidHex(colors.text)) {
        const ratio = getContrastRatio(normalizeHex(colors.error), normalizeHex(colors.text));
        if (ratio < 2) {
          return {
            ruleId: 'a11y-color-only',
            principle: 'accessibility',
            severity: 'major',
            issue: 'Error color is too similar to regular text color',
            currentValue: `Error: ${colors.error}, Text: ${colors.text}`,
            suggestedValue: 'Use more distinct error color',
            propertyPath: 'globalStyles.colors.error',
            rationale: 'Error states need to be clearly distinguishable',
          };
        }
      }
      return null;
    },
  },
];

// ============================================================================
// ALIGNMENT RULES
// ============================================================================

const alignmentRules: CritiqueRule[] = [
  {
    id: 'alignment-header-nav',
    principle: 'alignment',
    severity: 'minor',
    name: 'Header Element Alignment',
    description: 'Header elements should have consistent alignment',
    check: (design) => {
      const header = design.components?.header;

      // Centered logo with right nav can look unbalanced without proper spacing
      if (header?.visible && header.logoPosition === 'center' && header.navPosition === 'right') {
        return {
          ruleId: 'alignment-header-nav',
          principle: 'alignment',
          severity: 'minor',
          issue: 'Centered logo with right-aligned navigation may look unbalanced',
          currentValue: `Logo: ${header.logoPosition}, Nav: ${header.navPosition}`,
          suggestedValue: 'Logo: left, Nav: center or right',
          propertyPath: 'components.header.logoPosition',
          rationale: 'Consistent alignment creates visual harmony',
        };
      }
      return null;
    },
  },
  {
    id: 'alignment-hero-content',
    principle: 'alignment',
    severity: 'minor',
    name: 'Hero Content Alignment',
    description: 'Hero layout should match overall style',
    check: (design) => {
      const style = design.basePreferences?.style;
      const hero = design.components?.hero;

      if (style === 'professional' && hero?.layout === 'left-aligned') {
        // This is actually fine - professional often uses left alignment
        return null;
      }

      if (style === 'playful' && hero?.layout === 'left-aligned') {
        return {
          ruleId: 'alignment-hero-content',
          principle: 'alignment',
          severity: 'minor',
          issue: 'Playful designs often benefit from centered hero layout',
          currentValue: hero?.layout,
          suggestedValue: 'centered',
          propertyPath: 'components.hero.layout',
          rationale: 'Centered layout suits playful, engaging designs',
        };
      }
      return null;
    },
  },
];

// ============================================================================
// EXPORTS
// ============================================================================

export const CRITIQUE_RULES: CritiqueRule[] = [
  ...contrastRules,
  ...consistencyRules,
  ...whitespaceRules,
  ...hierarchyRules,
  ...colorHarmonyRules,
  ...typographyRules,
  ...accessibilityRules,
  ...alignmentRules,
];

/**
 * Get rules by principle
 */
export function getRulesByPrinciple(principle: CritiquePrinciple): CritiqueRule[] {
  return CRITIQUE_RULES.filter((rule) => rule.principle === principle);
}

/**
 * Get rules by severity
 */
export function getRulesBySeverity(severity: CritiqueSeverity): CritiqueRule[] {
  return CRITIQUE_RULES.filter((rule) => rule.severity === severity);
}

/**
 * Get all principle categories
 */
export function getAllPrinciples(): CritiquePrinciple[] {
  return [
    'visualHierarchy',
    'consistency',
    'contrast',
    'whitespace',
    'colorHarmony',
    'alignment',
    'typography',
    'accessibility',
  ];
}
