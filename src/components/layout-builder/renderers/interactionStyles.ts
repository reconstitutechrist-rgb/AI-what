/**
 * Interaction style builders for hover, active, and focus states.
 * Generates CSS custom properties and Tailwind classes for interactive components.
 */

import type React from 'react';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';

/** Build CSS custom property styles for interaction states */
export function buildInteractionStyles(
  component: DetectedComponentEnhanced
): React.CSSProperties {
  const interactionStyles: React.CSSProperties = {};

  if (component.interactions?.hover) {
    const hover = component.interactions.hover;
    Object.assign(interactionStyles, {
      '--hover-bg': hover.backgroundColor,
      '--hover-color': hover.textColor,
      '--hover-transform': hover.transform,
      '--hover-shadow': hover.boxShadow,
      '--hover-opacity': hover.opacity,
      '--hover-border': hover.borderColor,
    } as React.CSSProperties);
  }

  if (component.interactions?.active) {
    const active = component.interactions.active;
    Object.assign(interactionStyles, {
      '--active-bg': active.backgroundColor,
      '--active-color': active.textColor,
      '--active-transform': active.transform,
      '--active-scale': active.scale,
    } as React.CSSProperties);
  }

  if (component.interactions?.focus) {
    const focus = component.interactions.focus;
    Object.assign(interactionStyles, {
      '--focus-outline': focus.outline,
      '--focus-shadow': focus.boxShadow,
      '--focus-border': focus.borderColor,
    } as React.CSSProperties);
  }

  return interactionStyles;
}

/** Generate Tailwind interaction classes based on which interaction properties are set */
export function getInteractionClass(component: DetectedComponentEnhanced): string {
  const hasInteractions =
    component.interactions?.hover ||
    component.interactions?.active ||
    component.interactions?.focus;

  if (!hasInteractions) return '';

  const classes: string[] = [];

  const hover = component.interactions?.hover;
  if (hover?.backgroundColor) classes.push('hover:bg-[var(--hover-bg)]');
  if (hover?.textColor) classes.push('hover:text-[var(--hover-color)]');
  if (hover?.transform) classes.push('hover:[transform:var(--hover-transform)]');
  if (hover?.boxShadow) classes.push('hover:[box-shadow:var(--hover-shadow)]');
  if (hover?.opacity !== undefined) classes.push('hover:opacity-[var(--hover-opacity)]');

  const active = component.interactions?.active;
  if (active?.backgroundColor) classes.push('active:bg-[var(--active-bg)]');
  if (active?.textColor) classes.push('active:text-[var(--active-color)]');
  if (active?.transform) classes.push('active:[transform:var(--active-transform)]');
  if (active?.scale) classes.push(`active:scale-[var(--active-scale)]`);

  const focus = component.interactions?.focus;
  if (focus?.outline) classes.push('focus:[outline:var(--focus-outline)]');
  if (focus?.boxShadow) classes.push('focus:[box-shadow:var(--focus-shadow)]');
  if (focus?.borderColor) classes.push('focus:border-[var(--focus-border)]');

  return classes.join(' ');
}
