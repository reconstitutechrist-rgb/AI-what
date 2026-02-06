/**
 * Background Animation Types (AI-Controllable)
 * Particles, floating shapes, gradients, aurora, waves, custom images
 */

// ============================================================================
// Background Animation Types (AI-Controllable)
// ============================================================================

export type BackgroundEffectType =
  | 'particles'
  | 'floating-shapes'
  | 'gradient-animation'
  | 'parallax-dots'
  | 'mesh-gradient'
  | 'aurora'
  | 'waves'
  | 'custom-image'
  | 'none';

export interface BackgroundEffectConfig {
  type: BackgroundEffectType;
  enabled: boolean;
  /** Intensity of the effect (affects particle count, speed, etc.) */
  intensity: 'subtle' | 'medium' | 'strong';
  /** Colors used by the effect */
  colors?: string[];
  /** Animation speed multiplier (1.0 = normal) */
  speed?: number;
  /** Opacity of the effect layer (0-1) */
  opacity?: number;
  /** Whether the effect responds to mouse movement */
  interactive?: boolean;
}

export interface ParticlesConfig extends BackgroundEffectConfig {
  type: 'particles';
  /** Number of particles (auto-calculated from intensity if not set) */
  count?: number;
  /** Particle shape */
  shape: 'circle' | 'square' | 'triangle' | 'star';
  /** Min and max particle size in pixels */
  sizeRange: [number, number];
  /** Whether particles should connect with lines */
  connectLines?: boolean;
  /** Max distance for line connections */
  lineDistance?: number;
}

export interface FloatingShapesConfig extends BackgroundEffectConfig {
  type: 'floating-shapes';
  /** Shapes to float */
  shapes: Array<'circle' | 'square' | 'triangle' | 'blob'>;
  /** Number of shapes */
  count?: number;
  /** Whether shapes should blur */
  blur?: boolean;
}

export interface GradientAnimationConfig extends BackgroundEffectConfig {
  type: 'gradient-animation';
  /** Gradient colors (min 2) */
  colors: string[];
  /** Animation type */
  animationType: 'shift' | 'rotate' | 'pulse' | 'wave';
  /** Gradient angle for shift/rotate */
  angle?: number;
}

export interface AuroraConfig extends BackgroundEffectConfig {
  type: 'aurora';
  /** Aurora wave colors */
  colors: string[];
  /** Number of aurora waves */
  waves?: number;
}

export interface WavesConfig extends BackgroundEffectConfig {
  type: 'waves';
  /** Wave colors */
  colors: string[];
  /** Number of wave layers */
  layers?: number;
  /** Wave amplitude */
  amplitude?: 'small' | 'medium' | 'large';
}

export interface CustomImageConfig extends Omit<BackgroundEffectConfig, 'intensity'> {
  type: 'custom-image';
  /** URL to the generated or uploaded background image */
  imageUrl: string;
  /** Background size CSS property */
  size?: 'cover' | 'contain' | 'auto';
  /** Background position CSS property */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  /** Whether the background scrolls with content or stays fixed */
  attachment?: 'scroll' | 'fixed';
  /** Blend mode for combining with content */
  blend?: 'normal' | 'overlay' | 'multiply' | 'screen' | 'soft-light';
  /** Optional intensity override (not used for custom images, kept for type compatibility) */
  intensity?: 'subtle' | 'medium' | 'strong';
}

/**
 * Union type for all background effect configurations
 * Used in EffectsSettings to allow any specific background effect type
 */
export type AnyBackgroundEffectConfig =
  | BackgroundEffectConfig
  | ParticlesConfig
  | FloatingShapesConfig
  | GradientAnimationConfig
  | AuroraConfig
  | WavesConfig
  | CustomImageConfig;
