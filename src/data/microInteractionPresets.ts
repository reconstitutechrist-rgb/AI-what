/**
 * Micro-Interaction Presets
 *
 * AI-controllable micro-interaction presets including ripple effects,
 * magnetic pull, 3D tilt, bounce animations, and typewriter effects.
 * Each preset includes CSS, Tailwind, and Framer Motion implementations.
 */

import type { MicroInteractionTrigger } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export interface MicroInteractionPreset {
  id: string;
  name: string;
  description: string;
  trigger: MicroInteractionTrigger;
  css: {
    keyframes: string;
    animation: string;
    base?: string;
  };
  tailwind: string;
  framerMotion: Record<string, unknown>;
  requiresJS?: boolean; // Some interactions need JS for mouse tracking
}

export interface MicroInteractionCategory {
  id: string;
  name: string;
  description: string;
  presets: MicroInteractionPreset[];
}

// ============================================================================
// CLICK/TAP INTERACTIONS
// ============================================================================

const clickInteractions: MicroInteractionPreset[] = [
  {
    id: 'ripple',
    name: 'Ripple Effect',
    description: 'Material Design ripple on click',
    trigger: 'click',
    css: {
      keyframes: `@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}`,
      animation: 'animation: ripple 0.6s linear;',
      base: 'position: relative; overflow: hidden;',
    },
    tailwind:
      'relative overflow-hidden before:content-[""] before:absolute before:inset-0 before:bg-white/30 before:rounded-full before:scale-0 before:opacity-100 active:before:scale-[4] active:before:opacity-0 before:transition-all before:duration-500',
    framerMotion: {
      whileTap: { scale: 0.98 },
      transition: { duration: 0.1 },
    },
  },
  {
    id: 'ripple-dark',
    name: 'Dark Ripple',
    description: 'Dark ripple effect for light backgrounds',
    trigger: 'click',
    css: {
      keyframes: `@keyframes rippleDark {
  to {
    transform: scale(4);
    opacity: 0;
  }
}`,
      animation: 'animation: rippleDark 0.6s linear;',
      base: 'position: relative; overflow: hidden;',
    },
    tailwind:
      'relative overflow-hidden before:content-[""] before:absolute before:inset-0 before:bg-black/20 before:rounded-full before:scale-0 before:opacity-100 active:before:scale-[4] active:before:opacity-0 before:transition-all before:duration-500',
    framerMotion: {
      whileTap: { scale: 0.98 },
      transition: { duration: 0.1 },
    },
  },
  {
    id: 'click-burst',
    name: 'Click Burst',
    description: 'Expanding burst effect on click',
    trigger: 'click',
    css: {
      keyframes: `@keyframes clickBurst {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}`,
      animation: 'animation: clickBurst 0.4s ease-out;',
      base: 'position: relative;',
    },
    tailwind: 'relative active:animate-[clickBurst_0.4s_ease-out]',
    framerMotion: {
      whileTap: { scale: [1, 1.1, 1] },
      transition: { duration: 0.2 },
    },
  },
  {
    id: 'click-shrink',
    name: 'Click Shrink',
    description: 'Quick shrink and bounce back',
    trigger: 'click',
    css: {
      keyframes: '',
      animation: '',
      base: 'transition: transform 0.15s ease;',
    },
    tailwind: 'active:scale-90 transition-transform duration-150',
    framerMotion: {
      whileTap: { scale: 0.9 },
      transition: { type: 'spring', stiffness: 400, damping: 17 },
    },
  },
];

// ============================================================================
// HOVER INTERACTIONS
// ============================================================================

const hoverInteractions: MicroInteractionPreset[] = [
  {
    id: 'magnetic',
    name: 'Magnetic Pull',
    description: 'Element follows cursor on hover',
    trigger: 'hover',
    css: {
      keyframes: '',
      animation: '',
      base: 'transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);',
    },
    tailwind: 'transition-transform duration-300 ease-out',
    framerMotion: {
      whileHover: { x: 'var(--mouse-x, 0)', y: 'var(--mouse-y, 0)' },
      transition: { type: 'spring', stiffness: 150, damping: 15 },
    },
    requiresJS: true,
  },
  {
    id: 'tilt-3d',
    name: '3D Tilt',
    description: 'Card tilts toward cursor',
    trigger: 'hover',
    css: {
      keyframes: '',
      animation: '',
      base: 'transform-style: preserve-3d; perspective: 1000px; transition: transform 0.3s ease;',
    },
    tailwind:
      '[transform-style:preserve-3d] [perspective:1000px] transition-transform duration-300',
    framerMotion: {
      whileHover: {
        rotateX: 'var(--rotate-x, 0)',
        rotateY: 'var(--rotate-y, 0)',
        scale: 1.02,
      },
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    requiresJS: true,
  },
  {
    id: 'float',
    name: 'Float Effect',
    description: 'Element floats up and down',
    trigger: 'hover',
    css: {
      keyframes: `@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}`,
      animation: 'animation: float 2s ease-in-out infinite;',
    },
    tailwind: 'hover:animate-[float_2s_ease-in-out_infinite]',
    framerMotion: {
      whileHover: {
        y: [0, -10, 0],
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  {
    id: 'wobble',
    name: 'Wobble Effect',
    description: 'Playful wobble on hover',
    trigger: 'hover',
    css: {
      keyframes: `@keyframes wobble {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}`,
      animation: 'animation: wobble 0.5s ease-in-out;',
    },
    tailwind: 'hover:animate-[wobble_0.5s_ease-in-out]',
    framerMotion: {
      whileHover: {
        rotate: [0, -3, 3, -3, 0],
        transition: { duration: 0.5 },
      },
    },
  },
  {
    id: 'jello',
    name: 'Jello Effect',
    description: 'Elastic jello wiggle on hover',
    trigger: 'hover',
    css: {
      keyframes: `@keyframes jello {
  0%, 100% { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
}`,
      animation: 'animation: jello 0.9s ease;',
    },
    tailwind: 'hover:animate-[jello_0.9s_ease]',
    framerMotion: {
      whileHover: {
        scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
        scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
        transition: { duration: 0.9 },
      },
    },
  },
  {
    id: 'shine',
    name: 'Shine Effect',
    description: 'Light sweep across element',
    trigger: 'hover',
    css: {
      keyframes: `@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}`,
      animation: '',
      base: 'position: relative; overflow: hidden; &::before { content: ""; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); }',
    },
    tailwind:
      'relative overflow-hidden before:content-[""] before:absolute before:top-0 before:-left-full before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent hover:before:animate-[shine_0.8s_ease]',
    framerMotion: {},
  },
];

// ============================================================================
// SCROLL INTERACTIONS
// ============================================================================

const scrollInteractions: MicroInteractionPreset[] = [
  {
    id: 'bounce-in',
    name: 'Bounce In',
    description: 'Playful bounce entrance on scroll',
    trigger: 'scroll',
    css: {
      keyframes: `@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}`,
      animation: 'animation: bounceIn 0.6s ease-out;',
    },
    tailwind: 'animate-[bounceIn_0.6s_ease-out]',
    framerMotion: {
      initial: { opacity: 0, scale: 0.3 },
      whileInView: { opacity: 1, scale: 1 },
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    description: 'Slide up from below on scroll',
    trigger: 'scroll',
    css: {
      keyframes: `@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}`,
      animation: 'animation: slideUp 0.5s ease-out;',
    },
    tailwind: 'animate-[slideUp_0.5s_ease-out]',
    framerMotion: {
      initial: { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
  {
    id: 'slide-left',
    name: 'Slide from Left',
    description: 'Slide in from left on scroll',
    trigger: 'scroll',
    css: {
      keyframes: `@keyframes slideLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}`,
      animation: 'animation: slideLeft 0.5s ease-out;',
    },
    tailwind: 'animate-[slideLeft_0.5s_ease-out]',
    framerMotion: {
      initial: { opacity: 0, x: -30 },
      whileInView: { opacity: 1, x: 0 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
  {
    id: 'slide-right',
    name: 'Slide from Right',
    description: 'Slide in from right on scroll',
    trigger: 'scroll',
    css: {
      keyframes: `@keyframes slideRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}`,
      animation: 'animation: slideRight 0.5s ease-out;',
    },
    tailwind: 'animate-[slideRight_0.5s_ease-out]',
    framerMotion: {
      initial: { opacity: 0, x: 30 },
      whileInView: { opacity: 1, x: 0 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Scale up from small on scroll',
    trigger: 'scroll',
    css: {
      keyframes: `@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}`,
      animation: 'animation: zoomIn 0.4s ease-out;',
    },
    tailwind: 'animate-[zoomIn_0.4s_ease-out]',
    framerMotion: {
      initial: { opacity: 0, scale: 0.8 },
      whileInView: { opacity: 1, scale: 1 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
  {
    id: 'flip-in',
    name: 'Flip In',
    description: '3D flip entrance on scroll',
    trigger: 'scroll',
    css: {
      keyframes: `@keyframes flipIn {
  from { opacity: 0; transform: perspective(400px) rotateY(90deg); }
  to { opacity: 1; transform: perspective(400px) rotateY(0); }
}`,
      animation: 'animation: flipIn 0.6s ease-out;',
    },
    tailwind: 'animate-[flipIn_0.6s_ease-out]',
    framerMotion: {
      initial: { opacity: 0, rotateY: 90 },
      whileInView: { opacity: 1, rotateY: 0 },
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  {
    id: 'stagger-children',
    name: 'Stagger Children',
    description: 'Children animate in sequence',
    trigger: 'scroll',
    css: {
      keyframes: `@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}`,
      animation: 'animation: fadeInUp 0.4s ease-out forwards;',
      base: '& > * { opacity: 0; } & > *:nth-child(1) { animation-delay: 0s; } & > *:nth-child(2) { animation-delay: 0.1s; } & > *:nth-child(3) { animation-delay: 0.2s; } & > *:nth-child(4) { animation-delay: 0.3s; } & > *:nth-child(5) { animation-delay: 0.4s; }',
    },
    tailwind:
      '[&>*]:opacity-0 [&>*]:animate-[fadeInUp_0.4s_ease-out_forwards] [&>*:nth-child(1)]:delay-0 [&>*:nth-child(2)]:delay-100 [&>*:nth-child(3)]:delay-200 [&>*:nth-child(4)]:delay-300 [&>*:nth-child(5)]:delay-[400ms]',
    framerMotion: {
      initial: 'hidden',
      whileInView: 'visible',
      variants: {
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1 },
        },
      },
    },
  },
];

// ============================================================================
// FOCUS INTERACTIONS
// ============================================================================

const focusInteractions: MicroInteractionPreset[] = [
  {
    id: 'focus-expand',
    name: 'Focus Expand',
    description: 'Input expands slightly on focus',
    trigger: 'focus',
    css: {
      keyframes: '',
      animation: '',
      base: 'transition: transform 0.2s ease, box-shadow 0.2s ease;',
    },
    tailwind: 'focus:scale-[1.02] focus:shadow-lg transition-all duration-200',
    framerMotion: {
      whileFocus: { scale: 1.02, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
      transition: { duration: 0.2 },
    },
  },
  {
    id: 'focus-underline',
    name: 'Focus Underline',
    description: 'Animated underline on focus',
    trigger: 'focus',
    css: {
      keyframes: '',
      animation: '',
      base: 'position: relative; &::after { content: ""; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background: #6366f1; transition: all 0.3s ease; } &:focus::after { left: 0; width: 100%; }',
    },
    tailwind:
      'relative after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-indigo-500 after:transition-all after:duration-300 focus:after:left-0 focus:after:w-full',
    framerMotion: {},
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    description: 'Text typing cursor effect',
    trigger: 'focus',
    css: {
      keyframes: `@keyframes blink {
  0%, 50% { border-color: transparent; }
  50.01%, 100% { border-color: currentColor; }
}`,
      animation: 'animation: blink 1s step-end infinite;',
      base: 'border-right: 2px solid currentColor;',
    },
    tailwind: 'border-r-2 border-current animate-[blink_1s_step-end_infinite]',
    framerMotion: {
      animate: { borderColor: ['transparent', 'currentColor'] },
      transition: { duration: 1, repeat: Infinity, repeatType: 'reverse' },
    },
  },
];

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

const specialEffects: MicroInteractionPreset[] = [
  {
    id: 'confetti-burst',
    name: 'Confetti Burst',
    description: 'Celebratory confetti explosion',
    trigger: 'click',
    css: {
      keyframes: `@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-200px) rotate(720deg); opacity: 0; }
}`,
      animation: 'animation: confetti 1s ease-out forwards;',
    },
    tailwind: 'animate-[confetti_1s_ease-out_forwards]',
    framerMotion: {
      animate: { y: -200, rotate: 720, opacity: 0 },
      transition: { duration: 1, ease: 'easeOut' },
    },
    requiresJS: true,
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    description: 'Pulsing heartbeat animation',
    trigger: 'hover',
    css: {
      keyframes: `@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}`,
      animation: 'animation: heartbeat 1.5s ease-in-out infinite;',
    },
    tailwind: 'hover:animate-[heartbeat_1.5s_ease-in-out_infinite]',
    framerMotion: {
      whileHover: {
        scale: [1, 1.3, 1, 1.3, 1],
        transition: { duration: 1.5, repeat: Infinity },
      },
    },
  },
  {
    id: 'rubber-band',
    name: 'Rubber Band',
    description: 'Elastic rubber band stretch',
    trigger: 'click',
    css: {
      keyframes: `@keyframes rubberBand {
  0% { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
  100% { transform: scale3d(1, 1, 1); }
}`,
      animation: 'animation: rubberBand 0.8s ease;',
    },
    tailwind: 'active:animate-[rubberBand_0.8s_ease]',
    framerMotion: {
      whileTap: {
        scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
        scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
        transition: { duration: 0.8 },
      },
    },
  },
  {
    id: 'shake',
    name: 'Shake Effect',
    description: 'Quick shake for attention or error',
    trigger: 'click',
    css: {
      keyframes: `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}`,
      animation: 'animation: shake 0.5s ease;',
    },
    tailwind: 'animate-[shake_0.5s_ease]',
    framerMotion: {
      animate: {
        x: [0, -5, 5, -5, 5, -5, 5, 0],
        transition: { duration: 0.5 },
      },
    },
  },
];

// ============================================================================
// EXPORTS
// ============================================================================

export const MICRO_INTERACTION_PRESETS: MicroInteractionPreset[] = [
  ...clickInteractions,
  ...hoverInteractions,
  ...scrollInteractions,
  ...focusInteractions,
  ...specialEffects,
];

export const MICRO_INTERACTION_CATEGORIES: MicroInteractionCategory[] = [
  {
    id: 'click',
    name: 'Click/Tap',
    description: 'Interactions triggered by clicks or taps',
    presets: clickInteractions,
  },
  {
    id: 'hover',
    name: 'Hover',
    description: 'Interactions triggered by mouse hover',
    presets: hoverInteractions,
  },
  {
    id: 'scroll',
    name: 'Scroll/View',
    description: 'Animations triggered when element enters viewport',
    presets: scrollInteractions,
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Interactions for focused elements',
    presets: focusInteractions,
  },
  {
    id: 'special',
    name: 'Special Effects',
    description: 'Unique celebratory and attention-grabbing effects',
    presets: specialEffects,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a preset by ID
 */
export function getMicroInteractionPreset(id: string): MicroInteractionPreset | undefined {
  return MICRO_INTERACTION_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all presets for a specific trigger
 */
export function getPresetsByTrigger(trigger: MicroInteractionTrigger): MicroInteractionPreset[] {
  return MICRO_INTERACTION_PRESETS.filter((preset) => preset.trigger === trigger);
}

/**
 * Generate CSS keyframes and animation rules
 */
export function generateInteractionCSS(preset: MicroInteractionPreset): string {
  const { css } = preset;
  let result = '';

  if (css.keyframes) {
    result += css.keyframes + '\n\n';
  }

  if (css.base) {
    result += css.base + '\n';
  }

  if (css.animation) {
    result += css.animation + '\n';
  }

  return result;
}

/**
 * Check if a preset requires JavaScript for full functionality
 */
export function requiresJavaScript(presetId: string): boolean {
  const preset = getMicroInteractionPreset(presetId);
  return preset?.requiresJS ?? false;
}

/**
 * Get all keyframes from presets (for injecting into stylesheet)
 */
export function getAllKeyframes(): string {
  return MICRO_INTERACTION_PRESETS.filter((preset) => preset.css.keyframes)
    .map((preset) => preset.css.keyframes)
    .join('\n\n');
}

export default {
  MICRO_INTERACTION_PRESETS,
  MICRO_INTERACTION_CATEGORIES,
  getMicroInteractionPreset,
  getPresetsByTrigger,
  generateInteractionCSS,
  requiresJavaScript,
  getAllKeyframes,
};
