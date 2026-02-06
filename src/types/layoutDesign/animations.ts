/**
 * Animation Sequence Types
 * Animation sequences, parallax, and scroll-triggered animations
 */

// ============================================================================
// ANIMATION SEQUENCE TYPES
// ============================================================================

/**
 * Animation sequence for chained/sequential animations
 * Allows multiple animations to be played in order
 */
export interface AnimationSequence {
  id: string;
  name: string;
  description?: string;
  steps: AnimationStep[];
  trigger: 'load' | 'scroll' | 'hover' | 'click' | 'inView' | 'focus';
  triggerOffset?: number; // For scroll trigger, pixels from viewport
  loop?: boolean;
  loopDelay?: number; // Delay between loop iterations
  reverseOnComplete?: boolean;
}

/**
 * Single step in an animation sequence
 */
export interface AnimationStep {
  id: string;
  animationType: 'fade' | 'slide' | 'scale' | 'rotate' | 'color' | 'blur' | 'custom';
  element: string; // CSS selector or element description
  property?: string; // CSS property (for custom)
  fromValue?: string;
  toValue?: string;
  duration: number; // milliseconds
  delay: number; // ms after previous step completes
  overlap?: number; // ms to overlap with next (negative = gap)
  easing: string; // CSS easing function
  stagger?: {
    enabled: boolean;
    delay: number; // Delay between each child element
    from: 'start' | 'center' | 'end' | 'random';
  };
}

/**
 * Enhanced parallax configuration
 */
export interface ParallaxConfig {
  enabled: boolean;
  depth: number; // 0-1, how much element moves relative to scroll
  direction: 'vertical' | 'horizontal' | 'both';
  perspective?: number; // For 3D parallax effect (px)
  speed?: number; // Multiplier for scroll speed
  scale?: {
    start: number;
    end: number;
  };
  opacity?: {
    start: number;
    end: number;
  };
  rotation?: {
    axis: 'x' | 'y' | 'z';
    degrees: number;
  };
  offset?: {
    x: number;
    y: number;
  };
  smoothing?: number; // 0-1, how smooth the parallax effect is
  targetElement?: string; // CSS selector
}

/**
 * Scroll-triggered animation configuration
 */
export interface ScrollAnimationConfig {
  trigger: 'enter' | 'leave' | 'center' | 'custom';
  customTrigger?: number; // 0-1, viewport position
  scrub?: boolean | number; // Link animation to scroll position
  pin?: boolean; // Pin element during animation
  pinSpacing?: boolean;
  markers?: boolean; // Debug markers
  start?: string; // e.g., "top center"
  end?: string; // e.g., "bottom top"
}
