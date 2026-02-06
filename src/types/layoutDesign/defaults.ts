/**
 * Default Values and Helper Functions
 * Default configurations, constants, and helper functions for creating/updating layouts
 */

import { NEUTRAL_PALETTE } from '@/constants/themeDefaults';
import type { GlobalStyles } from './globalStyles';
import type { LayoutStructure, ResponsiveSettings } from './structure';
import type { LayoutDesign } from './layoutDesignType';
import type { AnalysisPhase } from './progress';

// ============================================================================
// Default Values
// ============================================================================

// NOTE: These defaults use neutral grays - actual colors are AI-generated based on user input
// Do NOT add hardcoded blue (#3B82F6) or other branded colors here
export const defaultGlobalStyles: GlobalStyles = {
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingWeight: 'semibold',
    bodyWeight: 'normal',
    headingSize: 'lg',
    bodySize: 'base',
    lineHeight: 'normal',
    letterSpacing: 'normal',
  },
  colors: {
    primary: NEUTRAL_PALETTE.gray500, // Neutral gray - AI will generate actual colors
    secondary: NEUTRAL_PALETTE.gray400,
    accent: NEUTRAL_PALETTE.gray500,
    background: NEUTRAL_PALETTE.gray50, // Light neutral background
    surface: NEUTRAL_PALETTE.white,
    text: NEUTRAL_PALETTE.gray700,
    textMuted: NEUTRAL_PALETTE.gray500,
    border: NEUTRAL_PALETTE.gray200,
  },
  spacing: {
    density: 'normal',
    containerWidth: 'standard',
    sectionPadding: 'lg',
    componentGap: 'md',
  },
  effects: {
    borderRadius: 'lg',
    shadows: 'medium',
    animations: 'smooth',
    blur: 'none',
    gradients: false,
  },
};

export const defaultStructure: LayoutStructure = {
  type: 'single-page',
  hasHeader: true,
  hasSidebar: false,
  hasFooter: true,
  sidebarPosition: 'left',
  headerType: 'sticky',
  contentLayout: 'centered',
  mainContentWidth: 'standard',
};

export const defaultResponsive: ResponsiveSettings = {
  mobileBreakpoint: 640,
  tabletBreakpoint: 1024,
  mobileLayout: 'stack',
  mobileHeader: 'hamburger',
  hideSidebarOnMobile: true,
  stackCardsOnMobile: true,
};

export const defaultLayoutDesign: LayoutDesign = {
  id: '',
  name: 'Untitled Design',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  basePreferences: {
    style: 'modern',
    colorScheme: 'light', // Neutral default - AI will adjust based on user input
    layout: 'single-page',
  },
  globalStyles: defaultGlobalStyles,
  components: {
    header: {
      visible: true,
      height: 'standard',
      style: 'solid',
      logoPosition: 'left',
      navPosition: 'right',
      hasSearch: false,
      hasCTA: true,
      ctaText: 'Get Started',
      ctaStyle: 'filled',
    },
    hero: {
      visible: true,
      height: 'standard',
      layout: 'centered',
      hasImage: false,
      hasSubtitle: true,
      hasCTA: true,
      ctaCount: 1,
    },
    cards: {
      style: 'elevated',
      imagePosition: 'top',
      showBadge: true,
      showFooter: false,
      hoverEffect: 'lift',
      aspectRatio: 'auto',
    },
    lists: {
      style: 'bordered',
      showDividers: true,
      showAvatar: false,
      showMeta: true,
      showActions: true,
      density: 'normal',
    },
    footer: {
      visible: true,
      style: 'minimal',
      columns: 1,
      showSocial: false,
      showNewsletter: false,
      showCopyright: true,
      position: 'static',
    },
  },
  structure: defaultStructure,
  responsive: defaultResponsive,
  referenceMedia: [],
  conversationContext: {
    messageCount: 0,
    keyDecisions: [],
    userPreferences: [],
    lastUpdated: new Date().toISOString(),
  },
};

/**
 * Empty layout design for starting with a blank canvas.
 * No pre-filled styles or components - user must describe or upload reference.
 * Exported as Partial<LayoutDesign> since optional fields are undefined.
 */
export const emptyLayoutDesign: Partial<LayoutDesign> = {
  id: '',
  name: 'New Design',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  referenceMedia: [],
  conversationContext: {
    messageCount: 0,
    keyDecisions: [],
    userPreferences: [],
    lastUpdated: new Date().toISOString(),
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function createLayoutDesign(name: string, overrides?: Partial<LayoutDesign>): LayoutDesign {
  const now = new Date().toISOString();
  return {
    ...defaultLayoutDesign,
    ...overrides,
    id: `ld_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateLayoutDesign(
  design: LayoutDesign,
  updates: Partial<LayoutDesign>
): LayoutDesign {
  return {
    ...design,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: design.version + 1,
  };
}

// ============================================================================
// DEFAULT ANALYSIS VALUES
// ============================================================================

export const defaultAnalysisPhases: AnalysisPhase[] = [
  {
    id: 'upload',
    label: 'Uploading',
    status: 'pending',
    progress: 0,
    subPhases: [
      { id: 'validate', label: 'Validating file', status: 'pending', progress: 0 },
      { id: 'compress', label: 'Optimizing', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'quick',
    label: 'Quick Analysis',
    status: 'pending',
    progress: 0,
    duration: '2-3s',
    subPhases: [
      { id: 'colors', label: 'Extracting colors', status: 'pending', progress: 0 },
      { id: 'layout', label: 'Detecting layout', status: 'pending', progress: 0 },
      { id: 'fonts', label: 'Identifying fonts', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'deep',
    label: 'Deep Analysis',
    status: 'pending',
    progress: 0,
    duration: '10-15s',
    subPhases: [
      { id: 'typography', label: 'Measuring typography', status: 'pending', progress: 0 },
      { id: 'spacing', label: 'Calculating spacing', status: 'pending', progress: 0 },
      { id: 'effects', label: 'Analyzing effects', status: 'pending', progress: 0 },
      { id: 'components', label: 'Mapping components', status: 'pending', progress: 0 },
      { id: 'animations', label: 'Detecting animations', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'generate',
    label: 'Generating Layout',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'render',
    label: 'Rendering Preview',
    status: 'pending',
    progress: 0,
  },
];
