/**
 * Layout Validation Constants
 */

/**
 * Default bounds for components missing bounds data.
 * Uses smaller defaults to prevent full-width stacking.
 */
export const DEFAULT_BOUNDS = {
  top: 0,
  left: 0,
  width: 20,
  height: 10,
} as const;

/**
 * Known component types (reference list).
 * Unrecognized types are kept as-is rather than forced to 'unknown',
 * allowing the AI to generate novel component types.
 */
export const KNOWN_COMPONENT_TYPES = [
  'header',
  'sidebar',
  'hero',
  'cards',
  'navigation',
  'footer',
  'form',
  'table',
  'carousel',
  'timeline',
  'stepper',
  'stats',
  'testimonials',
  'pricing',
  'features',
  'cta',
  'breadcrumb',
  'pagination',
  'tabs',
  'modal-trigger',
  'search-bar',
  'user-menu',
  'logo',
  'content-section',
  'image-gallery',
  'video-player',
  'map',
  'chart',
  'button',
  'input',
  'list',
  'menu',
  'modal',
  'dropdown',
  'badge',
  'avatar',
  'divider',
  'progress',
  'notification',
  'drawer',
  'toast',
  'popover',
  'tooltip',
  'spinner',
  'skeleton',
  'slider',
  'toggle',
  'checkbox',
  'radio',
  'select',
  'accordion',
  'alert',
  'banner',
  'chip',
  'tag',
  'rating',
  'calendar',
  'datepicker',
  'dialog',
  'switch',
  'upload',
  'tree',
  'unknown',
] as const;

/**
 * Valid component roles for positioning strategy
 */
export const KNOWN_ROLES = [
  'container',
  'leaf',
  'overlay',
  'fixed',
  'sticky',
  'modal',
  'background',
  'wrapper',
] as const;

/**
 * Container types that can have children
 */
export const CONTAINER_TYPES = new Set([
  'header',
  'sidebar',
  'hero',
  'section',
  'container',
  'cards',
  'navigation',
  'footer',
  'form',
]);
