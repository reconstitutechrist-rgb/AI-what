/**
 * Multi-Page Reference Types
 * Page roles, analysis results, navigation, routes, and multi-page design structures
 */

import type { DetectedComponentEnhanced } from './detectedComponent';

// ============================================================================
// Reference Media Types
// ============================================================================

export interface ReferenceMedia {
  id: string;
  type: 'image' | 'video' | 'url';
  source: string; // base64 for images, URL for videos/links
  name: string;
  analysis?: string; // AI's interpretation of the reference
  addedAt: string;
}

// ============================================================================
// Multi-Page Reference Types
// ============================================================================

/**
 * Page role detected from visual analysis
 */
export type PageRole =
  | 'landing'
  | 'dashboard'
  | 'list'
  | 'detail'
  | 'form'
  | 'auth'
  | 'settings'
  | 'profile'
  | 'checkout'
  | 'search'
  | 'error'
  | 'custom';

/**
 * Analysis result for a single page
 */
export interface PageAnalysis {
  /** Detected page role/type */
  pageRole: PageRole;
  /** Layout type detected for this page */
  layoutType:
    | 'single-page'
    | 'dashboard'
    | 'landing'
    | 'e-commerce'
    | 'portfolio'
    | 'blog'
    | 'saas';
  /** Color palette extracted from this page */
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  /** Typography settings detected */
  typography: {
    headingStyle: string;
    bodyStyle: string;
    headingWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    bodyWeight: 'light' | 'normal' | 'medium';
    estimatedHeadingFont?: string;
    estimatedBodyFont?: string;
  };
  /** Spacing settings detected */
  spacing: {
    density: 'compact' | 'normal' | 'relaxed';
    sectionPadding: 'sm' | 'md' | 'lg' | 'xl';
    componentGap: 'sm' | 'md' | 'lg';
  };
  /** Components detected with enhanced positioning */
  components: DetectedComponentEnhanced[];
  /** Visual effects detected */
  effects: {
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    shadows: 'none' | 'subtle' | 'medium' | 'strong';
    hasGradients: boolean;
    hasBlur: boolean;
    hasAnimations: boolean;
  };
  /** Overall design vibe */
  vibe: string;
  /** Keywords describing the aesthetic */
  vibeKeywords: string[];
  /** Confidence score 0-1 */
  confidence: number;
}

/**
 * Navigation item extracted from page analysis
 */
export interface NavigationItem {
  /** Display label */
  label: string;
  /** Target page slug if internal navigation */
  targetPageSlug?: string;
  /** Icon identifier if detected */
  icon?: string;
  /** Display order */
  order: number;
  /** Was this item detected as active/current in the reference */
  isActive?: boolean;
  /** Nested navigation items */
  children?: NavigationItem[];
}

/**
 * Navigation structure detected across pages
 */
export interface DetectedNavigation {
  /** Navigation items */
  items: NavigationItem[];
  /** Navigation style */
  style: 'horizontal' | 'vertical' | 'sidebar' | 'hamburger' | 'tabs' | 'mega-menu';
  /** Position in layout */
  position: 'header' | 'sidebar' | 'footer' | 'floating';
  /** Whether navigation is sticky */
  isSticky?: boolean;
  /** Confidence score 0-1 */
  confidence: number;
}

/**
 * Inferred route from page analysis
 */
export interface InferredRoute {
  /** Route path (e.g., "/products", "/products/:id") */
  path: string;
  /** Associated page ID */
  pageId: string;
  /** Is this the index/home route */
  isIndex?: boolean;
  /** Dynamic route parameters */
  params?: string[];
  /** Page name for display */
  pageName: string;
}

/**
 * Reference for a single page in multi-page mode
 */
export interface PageReference {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Home", "Dashboard", "Product Detail") */
  name: string;
  /** URL-friendly slug (e.g., "home", "dashboard", "product-detail") */
  slug: string;
  /** Base64 encoded reference image */
  referenceImage: string;
  /** Thumbnail for display (smaller base64) */
  thumbnail?: string;
  /** Analysis result from AI */
  analysis?: PageAnalysis;
  /** Display order in navigation */
  order: number;
  /** Is this the main/index page */
  isMain?: boolean;
  /** Analysis status */
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  /** Error message if status is error */
  errorMessage?: string;
  /** When the page reference was created */
  createdAt: string;
}

/**
 * Page transition detected from video analysis (for multi-page mode)
 */
export interface VideoPageTransition {
  /** Start timestamp in seconds */
  startTime: number;
  /** End timestamp in seconds */
  endTime: number;
  /** Transition type detected */
  transitionType: 'navigation' | 'scroll' | 'modal' | 'drawer' | 'tab-switch' | 'unknown';
  /** Confidence that this is a page transition */
  confidence: number;
  /** Frame index where transition starts */
  startFrameIndex: number;
  /** Frame index where transition ends */
  endFrameIndex: number;
}

/**
 * Multi-page design container
 * Note: Uses forward reference to LayoutDesign via type import
 */
export interface MultiPageDesign {
  /** All page references */
  pages: PageReference[];
  /** Shared design tokens across all pages (colors, typography, effects) */
  sharedDesign: Partial<import('./layoutDesignType').LayoutDesign>;
  /** Detected navigation structure */
  navigation: DetectedNavigation;
  /** Per-page design overrides */
  pageSpecificOverrides: Record<string, Partial<import('./layoutDesignType').LayoutDesign>>;
  /** Inferred routes */
  inferredRoutes: InferredRoute[];
  /** When this multi-page design was created */
  createdAt: string;
  /** When this was last updated */
  updatedAt: string;
}

/**
 * Result from multi-page analysis API
 */
export interface MultiPageAnalysisResult {
  /** Analyzed pages with their individual analysis */
  pages: PageReference[];
  /** Shared design detected across pages */
  sharedDesign: Partial<import('./layoutDesignType').LayoutDesign>;
  /** Navigation structure detected */
  navigation: DetectedNavigation;
  /** Inferred routes */
  inferredRoutes: InferredRoute[];
  /** Overall confidence score */
  confidence: number;
  /** Processing metadata */
  metadata: {
    totalPages: number;
    analyzedPages: number;
    processingTimeMs: number;
    modelUsed: 'gemini' | 'claude' | 'dual';
  };
}
