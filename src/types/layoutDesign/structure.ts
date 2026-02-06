/**
 * Layout Structure Types
 * Layout structure, responsive settings, element selection, version history, layout nodes, and grid configuration
 */

import type { DetectedComponentEnhanced } from './detectedComponent';

// ============================================================================
// Layout Structure Types
// ============================================================================

export interface LayoutStructure {
  type: 'single-page' | 'multi-page' | 'dashboard' | 'landing' | 'wizard' | 'split';
  hasHeader: boolean;
  hasSidebar: boolean;
  hasFooter: boolean;
  sidebarPosition: 'left' | 'right';
  headerType: 'fixed' | 'sticky' | 'static';
  contentLayout: 'centered' | 'full-width' | 'asymmetric';
  mainContentWidth: 'narrow' | 'standard' | 'wide' | 'full';
  /** Full detected components array from Gemini analysis for dynamic layout rendering */
  detectedComponents?: DetectedComponentEnhanced[];
}

export interface ResponsiveSettings {
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  mobileLayout: 'stack' | 'drawer' | 'bottom-nav';
  mobileHeader: 'hamburger' | 'bottom-tabs' | 'minimal';
  hideSidebarOnMobile: boolean;
  stackCardsOnMobile: boolean;
}

// ============================================================================
// LAYOUT NODE - Recursive Structure for Component Nesting
// ============================================================================

/**
 * Component types that can be placed in a layout node
 */
export type LayoutComponentType =
  | 'header'
  | 'sidebar'
  | 'hero'
  | 'cards'
  | 'list'
  | 'stats'
  | 'footer'
  | 'navigation'
  | 'form'
  | 'table'
  | 'tabs'
  | 'modal'
  | 'custom';

/**
 * Element types for Click + Talk mode element selection
 * Extends LayoutComponentType with additional UI element types
 */
export type ElementType =
  | 'header'
  | 'footer'
  | 'sidebar'
  | 'hero'
  | 'section'
  | 'card'
  | 'button'
  | 'text'
  | 'heading'
  | 'image'
  | 'nav'
  | 'list'
  | 'form'
  | 'input'
  | 'container'
  | 'link'
  | 'icon'
  | 'video'
  | 'modal'
  | 'tabs'
  | 'menu'
  | 'custom';

/**
 * Bounding rectangle for element position tracking
 */
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Design version for history tracking
 */
export interface DesignVersion {
  id: string;
  timestamp: Date | string;
  description: string;
  name?: string;
  thumbnail?: string;
  design: Partial<import('./layoutDesignType').LayoutDesign>;
  changedElements?: string[];
}

/**
 * Rich element info for Click + Talk mode
 * Contains everything needed to show contextual actions and scope AI changes
 */
export interface SelectedElementInfo {
  /** Element identifier (e.g., "header", "sidebar", "cards") */
  id: string;
  /** Type of element for context-aware actions */
  type: ElementType;
  /** Visual bounds for highlight positioning */
  bounds: ElementBounds;
  /** Current style properties of the element */
  currentProperties: Record<string, unknown>;
  /** Parent element ID for hierarchy context */
  parentId?: string;
  /** Quick actions available for this element type */
  allowedActions: string[];
  /** User-friendly display name */
  displayName?: string;
}

/**
 * Layout node types for building nested structures
 */
export type LayoutNodeType = 'container' | 'row' | 'column' | 'section' | 'component';

/**
 * Flexbox/grid alignment options
 */
export interface LayoutAlignment {
  direction: 'row' | 'column';
  gap: string;
  align: 'start' | 'center' | 'end' | 'stretch';
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

/**
 * Recursive layout node for building nested component structures
 * Supports up to N levels of nesting (recommended max: 3)
 */
export interface LayoutNode {
  id: string;
  type: LayoutNodeType;
  componentType?: LayoutComponentType;
  label?: string;
  children: LayoutNode[];
  props: Record<string, unknown>;
  layout?: LayoutAlignment;
  style?: {
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    height?: string;
    padding?: string;
    margin?: string;
    background?: string;
    borderRadius?: string;
    border?: string;
    shadow?: string;
  };
  responsive?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    mobileOrder?: number;
    mobileSpan?: number;
  };
}

// ============================================================================
// GRID CONFIGURATION
// ============================================================================

/**
 * Custom grid configuration for flexible layouts
 */
export interface GridConfig {
  columns: number | 'auto-fit' | 'auto-fill';
  columnWidths?: string[]; // ['1fr', '2fr', '1fr'] for custom column sizes
  gap: string;
  rowGap?: string;
  minColumnWidth?: string; // For auto-fit/fill
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
}

// ============================================================================
// RESPONSIVE OVERRIDES
// ============================================================================

/**
 * Generic responsive overrides wrapper for any component type
 * Allows per-breakpoint customization of component properties
 */
export interface ResponsiveOverrides<T> {
  mobile?: Partial<T>;
  tablet?: Partial<T>;
  desktop?: Partial<T>;
  wide?: Partial<T>;
  custom?: Record<string, Partial<T>>; // Custom breakpoint names
}

/**
 * Component with responsive support
 */
export type ResponsiveComponent<T> = T & {
  responsive?: ResponsiveOverrides<T>;
};

// ============================================================================
// EXTENDED RESPONSIVE SETTINGS
// ============================================================================

/**
 * Custom breakpoint configuration
 */
export interface CustomBreakpoints {
  mobile: number; // Default: 375
  mobileLandscape?: number; // Optional: 480
  tablet: number; // Default: 768
  tabletLandscape?: number; // Optional: 1024
  laptop?: number; // Optional: 1024
  desktop: number; // Default: 1200
  wide?: number; // Optional: 1440
  ultrawide?: number; // Optional: 1920
}

/**
 * Per-breakpoint visibility settings
 */
export interface BreakpointVisibility {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  wide?: boolean;
}

/**
 * Extended responsive settings with custom breakpoints
 */
export interface ExtendedResponsiveSettings extends ResponsiveSettings {
  customBreakpoints?: CustomBreakpoints;
  containerQueries?: boolean;
  fluidTypography?: boolean;
}

/**
 * Extended components interface with new component types
 */
export interface ExtendedLayoutComponents {
  header?: ResponsiveComponent<import('./components').HeaderDesign>;
  sidebar?: ResponsiveComponent<import('./components').SidebarDesign>;
  hero?: ResponsiveComponent<import('./components').HeroDesign>;
  navigation?: ResponsiveComponent<import('./components').NavigationDesign>;
  cards?: ResponsiveComponent<import('./components').CardDesign> & { gridConfig?: GridConfig };
  lists?: ResponsiveComponent<import('./components').ListDesign>;
  stats?: ResponsiveComponent<import('./components').StatsDesign>;
  footer?: ResponsiveComponent<import('./components').FooterDesign>;
  forms?: ResponsiveComponent<import('./components').FormDesign>;
  tables?: ResponsiveComponent<import('./components').TableDesign>;
  tabs?: ResponsiveComponent<import('./components').TabsDesign>;
  modals?: ResponsiveComponent<import('./components').ModalDesign>;
  alerts?: ResponsiveComponent<import('./components').AlertDesign>;
  accordions?: ResponsiveComponent<import('./components').AccordionDesign>;
  // New component types
  carousels?: ResponsiveComponent<import('./components').CarouselDesign>;
  steppers?: ResponsiveComponent<import('./components').StepperDesign>;
  timelines?: ResponsiveComponent<import('./components').TimelineDesign>;
  pagination?: ResponsiveComponent<import('./components').PaginationDesign>;
  breadcrumbs?: ResponsiveComponent<import('./components').BreadcrumbDesign>;
}

/**
 * Extended LayoutDesign with new features
 */
export interface ExtendedLayoutDesign extends Omit<import('./layoutDesignType').LayoutDesign, 'components' | 'responsive'> {
  components: ExtendedLayoutComponents;
  responsive: ExtendedResponsiveSettings;
  layoutTree?: LayoutNode; // Recursive layout structure
  customGrids?: Record<string, GridConfig>; // Named grid configurations
}
