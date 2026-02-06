/**
 * Video Analysis Types
 * Video frame extraction, animation detection, and transition analysis
 */

import type { AnimationSequence, ParallaxConfig, ScrollAnimationConfig } from './animations';
import type { CompleteDesignAnalysis } from './analysis';

// ============================================================================
// VIDEO ANALYSIS TYPES
// ============================================================================

/**
 * Extracted video frame
 */
export interface ExtractedFrame {
  index: number;
  timestamp: number; // in seconds
  imageDataUrl: string;
  isKeyFrame: boolean;
}

/**
 * Detected animation from video
 */
export interface DetectedAnimation {
  id: string;
  type:
    | 'fade'
    | 'slide'
    | 'scale'
    | 'rotate'
    | 'color-change'
    | 'blur'
    | 'parallax'
    | 'hover-effect'
    | 'scroll-reveal'
    | 'page-transition'
    | 'loading'
    | 'micro-interaction'
    | 'custom'
    // Background animation types (DALL-E compatible)
    | 'gradient-shift'
    | 'particle-flow'
    | 'wave'
    | 'morph'
    | 'aurora'
    | 'noise-texture';
  element: string; // Description of animated element
  property: string; // CSS property being animated
  fromValue: string;
  toValue: string;
  duration: number | string; // in milliseconds or CSS string (e.g., '0.3s')
  easing: string;
  delay?: number | string;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  cssKeyframes?: string;
  cssAnimation?: string;
  tailwindConfig?: Record<string, unknown>;
  framerMotionVariants?: Record<string, unknown>;
  confidence: number;
  matchedPreset?: string;
  presetConfidence?: number;
  // NEW: Element targeting for animation binding
  targetElement?: string; // CSS selector or element ID to apply animation to
  // NEW: DALL-E generated background support
  generatedImageUrl?: string; // URL of AI-generated background image
  generatedPrompt?: string; // Prompt used to generate the image
  // Animation sequence support (for chained animations)
  sequence?: AnimationSequence;
  // Enhanced parallax configuration
  parallaxConfig?: ParallaxConfig;
  // Scroll-triggered animation settings
  scrollConfig?: ScrollAnimationConfig;
}

/**
 * Detected page/section transition
 */
export interface DetectedTransition {
  id: string;
  type: 'page' | 'section' | 'modal' | 'drawer' | 'dropdown' | 'fade' | 'component' | 'state';
  animation?: string;
  duration: number | string;
  easing: string;
  css?: string;
  framerMotion?: Record<string, unknown>;
  fromState?: string;
  toState?: string;
  affectedElements?: string[];
}

/**
 * Frame summary (without image data, for API responses)
 */
export interface FrameSummary {
  index: number;
  timestamp: number;
  isKeyFrame?: boolean;
}

/**
 * Video analysis result
 */
export interface VideoAnalysisResult {
  id?: string;
  duration?: number; // in seconds
  fps?: number;
  width?: number;
  height?: number;
  frames: FrameSummary[] | ExtractedFrame[];
  keyFrames?: ExtractedFrame[];
  animations: DetectedAnimation[];
  transitions: DetectedTransition[];
  designAnalysis?: CompleteDesignAnalysis; // From first key frame
  designSummary?: {
    dominantColors: string[];
    detectedFonts: string[];
    layoutType: string;
    components: string[];
  };
  metadata?: {
    duration: number;
    frameCount: number;
    keyFrameCount: number;
    analysisMode: string;
  };
}
