/**
 * Advanced Effects Types (AI-Controllable)
 * Glassmorphism, neumorphism, gradient borders, text effects, custom shadows, mesh gradients
 */

// ============================================================================
// Advanced Effects Types (AI-Controllable)
// ============================================================================

export interface AdvancedEffectsConfig {
  glassmorphism?: GlassmorphismConfig;
  neumorphism?: NeumorphismConfig;
  gradientBorder?: GradientBorderConfig;
  textEffect?: TextEffectConfig;
  customShadow?: CustomShadowConfig;
  meshGradient?: MeshGradientConfig; // For high-fidelity background detection
}

export interface MeshGradientConfig {
  enabled: boolean;
  colors: string[];
  speed?: number;
  opacity?: number;
  blur?: number; // px
}

export interface GlassmorphismConfig {
  enabled: boolean;
  blur: number; // px
  opacity: number; // 0-1
  saturation: number; // 0-200%
  borderOpacity: number;
  targetElement?: string;
}

export interface NeumorphismConfig {
  enabled: boolean;
  style: 'flat' | 'pressed' | 'convex' | 'concave';
  intensity: 'subtle' | 'medium' | 'strong';
  lightAngle: number; // degrees
  targetElement?: string;
}

export interface GradientBorderConfig {
  enabled: boolean;
  colors: string[];
  angle: number;
  width: number;
  animated?: boolean;
  targetElement?: string;
}

export interface TextEffectConfig {
  type: 'gradient' | 'glow' | 'outline' | 'shadow' | 'none';
  colors?: string[];
  intensity?: 'subtle' | 'medium' | 'strong';
  targetElement?: string;
}

export interface CustomShadowConfig {
  layers: Array<{
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
    inset?: boolean;
  }>;
  targetElement?: string;
}
