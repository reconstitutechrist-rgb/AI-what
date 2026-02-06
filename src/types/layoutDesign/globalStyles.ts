/**
 * Global Style Types
 * Typography, colors, spacing, effects settings
 */

import type { CustomizableValue } from './common';
import type { AdvancedEffectsConfig } from './advancedEffects';
import type { AnyBackgroundEffectConfig } from './backgroundEffects';

// ============================================================================
// Global Style Types
// ============================================================================

export interface TypographySettings {
  fontFamily: string;
  headingFont?: string;
  headingWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  bodyWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  headingSize: CustomizableValue<'sm' | 'base' | 'lg' | 'xl'> | 'sm' | 'base' | 'lg' | 'xl';
  bodySize: CustomizableValue<'xs' | 'sm' | 'base'> | 'xs' | 'sm' | 'base';
  lineHeight: CustomizableValue<'tight' | 'normal' | 'relaxed'> | 'tight' | 'normal' | 'relaxed';
  letterSpacing: CustomizableValue<'tight' | 'normal' | 'wide'> | 'tight' | 'normal' | 'wide';
}

export interface ColorSettings {
  primary: string;
  secondary?: string;
  accent?: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

export interface SpacingSettings {
  density: CustomizableValue<'compact' | 'normal' | 'relaxed'> | 'compact' | 'normal' | 'relaxed';
  containerWidth:
    | CustomizableValue<'narrow' | 'standard' | 'wide' | 'full'>
    | 'narrow'
    | 'standard'
    | 'wide'
    | 'full';
  sectionPadding: CustomizableValue<'sm' | 'md' | 'lg' | 'xl'> | 'sm' | 'md' | 'lg' | 'xl';
  componentGap: CustomizableValue<'sm' | 'md' | 'lg'> | 'sm' | 'md' | 'lg';
}

export interface EffectsSettings {
  borderRadius:
    | CustomizableValue<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>
    | 'none'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'full';
  shadows:
    | CustomizableValue<'none' | 'subtle' | 'medium' | 'strong'>
    | 'none'
    | 'subtle'
    | 'medium'
    | 'strong';
  animations: 'none' | 'subtle' | 'smooth' | 'playful';
  blur:
    | CustomizableValue<'none' | 'subtle' | 'medium' | 'strong'>
    | 'none'
    | 'subtle'
    | 'medium'
    | 'strong';
  gradients: boolean;
  // Advanced Effects (AI-controllable)
  advancedEffects?: AdvancedEffectsConfig;
  // Background animations (particles, floating shapes, etc.) or custom AI-generated images
  backgroundEffect?: AnyBackgroundEffectConfig;
}

export interface GlobalStyles {
  typography: TypographySettings;
  colors: ColorSettings;
  spacing: SpacingSettings;
  effects: EffectsSettings;
}
