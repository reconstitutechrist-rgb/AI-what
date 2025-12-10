/**
 * Animation Presets
 *
 * Pre-built, tested animations for common UI patterns.
 * Each preset includes CSS, Tailwind, and Framer Motion implementations.
 */

// ============================================================================
// TYPES
// ============================================================================

export type AnimationType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'rotate'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'flip';

export type AnimationTrigger = 'hover' | 'click' | 'scroll' | 'load' | 'focus';

export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  type: AnimationType;
  trigger: AnimationTrigger;
  duration: number; // in ms
  easing: string;
  css: {
    keyframes: string;
    animation: string;
    hover?: string;
    transition?: string;
  };
  tailwind: {
    class: string;
    keyframes?: Record<string, Record<string, string>>;
    animation?: Record<string, string>;
  };
  framerMotion: {
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    variants?: Record<string, Record<string, unknown>>;
  };
}

export interface AnimationCategory {
  id: string;
  name: string;
  description: string;
  presets: AnimationPreset[];
}

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

const fadeAnimations: AnimationPreset[] = [
  {
    id: 'fadeIn',
    name: 'Fade In',
    description: 'Simple fade in from transparent',
    type: 'fade',
    trigger: 'load',
    duration: 300,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`,
      animation: 'animation: fadeIn 300ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-fadeIn',
      keyframes: {
        fadeIn: {
          '0%': 'opacity: 0',
          '100%': 'opacity: 1',
        },
      },
      animation: {
        fadeIn: 'fadeIn 300ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
  {
    id: 'fadeInUp',
    name: 'Fade In Up',
    description: 'Fade in while sliding up',
    type: 'fade',
    trigger: 'load',
    duration: 500,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
      animation: 'animation: fadeInUp 500ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-fadeInUp',
      keyframes: {
        fadeInUp: {
          '0%': 'opacity: 0; transform: translateY(20px)',
          '100%': 'opacity: 1; transform: translateY(0)',
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 500ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
  {
    id: 'fadeInDown',
    name: 'Fade In Down',
    description: 'Fade in while sliding down',
    type: 'fade',
    trigger: 'load',
    duration: 500,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
      animation: 'animation: fadeInDown 500ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-fadeInDown',
      keyframes: {
        fadeInDown: {
          '0%': 'opacity: 0; transform: translateY(-20px)',
          '100%': 'opacity: 1; transform: translateY(0)',
        },
      },
      animation: {
        fadeInDown: 'fadeInDown 500ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
  {
    id: 'fadeInLeft',
    name: 'Fade In Left',
    description: 'Fade in while sliding from left',
    type: 'fade',
    trigger: 'load',
    duration: 500,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
      animation: 'animation: fadeInLeft 500ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-fadeInLeft',
      keyframes: {
        fadeInLeft: {
          '0%': 'opacity: 0; transform: translateX(-20px)',
          '100%': 'opacity: 1; transform: translateX(0)',
        },
      },
      animation: {
        fadeInLeft: 'fadeInLeft 500ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
  {
    id: 'fadeInRight',
    name: 'Fade In Right',
    description: 'Fade in while sliding from right',
    type: 'fade',
    trigger: 'load',
    duration: 500,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
      animation: 'animation: fadeInRight 500ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-fadeInRight',
      keyframes: {
        fadeInRight: {
          '0%': 'opacity: 0; transform: translateX(20px)',
          '100%': 'opacity: 1; transform: translateX(0)',
        },
      },
      animation: {
        fadeInRight: 'fadeInRight 500ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
];

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

const scaleAnimations: AnimationPreset[] = [
  {
    id: 'scaleIn',
    name: 'Scale In',
    description: 'Scale up from small to full size',
    type: 'scale',
    trigger: 'load',
    duration: 300,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}`,
      animation: 'animation: scaleIn 300ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-scaleIn',
      keyframes: {
        scaleIn: {
          '0%': 'opacity: 0; transform: scale(0.9)',
          '100%': 'opacity: 1; transform: scale(1)',
        },
      },
      animation: {
        scaleIn: 'scaleIn 300ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
  {
    id: 'scaleInBounce',
    name: 'Scale In Bounce',
    description: 'Scale up with bounce effect',
    type: 'scale',
    trigger: 'load',
    duration: 500,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    css: {
      keyframes: `@keyframes scaleInBounce {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}`,
      animation: 'animation: scaleInBounce 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;',
    },
    tailwind: {
      class: 'animate-scaleInBounce',
      keyframes: {
        scaleInBounce: {
          '0%': 'opacity: 0; transform: scale(0.3)',
          '50%': 'transform: scale(1.05)',
          '70%': 'transform: scale(0.95)',
          '100%': 'opacity: 1; transform: scale(1)',
        },
      },
      animation: {
        scaleInBounce: 'scaleInBounce 500ms cubic-bezier(0.68,-0.55,0.265,1.55) forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 },
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
  },
  {
    id: 'popIn',
    name: 'Pop In',
    description: 'Pop in from center with slight overshoot',
    type: 'scale',
    trigger: 'load',
    duration: 400,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    css: {
      keyframes: `@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  80% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}`,
      animation: 'animation: popIn 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;',
    },
    tailwind: {
      class: 'animate-popIn',
      keyframes: {
        popIn: {
          '0%': 'opacity: 0; transform: scale(0)',
          '80%': 'transform: scale(1.1)',
          '100%': 'opacity: 1; transform: scale(1)',
        },
      },
      animation: {
        popIn: 'popIn 400ms cubic-bezier(0.175,0.885,0.32,1.275) forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, scale: 0 },
      animate: { opacity: 1, scale: 1 },
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
      },
    },
  },
];

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

const slideAnimations: AnimationPreset[] = [
  {
    id: 'slideInLeft',
    name: 'Slide In Left',
    description: 'Slide in from the left edge',
    type: 'slide',
    trigger: 'load',
    duration: 400,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}`,
      animation: 'animation: slideInLeft 400ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-slideInLeft',
      keyframes: {
        slideInLeft: {
          '0%': 'transform: translateX(-100%)',
          '100%': 'transform: translateX(0)',
        },
      },
      animation: {
        slideInLeft: 'slideInLeft 400ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
  {
    id: 'slideInRight',
    name: 'Slide In Right',
    description: 'Slide in from the right edge',
    type: 'slide',
    trigger: 'load',
    duration: 400,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}`,
      animation: 'animation: slideInRight 400ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-slideInRight',
      keyframes: {
        slideInRight: {
          '0%': 'transform: translateX(100%)',
          '100%': 'transform: translateX(0)',
        },
      },
      animation: {
        slideInRight: 'slideInRight 400ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { x: '100%' },
      animate: { x: 0 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
  {
    id: 'slideInUp',
    name: 'Slide In Up',
    description: 'Slide in from the bottom',
    type: 'slide',
    trigger: 'load',
    duration: 400,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes slideInUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}`,
      animation: 'animation: slideInUp 400ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-slideInUp',
      keyframes: {
        slideInUp: {
          '0%': 'transform: translateY(100%)',
          '100%': 'transform: translateY(0)',
        },
      },
      animation: {
        slideInUp: 'slideInUp 400ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { y: '100%' },
      animate: { y: 0 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
  {
    id: 'slideInDown',
    name: 'Slide In Down',
    description: 'Slide in from the top',
    type: 'slide',
    trigger: 'load',
    duration: 400,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes slideInDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}`,
      animation: 'animation: slideInDown 400ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-slideInDown',
      keyframes: {
        slideInDown: {
          '0%': 'transform: translateY(-100%)',
          '100%': 'transform: translateY(0)',
        },
      },
      animation: {
        slideInDown: 'slideInDown 400ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
];

// ============================================================================
// HOVER ANIMATIONS
// ============================================================================

const hoverAnimations: AnimationPreset[] = [
  {
    id: 'hoverLift',
    name: 'Hover Lift',
    description: 'Lift element up on hover',
    type: 'slide',
    trigger: 'hover',
    duration: 200,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: transform 200ms ease-out;',
      hover: 'transform: translateY(-4px);',
    },
    tailwind: {
      class: 'transition-transform duration-200 hover:-translate-y-1',
    },
    framerMotion: {
      whileHover: { y: -4 },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
  {
    id: 'hoverScale',
    name: 'Hover Scale',
    description: 'Scale up slightly on hover',
    type: 'scale',
    trigger: 'hover',
    duration: 200,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: transform 200ms ease-out;',
      hover: 'transform: scale(1.05);',
    },
    tailwind: {
      class: 'transition-transform duration-200 hover:scale-105',
    },
    framerMotion: {
      whileHover: { scale: 1.05 },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
  {
    id: 'hoverGlow',
    name: 'Hover Glow',
    description: 'Add glow effect on hover',
    type: 'fade',
    trigger: 'hover',
    duration: 200,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: box-shadow 200ms ease-out;',
      hover: 'box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);',
    },
    tailwind: {
      class: 'transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    },
    framerMotion: {
      whileHover: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
  {
    id: 'hoverBrightness',
    name: 'Hover Brightness',
    description: 'Brighten element on hover',
    type: 'fade',
    trigger: 'hover',
    duration: 200,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: filter 200ms ease-out;',
      hover: 'filter: brightness(1.1);',
    },
    tailwind: {
      class: 'transition-all duration-200 hover:brightness-110',
    },
    framerMotion: {
      whileHover: { filter: 'brightness(1.1)' },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
  {
    id: 'hoverRotate',
    name: 'Hover Rotate',
    description: 'Slight rotation on hover',
    type: 'rotate',
    trigger: 'hover',
    duration: 200,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: transform 200ms ease-out;',
      hover: 'transform: rotate(3deg);',
    },
    tailwind: {
      class: 'transition-transform duration-200 hover:rotate-3',
    },
    framerMotion: {
      whileHover: { rotate: 3 },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
  {
    id: 'hoverLiftShadow',
    name: 'Hover Lift with Shadow',
    description: 'Lift with enhanced shadow',
    type: 'slide',
    trigger: 'hover',
    duration: 200,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: transform 200ms ease-out, box-shadow 200ms ease-out;',
      hover: 'transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);',
    },
    tailwind: {
      class: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
    },
    framerMotion: {
      whileHover: { y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)' },
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
];

// ============================================================================
// SCROLL ANIMATIONS
// ============================================================================

const scrollAnimations: AnimationPreset[] = [
  {
    id: 'scrollReveal',
    name: 'Scroll Reveal',
    description: 'Fade in when scrolled into view',
    type: 'fade',
    trigger: 'scroll',
    duration: 600,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes scrollReveal {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
      animation: 'animation: scrollReveal 600ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-scrollReveal',
      keyframes: {
        scrollReveal: {
          '0%': 'opacity: 0; transform: translateY(30px)',
          '100%': 'opacity: 1; transform: translateY(0)',
        },
      },
      animation: {
        scrollReveal: 'scrollReveal 600ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: 'easeOut' },
      variants: {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      },
    },
  },
  {
    id: 'scrollFadeScale',
    name: 'Scroll Fade Scale',
    description: 'Fade in with scale when scrolled into view',
    type: 'scale',
    trigger: 'scroll',
    duration: 600,
    easing: 'ease-out',
    css: {
      keyframes: `@keyframes scrollFadeScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}`,
      animation: 'animation: scrollFadeScale 600ms ease-out forwards;',
    },
    tailwind: {
      class: 'animate-scrollFadeScale',
      keyframes: {
        scrollFadeScale: {
          '0%': 'opacity: 0; transform: scale(0.95)',
          '100%': 'opacity: 1; transform: scale(1)',
        },
      },
      animation: {
        scrollFadeScale: 'scrollFadeScale 600ms ease-out forwards',
      },
    },
    framerMotion: {
      initial: { opacity: 0, scale: 0.95 },
      whileInView: { opacity: 1, scale: 1 },
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
];

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

const loadingAnimations: AnimationPreset[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Pulsing opacity animation',
    type: 'pulse',
    trigger: 'load',
    duration: 2000,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}`,
      animation: 'animation: pulse 2s ease-in-out infinite;',
    },
    tailwind: {
      class: 'animate-pulse',
    },
    framerMotion: {
      animate: {
        opacity: [1, 0.5, 1],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 'spin',
    name: 'Spin',
    description: 'Continuous rotation',
    type: 'rotate',
    trigger: 'load',
    duration: 1000,
    easing: 'linear',
    css: {
      keyframes: `@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}`,
      animation: 'animation: spin 1s linear infinite;',
    },
    tailwind: {
      class: 'animate-spin',
    },
    framerMotion: {
      animate: { rotate: 360 },
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
  {
    id: 'bounce',
    name: 'Bounce',
    description: 'Bouncing animation',
    type: 'bounce',
    trigger: 'load',
    duration: 1000,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}`,
      animation: 'animation: bounce 1s infinite;',
    },
    tailwind: {
      class: 'animate-bounce',
    },
    framerMotion: {
      animate: {
        y: ['0%', '-25%', '0%'],
      },
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 'skeleton',
    name: 'Skeleton Loading',
    description: 'Shimmer effect for loading placeholders',
    type: 'fade',
    trigger: 'load',
    duration: 1500,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes skeleton {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}`,
      animation: `background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
background-size: 200% 100%;
animation: skeleton 1.5s ease-in-out infinite;`,
    },
    tailwind: {
      class: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
    },
    framerMotion: {
      animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
];

// ============================================================================
// MICRO INTERACTIONS
// ============================================================================

const microInteractions: AnimationPreset[] = [
  {
    id: 'tapScale',
    name: 'Tap Scale',
    description: 'Scale down on tap/click',
    type: 'scale',
    trigger: 'click',
    duration: 100,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: transform 100ms ease-out;',
      hover: '',
    },
    tailwind: {
      class: 'active:scale-95 transition-transform',
    },
    framerMotion: {
      whileTap: { scale: 0.95 },
      transition: { duration: 0.1, ease: 'easeOut' },
    },
  },
  {
    id: 'buttonPress',
    name: 'Button Press',
    description: 'Realistic button press effect',
    type: 'scale',
    trigger: 'click',
    duration: 150,
    easing: 'ease-out',
    css: {
      keyframes: '',
      animation: '',
      transition: 'transition: transform 150ms ease-out, box-shadow 150ms ease-out;',
      hover: 'transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1);',
    },
    tailwind: {
      class:
        'transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm',
    },
    framerMotion: {
      whileHover: { y: -2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
      whileTap: { y: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
      transition: { duration: 0.15, ease: 'easeOut' },
    },
  },
  {
    id: 'shake',
    name: 'Shake',
    description: 'Shake animation for errors',
    type: 'shake',
    trigger: 'load',
    duration: 500,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}`,
      animation: 'animation: shake 500ms ease-in-out;',
    },
    tailwind: {
      class: 'animate-shake',
      keyframes: {
        shake: {
          '0%, 100%': 'transform: translateX(0)',
          '10%, 30%, 50%, 70%, 90%': 'transform: translateX(-4px)',
          '20%, 40%, 60%, 80%': 'transform: translateX(4px)',
        },
      },
      animation: {
        shake: 'shake 500ms ease-in-out',
      },
    },
    framerMotion: {
      animate: {
        x: [0, -4, 4, -4, 4, -4, 4, 0],
      },
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  },
];

// ============================================================================
// BACKGROUND ANIMATIONS (DALL-E Compatible)
// ============================================================================

const backgroundAnimations: AnimationPreset[] = [
  {
    id: 'gradientShift',
    name: 'Gradient Shift',
    description: 'Smooth animated gradient background that shifts colors',
    type: 'fade',
    trigger: 'load',
    duration: 8000,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}`,
      animation: `background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
background-size: 400% 400%;
animation: gradientShift 8s ease-in-out infinite;`,
    },
    tailwind: {
      class: 'animate-gradientShift bg-gradient-to-r from-orange-400 via-pink-500 to-cyan-400',
      keyframes: {
        gradientShift: {
          '0%, 100%': 'background-position: 0% 50%',
          '50%': 'background-position: 100% 50%',
        },
      },
      animation: {
        gradientShift: 'gradientShift 8s ease-in-out infinite',
      },
    },
    framerMotion: {
      animate: {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      },
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 'floatingParticles',
    name: 'Floating Particles',
    description: 'Gentle floating particle effect using CSS shapes',
    type: 'fade',
    trigger: 'load',
    duration: 15000,
    easing: 'linear',
    css: {
      keyframes: `@keyframes floatingParticles {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}`,
      animation: `animation: floatingParticles 15s linear infinite;
position: absolute;
width: 10px;
height: 10px;
background: rgba(255, 255, 255, 0.3);
border-radius: 50%;`,
    },
    tailwind: {
      class: 'animate-floatingParticles',
      keyframes: {
        floatingParticles: {
          '0%': 'transform: translateY(100vh) rotate(0deg); opacity: 0',
          '10%': 'opacity: 1',
          '90%': 'opacity: 1',
          '100%': 'transform: translateY(-100vh) rotate(720deg); opacity: 0',
        },
      },
      animation: {
        floatingParticles: 'floatingParticles 15s linear infinite',
      },
    },
    framerMotion: {
      initial: { y: '100vh', rotate: 0, opacity: 0 },
      animate: { y: '-100vh', rotate: 720, opacity: [0, 1, 1, 0] },
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
  {
    id: 'liquidWave',
    name: 'Liquid Wave',
    description: 'Smooth wave motion like liquid or water',
    type: 'slide',
    trigger: 'load',
    duration: 6000,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes liquidWave {
  0% {
    transform: translateX(-50%) translateY(0) rotate(0deg);
  }
  50% {
    transform: translateX(-50%) translateY(-20px) rotate(180deg);
  }
  100% {
    transform: translateX(-50%) translateY(0) rotate(360deg);
  }
}`,
      animation: `animation: liquidWave 6s ease-in-out infinite;
border-radius: 45% 55% 55% 45% / 55% 45% 55% 45%;
background: linear-gradient(135deg, rgba(99, 102, 241, 0.6), rgba(168, 85, 247, 0.6));`,
    },
    tailwind: {
      class: 'animate-liquidWave',
      keyframes: {
        liquidWave: {
          '0%, 100%': 'transform: translateX(-50%) translateY(0) rotate(0deg)',
          '50%': 'transform: translateX(-50%) translateY(-20px) rotate(180deg)',
        },
      },
      animation: {
        liquidWave: 'liquidWave 6s ease-in-out infinite',
      },
    },
    framerMotion: {
      animate: {
        y: [0, -20, 0],
        rotate: [0, 180, 360],
      },
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 'auroraBorealis',
    name: 'Aurora Borealis',
    description: 'Northern lights shimmer effect with multiple layers',
    type: 'fade',
    trigger: 'load',
    duration: 12000,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes auroraBorealis {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1) translateY(0);
  }
  25% {
    opacity: 0.8;
    transform: scale(1.1) translateY(-10px);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05) translateY(-5px);
  }
  75% {
    opacity: 0.9;
    transform: scale(1.15) translateY(-15px);
  }
}`,
      animation: `background: linear-gradient(180deg,
  rgba(0, 255, 128, 0.3) 0%,
  rgba(0, 200, 255, 0.3) 25%,
  rgba(128, 0, 255, 0.3) 50%,
  rgba(255, 0, 128, 0.3) 75%,
  transparent 100%);
filter: blur(40px);
animation: auroraBorealis 12s ease-in-out infinite;`,
    },
    tailwind: {
      class: 'animate-auroraBorealis blur-3xl',
      keyframes: {
        auroraBorealis: {
          '0%, 100%': 'opacity: 0.4; transform: scale(1) translateY(0)',
          '25%': 'opacity: 0.8; transform: scale(1.1) translateY(-10px)',
          '50%': 'opacity: 0.6; transform: scale(1.05) translateY(-5px)',
          '75%': 'opacity: 0.9; transform: scale(1.15) translateY(-15px)',
        },
      },
      animation: {
        auroraBorealis: 'auroraBorealis 12s ease-in-out infinite',
      },
    },
    framerMotion: {
      animate: {
        opacity: [0.4, 0.8, 0.6, 0.9, 0.4],
        scale: [1, 1.1, 1.05, 1.15, 1],
        y: [0, -10, -5, -15, 0],
      },
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 'morphingBlob',
    name: 'Morphing Blob',
    description: 'Organic blob shape that continuously morphs',
    type: 'scale',
    trigger: 'load',
    duration: 10000,
    easing: 'ease-in-out',
    css: {
      keyframes: `@keyframes morphingBlob {
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    transform: rotate(0deg);
  }
  25% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
  }
  50% {
    border-radius: 50% 60% 30% 60% / 30% 50% 70% 50%;
    transform: rotate(180deg);
  }
  75% {
    border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%;
  }
}`,
      animation: `background: linear-gradient(135deg, #667eea, #764ba2);
animation: morphingBlob 10s ease-in-out infinite;`,
    },
    tailwind: {
      class: 'animate-morphingBlob bg-gradient-to-br from-indigo-500 to-purple-600',
      keyframes: {
        morphingBlob: {
          '0%, 100%': 'border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg)',
          '25%': 'border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%',
          '50%': 'border-radius: 50% 60% 30% 60% / 30% 50% 70% 50%; transform: rotate(180deg)',
          '75%': 'border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%',
        },
      },
      animation: {
        morphingBlob: 'morphingBlob 10s ease-in-out infinite',
      },
    },
    framerMotion: {
      animate: {
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '30% 60% 70% 40% / 50% 60% 30% 60%',
          '50% 60% 30% 60% / 30% 50% 70% 50%',
          '60% 40% 60% 30% / 70% 30% 50% 60%',
          '60% 40% 30% 70% / 60% 30% 70% 40%',
        ],
        rotate: [0, 0, 180, 180, 360],
      },
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 'noiseTexture',
    name: 'Noise Texture',
    description: 'Subtle animated grain/noise overlay',
    type: 'fade',
    trigger: 'load',
    duration: 200,
    easing: 'steps(10)',
    css: {
      keyframes: `@keyframes noiseTexture {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -15%); }
  40% { transform: translate(-5%, 15%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 10%); }
  80% { transform: translate(3%, 15%); }
  90% { transform: translate(-10%, 10%); }
}`,
      animation: `background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
opacity: 0.05;
animation: noiseTexture 200ms steps(10) infinite;`,
    },
    tailwind: {
      class: 'animate-noiseTexture opacity-5',
      keyframes: {
        noiseTexture: {
          '0%, 100%': 'transform: translate(0, 0)',
          '10%': 'transform: translate(-5%, -10%)',
          '30%': 'transform: translate(7%, -15%)',
          '50%': 'transform: translate(-15%, 10%)',
          '70%': 'transform: translate(0%, 10%)',
          '90%': 'transform: translate(-10%, 10%)',
        },
      },
      animation: {
        noiseTexture: 'noiseTexture 200ms steps(10) infinite',
      },
    },
    framerMotion: {
      animate: {
        x: ['0%', '-5%', '7%', '-15%', '0%', '-10%', '0%'],
        y: ['0%', '-10%', '-15%', '10%', '10%', '10%', '0%'],
      },
      transition: {
        duration: 0.2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
];

// ============================================================================
// ALL PRESETS
// ============================================================================

export const ANIMATION_PRESETS: AnimationPreset[] = [
  ...fadeAnimations,
  ...scaleAnimations,
  ...slideAnimations,
  ...hoverAnimations,
  ...scrollAnimations,
  ...loadingAnimations,
  ...microInteractions,
  ...backgroundAnimations,
];

export const ANIMATION_CATEGORIES: AnimationCategory[] = [
  {
    id: 'fade',
    name: 'Fade Animations',
    description: 'Opacity-based entrance animations',
    presets: fadeAnimations,
  },
  {
    id: 'scale',
    name: 'Scale Animations',
    description: 'Size-based entrance animations',
    presets: scaleAnimations,
  },
  {
    id: 'slide',
    name: 'Slide Animations',
    description: 'Position-based entrance animations',
    presets: slideAnimations,
  },
  {
    id: 'hover',
    name: 'Hover Effects',
    description: 'Interactive hover animations',
    presets: hoverAnimations,
  },
  {
    id: 'scroll',
    name: 'Scroll Animations',
    description: 'Scroll-triggered reveal animations',
    presets: scrollAnimations,
  },
  {
    id: 'loading',
    name: 'Loading Animations',
    description: 'Continuous loading state animations',
    presets: loadingAnimations,
  },
  {
    id: 'micro',
    name: 'Micro Interactions',
    description: 'Small interactive feedback animations',
    presets: microInteractions,
  },
  {
    id: 'background',
    name: 'Background Animations',
    description: 'Animated backgrounds and visual effects (DALL-E compatible)',
    presets: backgroundAnimations,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get animation preset by ID
 */
export function getAnimationPreset(id: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get animations by type
 */
export function getAnimationsByType(type: AnimationType): AnimationPreset[] {
  return ANIMATION_PRESETS.filter((preset) => preset.type === type);
}

/**
 * Get animations by trigger
 */
export function getAnimationsByTrigger(trigger: AnimationTrigger): AnimationPreset[] {
  return ANIMATION_PRESETS.filter((preset) => preset.trigger === trigger);
}

/**
 * Match detected animation to closest preset
 */
export function matchAnimationToPreset(detected: {
  type?: string;
  property?: string;
  duration?: number | string;
  easing?: string;
}): AnimationPreset | null {
  // Score each preset based on match
  let bestMatch: AnimationPreset | null = null;
  let bestScore = 0;

  // Parse duration to milliseconds if it's a string
  const parseDuration = (d: number | string | undefined): number | undefined => {
    if (d === undefined) return undefined;
    if (typeof d === 'number') return d;
    // Parse CSS duration strings like "0.3s", "300ms"
    const match = String(d).match(/^([\d.]+)(s|ms)?$/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2] || 'ms';
      return unit === 's' ? value * 1000 : value;
    }
    return undefined;
  };

  const detectedDuration = parseDuration(detected.duration);

  for (const preset of ANIMATION_PRESETS) {
    let score = 0;

    // Type match
    if (detected.type && preset.type === detected.type) {
      score += 3;
    }

    // Duration similarity (within 200ms)
    if (detectedDuration && Math.abs(preset.duration - detectedDuration) < 200) {
      score += 2;
    }

    // Easing match
    if (detected.easing && preset.easing.includes(detected.easing)) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = preset;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

/**
 * Generate Tailwind config for custom animations
 */
export function generateTailwindAnimationConfig(presets: AnimationPreset[]): {
  keyframes: Record<string, Record<string, string>>;
  animation: Record<string, string>;
} {
  const keyframes: Record<string, Record<string, string>> = {};
  const animation: Record<string, string> = {};

  for (const preset of presets) {
    if (preset.tailwind.keyframes) {
      Object.assign(keyframes, preset.tailwind.keyframes);
    }
    if (preset.tailwind.animation) {
      Object.assign(animation, preset.tailwind.animation);
    }
  }

  return { keyframes, animation };
}
