/**
 * Component Design Types
 * All component design interfaces from HeaderDesign through BreadcrumbDesign
 */

import type { CustomizableValue } from './common';

// ============================================================================
// Component Design Types
// ============================================================================

export interface HeaderDesign {
  visible: boolean;
  height: CustomizableValue<'compact' | 'standard' | 'tall'> | 'compact' | 'standard' | 'tall';
  style: 'transparent' | 'solid' | 'gradient' | 'blur';
  logoPosition: 'left' | 'center';
  navPosition: 'center' | 'right';
  hasSearch: boolean;
  hasCTA: boolean;
  ctaText?: string;
  ctaStyle?: 'filled' | 'outline' | 'ghost';
  backgroundColor?: string; // Explicit override for pixel-perfect matching
}

export interface SidebarDesign {
  visible: boolean;
  position: 'left' | 'right';
  width: CustomizableValue<'narrow' | 'standard' | 'wide'> | 'narrow' | 'standard' | 'wide';
  collapsible: boolean;
  defaultCollapsed: boolean;
  style: 'minimal' | 'standard' | 'rich';
  iconOnly: boolean;
  hasLogo: boolean;
}

export interface HeroDesign {
  visible: boolean;
  height:
    | CustomizableValue<'compact' | 'standard' | 'tall' | 'fullscreen'>
    | 'compact'
    | 'standard'
    | 'tall'
    | 'fullscreen';
  layout: 'centered' | 'left-aligned' | 'split' | 'image-background';
  hasImage: boolean;
  imagePosition?: 'left' | 'right' | 'background';
  hasSubtitle: boolean;
  hasCTA: boolean;
  ctaCount: 1 | 2;
  padding?: CustomizableValue<'sm' | 'md' | 'lg' | 'xl'> | 'sm' | 'md' | 'lg' | 'xl';
}

export interface NavigationDesign {
  style: 'horizontal' | 'vertical' | 'mega-menu' | 'hamburger';
  position: 'header' | 'sidebar' | 'floating';
  itemStyle: 'text' | 'pills' | 'underline' | 'boxed';
  showIcons: boolean;
  showLabels: boolean;
  maxVisibleItems: number;
  gap?: CustomizableValue<'sm' | 'md' | 'lg'> | 'sm' | 'md' | 'lg';
}

export interface CardDesign {
  style: 'minimal' | 'bordered' | 'elevated' | 'filled';
  imagePosition: 'top' | 'left' | 'right' | 'background' | 'none';
  showBadge: boolean;
  showFooter: boolean;
  hoverEffect: 'none' | 'lift' | 'glow' | 'scale';
  aspectRatio: 'auto' | 'square' | 'video' | 'portrait';
  borderRadius?:
    | CustomizableValue<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>
    | 'none'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'full';
  padding?: CustomizableValue<'sm' | 'md' | 'lg'> | 'sm' | 'md' | 'lg';
}

export interface ListDesign {
  style: 'simple' | 'bordered' | 'striped' | 'cards';
  showDividers: boolean;
  showAvatar: boolean;
  showMeta: boolean;
  showActions: boolean;
  density: CustomizableValue<'compact' | 'normal' | 'relaxed'> | 'compact' | 'normal' | 'relaxed';
}

export interface FooterDesign {
  visible: boolean;
  style: 'minimal' | 'standard' | 'rich';
  columns: 1 | 2 | 3 | 4;
  showSocial: boolean;
  showNewsletter: boolean;
  showCopyright: boolean;
  position: 'fixed' | 'static';
  padding?: CustomizableValue<'sm' | 'md' | 'lg' | 'xl'> | 'sm' | 'md' | 'lg' | 'xl';
}

export interface StatsDesign {
  visible: boolean;
  layout: 'row' | 'grid';
  style: 'minimal' | 'cards' | 'bordered';
  showIcons: boolean;
  showTrend: boolean;
  columns: 2 | 3 | 4;
}

// ============================================================================
// NEW COMPONENT TYPES
// ============================================================================

/**
 * Form component design specification
 */
export interface FormDesign {
  layout: 'vertical' | 'horizontal' | 'inline' | 'grid';
  labelPosition: 'top' | 'left' | 'floating' | 'hidden';
  inputStyle: 'outlined' | 'filled' | 'underlined' | 'minimal';
  inputSize: 'xs' | 'sm' | 'md' | 'lg';
  showLabels: boolean;
  showHelperText: boolean;
  showRequiredIndicator: boolean;
  buttonPosition: 'left' | 'center' | 'right' | 'full' | 'inline';
  spacing: 'compact' | 'normal' | 'relaxed';
  gridColumns?: number;
}

/**
 * Table component design specification
 */
export interface TableDesign {
  style: 'minimal' | 'striped' | 'bordered' | 'elevated' | 'clean';
  headerStyle: 'simple' | 'bold' | 'colored' | 'sticky';
  rowHover: boolean;
  stickyHeader: boolean;
  density: 'compact' | 'normal' | 'relaxed';
  showPagination: boolean;
  showFilters: boolean;
  showSorting: boolean;
  showCheckboxes: boolean;
  zebraStripes: boolean;
  borderStyle: 'none' | 'horizontal' | 'vertical' | 'all';
}

/**
 * Tabs component design specification
 */
export interface TabsDesign {
  variant: 'line' | 'enclosed' | 'pills' | 'underlined' | 'buttons';
  position: 'top' | 'left' | 'bottom' | 'right';
  size: 'sm' | 'md' | 'lg';
  fullWidth: boolean;
  showIcons: boolean;
  iconPosition: 'left' | 'top' | 'right';
  animated: boolean;
}

/**
 * Modal/Dialog component design specification
 */
export interface ModalDesign {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto';
  position: 'center' | 'top' | 'right' | 'bottom' | 'left';
  hasOverlay: boolean;
  overlayBlur: boolean;
  overlayOpacity: number;
  animation: 'fade' | 'slide' | 'scale' | 'none';
  closeOnOverlayClick: boolean;
  closeOnEscape: boolean;
  showCloseButton: boolean;
  scrollBehavior: 'inside' | 'outside';
}

/**
 * Alert/Notification component design specification
 */
export interface AlertDesign {
  variant: 'subtle' | 'solid' | 'outline' | 'left-accent' | 'top-accent';
  showIcon: boolean;
  showCloseButton: boolean;
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
  animation: 'fade' | 'slide' | 'none';
}

/**
 * Accordion component design specification
 */
export interface AccordionDesign {
  variant: 'simple' | 'bordered' | 'separated' | 'enclosed';
  allowMultiple: boolean;
  defaultExpanded: boolean;
  showIcon: boolean;
  iconPosition: 'left' | 'right';
  animation: 'smooth' | 'instant';
}

/**
 * Carousel/Slider component design specification
 */
export interface CarouselDesign {
  variant: 'default' | 'fade' | 'overlap' | 'continuous' | 'coverflow';
  showIndicators: boolean;
  showControls: boolean;
  autoPlay: boolean;
  autoPlayDuration: number; // milliseconds
  pauseOnHover: boolean;
  transitionDuration: 'fast' | 'normal' | 'slow';
  indicatorStyle: 'dots' | 'bars' | 'thumbnails' | 'numbers';
  indicatorPosition: 'bottom' | 'top' | 'left' | 'right';
  controlStyle: 'arrows' | 'chevrons' | 'minimal' | 'circular';
  controlPosition: 'inside' | 'outside' | 'bottom';
  loop: boolean;
  slidesPerView: number;
  spacing: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Stepper/Wizard component design specification
 */
export interface StepperDesign {
  variant: 'horizontal' | 'vertical';
  style: 'numbered' | 'icons' | 'dots' | 'progress-bar' | 'circles';
  connectorStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  completedStyle: 'check' | 'filled' | 'highlight' | 'strikethrough';
  size: 'sm' | 'md' | 'lg';
  labelPosition: 'bottom' | 'right' | 'hidden';
  showDescription: boolean;
  allowClickNavigation: boolean;
  animated: boolean;
  colorScheme: 'primary' | 'success' | 'neutral';
}

/**
 * Timeline component design specification
 */
export interface TimelineDesign {
  variant: 'vertical' | 'horizontal' | 'alternating' | 'compact';
  connectorStyle: 'solid' | 'dashed' | 'dotted' | 'gradient';
  connectorWidth: 'thin' | 'normal' | 'thick';
  markerStyle: 'circle' | 'square' | 'diamond' | 'icon' | 'image';
  markerSize: 'sm' | 'md' | 'lg';
  datePosition: 'inline' | 'opposite' | 'above' | 'hidden';
  contentStyle: 'card' | 'simple' | 'bordered';
  animated: boolean;
  animationStyle: 'fade' | 'slide' | 'scale';
  showConnector: boolean;
}

/**
 * Pagination component design specification
 */
export interface PaginationDesign {
  variant: 'numbered' | 'simple' | 'dots' | 'load-more' | 'infinite-scroll';
  size: 'sm' | 'md' | 'lg';
  showFirstLast: boolean;
  showPrevNext: boolean;
  maxVisiblePages: number;
  shape: 'rounded' | 'square' | 'pill' | 'circle';
  style: 'filled' | 'outlined' | 'ghost' | 'minimal';
  position: 'left' | 'center' | 'right' | 'space-between';
  showPageInfo: boolean;
  showPageSize: boolean;
}

/**
 * Breadcrumb component design specification
 */
export interface BreadcrumbDesign {
  separator: 'slash' | 'chevron' | 'arrow' | 'dot' | 'custom';
  customSeparator?: string;
  showHome: boolean;
  homeIcon: boolean;
  truncate: boolean;
  maxItems: number;
  collapsible: boolean;
  collapseAt: number;
  size: 'sm' | 'md' | 'lg';
  style: 'default' | 'pills' | 'underlined';
}
