/**
 * Component State and Interaction Types (AI-Controllable)
 * Hover, active, focus, disabled, loading states, scroll animations, gestures
 */

// Component State Types (AI-Controllable)
export type ComponentStateType = 'hover' | 'active' | 'focus' | 'disabled' | 'loading';

export interface AppliedComponentState {
  state: ComponentStateType;
  presetId: string;
  targetElement: string;
  css?: string;
  tailwind?: string;
}

// Micro-Interaction Types (AI-Controllable)
export type MicroInteractionTrigger = 'hover' | 'click' | 'focus' | 'scroll';

export interface AppliedMicroInteraction {
  interactionId: string;
  targetElement: string;
  trigger: MicroInteractionTrigger;
  css?: string;
  tailwind?: string;
}

/**
 * Complete element interactions configuration
 * Supports hover, active, focus, disabled, loading states, scroll animations, and gestures
 */
export interface ElementInteractions {
  hover?: {
    transform?: string; // e.g., "scale(1.05)"
    boxShadow?: string;
    backgroundColor?: string;
    borderColor?: string;
    opacity?: number;
    transition?: string; // e.g., "all 0.2s ease"
  };
  active?: {
    transform?: string;
    boxShadow?: string;
    backgroundColor?: string;
    scale?: number;
  };
  focus?: {
    outline?: string;
    boxShadow?: string;
    borderColor?: string;
    ring?: string; // Tailwind ring utilities
  };
  disabled?: {
    opacity?: number;
    cursor?: string;
    filter?: string; // e.g., "grayscale(100%)"
    pointerEvents?: 'none' | 'auto';
  };
  loading?: {
    type: 'spinner' | 'skeleton' | 'progress' | 'pulse';
    placeholder?: string;
    color?: string;
    size?: 'sm' | 'md' | 'lg';
  };
  scroll?: {
    trigger: 'enter' | 'exit' | 'progress';
    animation: string; // e.g., "fadeInUp", "slideInLeft"
    delay?: number; // ms
    duration?: number; // ms
    threshold?: number; // 0-1, when to trigger
  };
  gesture?: {
    type: 'swipe' | 'drag' | 'pinch' | 'long-press';
    direction?: 'left' | 'right' | 'up' | 'down' | 'any';
    action: string; // e.g., "delete", "reorder", "dismiss"
    feedback?: 'visual' | 'haptic' | 'both';
  };
  pageTransition?: {
    type: 'fade' | 'slide' | 'scale' | 'flip';
    duration?: number; // ms
    direction?: 'left' | 'right' | 'up' | 'down';
    easing?: string;
  };
}

/**
 * Animation reference for element
 */
export interface AnimationRef {
  id: string;
  trigger: 'load' | 'scroll' | 'hover' | 'click' | 'focus';
  delay?: number;
  duration?: number;
  iterationCount?: number | 'infinite';
}

/**
 * Custom animation definition
 */
export interface CustomAnimation {
  id: string;
  name: string;
  keyframes: Record<string, Record<string, string>>; // e.g., { "0%": { opacity: "0" }, "100%": { opacity: "1" } }
  timing: string; // e.g., "ease-in-out"
  duration: number; // ms
  iterationCount: number | 'infinite';
}

/**
 * Visual effect configuration for non-CSS effects (particles, canvas, complex motion)
 * Detected by AI analysis and rendered by VisualEffectRenderer
 */
export interface VisualEffect {
  id?: string;
  type: 'particles' | 'canvas' | 'lottie' | 'custom' | 'css-animation' | 'particle-system' | 'canvas-effect';
  enabled?: boolean;
  
  /** Human-readable description of the effect */
  description?: string;
  
  /** Trigger for the effect */
  trigger?: 'load' | 'scroll' | 'hover' | 'click' | 'inView' | 'focus' | 'always';
  
  /** Particle effect configuration */
  particleConfig?: {
    count?: number;
    size?: { min: number; max: number };
    opacity?: { start: number; end: number };
    speed?: 'slow' | 'medium' | 'fast';
    direction?: 'up' | 'down' | 'left' | 'right' | 'radial' | 'random';
    shape?: 'circle' | 'square' | 'star';
    colors?: string[]; // Particle colors
  };
  
  /** Canvas-based effect configuration */
  canvasEffect?: {
    type: 'gradient-shift' | 'wave' | 'morph' | 'aurora' | 'noise';
    intensity?: number;
    colors?: string[];
    speed?: number;
  };
  
  /** Lottie animation URL */
  lottieUrl?: string;
  
  /** Custom effect code/config */
  customConfig?: Record<string, unknown>;
  
  /** CSS keyframes definition for css-animation type */
  cssKeyframes?: Record<string, Record<string, string>>;
  
  /** Z-index layering */
  zIndex?: number;
  
  /** Positioning */
  position?: 'background' | 'foreground' | 'overlay';
  
  /** Opacity of the effect layer */
  opacity?: number;
}
