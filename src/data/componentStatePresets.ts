/**
 * Component State Presets
 *
 * AI-controllable interactive state presets for UI components including
 * hover, focus, active, disabled, and loading states. Each preset includes
 * CSS, Tailwind, and Framer Motion implementations.
 */

import type { ComponentStateType } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentStatePreset {
  id: string;
  name: string;
  state: ComponentStateType;
  description: string;
  css: {
    base: string;
    state: string;
    transition: string;
  };
  tailwind: string;
  framerMotion: Record<string, unknown>;
}

export interface ComponentStateCategory {
  id: ComponentStateType;
  name: string;
  description: string;
  presets: ComponentStatePreset[];
}

// ============================================================================
// HOVER STATE PRESETS
// ============================================================================

const hoverPresets: ComponentStatePreset[] = [
  {
    id: 'hover-lift',
    name: 'Lift on Hover',
    state: 'hover',
    description: 'Element lifts up with enhanced shadow',
    css: {
      base: '',
      state: 'transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);',
      transition: 'transition: all 0.2s ease-out;',
    },
    tailwind: 'hover:-translate-y-1 hover:shadow-xl transition-all duration-200 ease-out',
    framerMotion: {
      whileHover: { y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
  {
    id: 'hover-scale',
    name: 'Scale on Hover',
    state: 'hover',
    description: 'Element scales up slightly',
    css: {
      base: '',
      state: 'transform: scale(1.05);',
      transition: 'transition: transform 0.2s ease-out;',
    },
    tailwind: 'hover:scale-105 transition-transform duration-200 ease-out',
    framerMotion: {
      whileHover: { scale: 1.05 },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
  {
    id: 'hover-glow',
    name: 'Glow on Hover',
    state: 'hover',
    description: 'Soft glow effect on hover',
    css: {
      base: '',
      state: 'box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);',
      transition: 'transition: box-shadow 0.3s ease;',
    },
    tailwind: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-shadow duration-300',
    framerMotion: {
      whileHover: { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
      transition: { duration: 0.3 },
    },
  },
  {
    id: 'hover-brighten',
    name: 'Brighten on Hover',
    state: 'hover',
    description: 'Element brightens on hover',
    css: {
      base: '',
      state: 'filter: brightness(1.1);',
      transition: 'transition: filter 0.2s ease;',
    },
    tailwind: 'hover:brightness-110 transition-[filter] duration-200',
    framerMotion: {
      whileHover: { filter: 'brightness(1.1)' },
      transition: { duration: 0.2 },
    },
  },
  {
    id: 'hover-darken',
    name: 'Darken on Hover',
    state: 'hover',
    description: 'Element darkens on hover',
    css: {
      base: '',
      state: 'filter: brightness(0.9);',
      transition: 'transition: filter 0.2s ease;',
    },
    tailwind: 'hover:brightness-90 transition-[filter] duration-200',
    framerMotion: {
      whileHover: { filter: 'brightness(0.9)' },
      transition: { duration: 0.2 },
    },
  },
  {
    id: 'hover-border-color',
    name: 'Border Color Change',
    state: 'hover',
    description: 'Border color changes on hover',
    css: {
      base: 'border: 2px solid transparent;',
      state: 'border-color: #6366f1;',
      transition: 'transition: border-color 0.2s ease;',
    },
    tailwind: 'border-2 border-transparent hover:border-indigo-500 transition-colors duration-200',
    framerMotion: {
      whileHover: { borderColor: '#6366f1' },
      transition: { duration: 0.2 },
    },
  },
  {
    id: 'hover-background-shift',
    name: 'Background Shift',
    state: 'hover',
    description: 'Background color shifts on hover',
    css: {
      base: 'background-color: #f3f4f6;',
      state: 'background-color: #e5e7eb;',
      transition: 'transition: background-color 0.2s ease;',
    },
    tailwind: 'bg-gray-100 hover:bg-gray-200 transition-colors duration-200',
    framerMotion: {
      whileHover: { backgroundColor: '#e5e7eb' },
      transition: { duration: 0.2 },
    },
  },
  {
    id: 'hover-underline-grow',
    name: 'Growing Underline',
    state: 'hover',
    description: 'Underline grows from center on hover',
    css: {
      base: 'position: relative; &::after { content: ""; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background: currentColor; transition: all 0.3s ease; }',
      state: '&::after { left: 0; width: 100%; }',
      transition: '',
    },
    tailwind:
      'relative after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-current after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full',
    framerMotion: {},
  },
];

// ============================================================================
// FOCUS STATE PRESETS
// ============================================================================

const focusPresets: ComponentStatePreset[] = [
  {
    id: 'focus-ring',
    name: 'Focus Ring',
    state: 'focus',
    description: 'Visible focus ring for accessibility',
    css: {
      base: '',
      state: 'outline: 2px solid #4F46E5; outline-offset: 2px;',
      transition: '',
    },
    tailwind: 'focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2',
    framerMotion: {},
  },
  {
    id: 'focus-ring-blue',
    name: 'Blue Focus Ring',
    state: 'focus',
    description: 'Blue focus ring indicator',
    css: {
      base: '',
      state: 'outline: 2px solid #3B82F6; outline-offset: 2px;',
      transition: '',
    },
    tailwind: 'focus:outline-2 focus:outline-blue-500 focus:outline-offset-2',
    framerMotion: {},
  },
  {
    id: 'focus-glow',
    name: 'Focus Glow',
    state: 'focus',
    description: 'Soft glow effect on focus',
    css: {
      base: '',
      state: 'box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);',
      transition: 'transition: box-shadow 0.15s ease;',
    },
    tailwind: 'focus:ring-4 focus:ring-indigo-500/40 transition-shadow duration-150',
    framerMotion: {},
  },
  {
    id: 'focus-border',
    name: 'Focus Border',
    state: 'focus',
    description: 'Border highlight on focus',
    css: {
      base: 'border: 2px solid #e5e7eb;',
      state: 'border-color: #6366f1;',
      transition: 'transition: border-color 0.15s ease;',
    },
    tailwind: 'border-2 border-gray-200 focus:border-indigo-500 transition-colors duration-150',
    framerMotion: {},
  },
  {
    id: 'focus-scale',
    name: 'Focus Scale',
    state: 'focus',
    description: 'Slight scale increase on focus',
    css: {
      base: '',
      state: 'transform: scale(1.02);',
      transition: 'transition: transform 0.15s ease;',
    },
    tailwind: 'focus:scale-[1.02] transition-transform duration-150',
    framerMotion: {},
  },
];

// ============================================================================
// ACTIVE STATE PRESETS
// ============================================================================

const activePresets: ComponentStatePreset[] = [
  {
    id: 'active-press',
    name: 'Press Effect',
    state: 'active',
    description: 'Button press feedback',
    css: {
      base: '',
      state: 'transform: scale(0.97);',
      transition: 'transition: transform 0.1s ease;',
    },
    tailwind: 'active:scale-[0.97] transition-transform duration-100',
    framerMotion: {
      whileTap: { scale: 0.97 },
      transition: { duration: 0.1 },
    },
  },
  {
    id: 'active-press-deep',
    name: 'Deep Press',
    state: 'active',
    description: 'More pronounced press effect',
    css: {
      base: '',
      state: 'transform: scale(0.95);',
      transition: 'transition: transform 0.1s ease;',
    },
    tailwind: 'active:scale-95 transition-transform duration-100',
    framerMotion: {
      whileTap: { scale: 0.95 },
      transition: { duration: 0.1 },
    },
  },
  {
    id: 'active-darken',
    name: 'Darken on Press',
    state: 'active',
    description: 'Element darkens when pressed',
    css: {
      base: '',
      state: 'filter: brightness(0.85);',
      transition: 'transition: filter 0.1s ease;',
    },
    tailwind: 'active:brightness-[0.85] transition-[filter] duration-100',
    framerMotion: {
      whileTap: { filter: 'brightness(0.85)' },
      transition: { duration: 0.1 },
    },
  },
  {
    id: 'active-inset-shadow',
    name: 'Inset Shadow',
    state: 'active',
    description: 'Inset shadow on press',
    css: {
      base: '',
      state: 'box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);',
      transition: 'transition: box-shadow 0.1s ease;',
    },
    tailwind: 'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] transition-shadow duration-100',
    framerMotion: {
      whileTap: { boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15)' },
      transition: { duration: 0.1 },
    },
  },
];

// ============================================================================
// DISABLED STATE PRESETS
// ============================================================================

const disabledPresets: ComponentStatePreset[] = [
  {
    id: 'disabled-muted',
    name: 'Muted Disabled',
    state: 'disabled',
    description: 'Reduced opacity, no interaction',
    css: {
      base: '',
      state: 'opacity: 0.5; pointer-events: none; cursor: not-allowed;',
      transition: '',
    },
    tailwind: 'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    framerMotion: {},
  },
  {
    id: 'disabled-grayscale',
    name: 'Grayscale Disabled',
    state: 'disabled',
    description: 'Grayscale filter when disabled',
    css: {
      base: '',
      state: 'filter: grayscale(100%); opacity: 0.6; pointer-events: none; cursor: not-allowed;',
      transition: '',
    },
    tailwind:
      'disabled:grayscale disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed',
    framerMotion: {},
  },
  {
    id: 'disabled-subtle',
    name: 'Subtle Disabled',
    state: 'disabled',
    description: 'Subtle opacity reduction',
    css: {
      base: '',
      state: 'opacity: 0.7; pointer-events: none; cursor: not-allowed;',
      transition: '',
    },
    tailwind: 'disabled:opacity-70 disabled:pointer-events-none disabled:cursor-not-allowed',
    framerMotion: {},
  },
  {
    id: 'disabled-striped',
    name: 'Striped Disabled',
    state: 'disabled',
    description: 'Diagonal stripes overlay when disabled',
    css: {
      base: '',
      state:
        'opacity: 0.6; pointer-events: none; cursor: not-allowed; background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px);',
      transition: '',
    },
    tailwind:
      'disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.05)_5px,rgba(0,0,0,0.05)_10px)]',
    framerMotion: {},
  },
];

// ============================================================================
// LOADING STATE PRESETS
// ============================================================================

const loadingPresets: ComponentStatePreset[] = [
  {
    id: 'loading-pulse',
    name: 'Pulse Loading',
    state: 'loading',
    description: 'Pulsing animation while loading',
    css: {
      base: '',
      state: 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;',
      transition: '',
    },
    tailwind: 'animate-pulse',
    framerMotion: {
      animate: { opacity: [1, 0.5, 1] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'loading-spin',
    name: 'Spin Loading',
    state: 'loading',
    description: 'Spinning animation for loaders',
    css: {
      base: '',
      state: 'animation: spin 1s linear infinite;',
      transition: '',
    },
    tailwind: 'animate-spin',
    framerMotion: {
      animate: { rotate: 360 },
      transition: { duration: 1, repeat: Infinity, ease: 'linear' },
    },
  },
  {
    id: 'loading-bounce',
    name: 'Bounce Loading',
    state: 'loading',
    description: 'Bouncing animation while loading',
    css: {
      base: '',
      state: 'animation: bounce 1s infinite;',
      transition: '',
    },
    tailwind: 'animate-bounce',
    framerMotion: {
      animate: { y: [0, -10, 0] },
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'loading-shimmer',
    name: 'Shimmer Loading',
    state: 'loading',
    description: 'Skeleton shimmer effect',
    css: {
      base: 'background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%;',
      state: 'animation: shimmer 1.5s infinite;',
      transition: '',
    },
    tailwind:
      'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
    framerMotion: {
      animate: { backgroundPosition: ['200% 0', '-200% 0'] },
      transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
    },
  },
  {
    id: 'loading-fade',
    name: 'Fade Loading',
    state: 'loading',
    description: 'Fading in and out while loading',
    css: {
      base: '',
      state: 'animation: fadeInOut 1.5s ease-in-out infinite;',
      transition: '',
    },
    tailwind: 'animate-[fadeInOut_1.5s_ease-in-out_infinite]',
    framerMotion: {
      animate: { opacity: [0.3, 1, 0.3] },
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
];

// ============================================================================
// EXPORTS
// ============================================================================

export const COMPONENT_STATE_PRESETS: ComponentStatePreset[] = [
  ...hoverPresets,
  ...focusPresets,
  ...activePresets,
  ...disabledPresets,
  ...loadingPresets,
];

export const COMPONENT_STATE_CATEGORIES: ComponentStateCategory[] = [
  {
    id: 'hover',
    name: 'Hover States',
    description: 'Visual feedback when user hovers over element',
    presets: hoverPresets,
  },
  {
    id: 'focus',
    name: 'Focus States',
    description: 'Accessibility-focused visual indicators',
    presets: focusPresets,
  },
  {
    id: 'active',
    name: 'Active States',
    description: 'Press/click feedback effects',
    presets: activePresets,
  },
  {
    id: 'disabled',
    name: 'Disabled States',
    description: 'Visual indication of non-interactive state',
    presets: disabledPresets,
  },
  {
    id: 'loading',
    name: 'Loading States',
    description: 'Animation effects during loading',
    presets: loadingPresets,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a preset by ID
 */
export function getComponentStatePreset(id: string): ComponentStatePreset | undefined {
  return COMPONENT_STATE_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all presets for a specific state
 */
export function getPresetsByState(state: ComponentStateType): ComponentStatePreset[] {
  return COMPONENT_STATE_PRESETS.filter((preset) => preset.state === state);
}

/**
 * Generate complete CSS for a state preset
 */
export function generateStateCSS(preset: ComponentStatePreset, selector: string): string {
  const { css, state } = preset;
  const stateSelector =
    state === 'hover'
      ? ':hover'
      : state === 'focus'
        ? ':focus'
        : state === 'active'
          ? ':active'
          : state === 'disabled'
            ? ':disabled'
            : '';

  let result = '';

  if (css.base) {
    result += `${selector} { ${css.base} }\n`;
  }

  if (css.transition) {
    result += `${selector} { ${css.transition} }\n`;
  }

  if (css.state && stateSelector) {
    result += `${selector}${stateSelector} { ${css.state} }\n`;
  } else if (css.state && state === 'loading') {
    result += `${selector}.loading { ${css.state} }\n`;
  }

  return result;
}

/**
 * Combine multiple state presets into a single Tailwind class string
 */
export function combineStateTailwind(presetIds: string[]): string {
  return presetIds
    .map((id) => getComponentStatePreset(id)?.tailwind)
    .filter(Boolean)
    .join(' ');
}

export default {
  COMPONENT_STATE_PRESETS,
  COMPONENT_STATE_CATEGORIES,
  getComponentStatePreset,
  getPresetsByState,
  generateStateCSS,
  combineStateTailwind,
};
