/**
 * Advanced Effects Presets
 *
 * AI-controllable visual effect presets including glassmorphism, neumorphism,
 * gradient borders, and text effects. Each preset includes CSS, Tailwind, and
 * optional Framer Motion implementations.
 */

import type {
  GlassmorphismConfig,
  NeumorphismConfig,
  GradientBorderConfig,
  TextEffectConfig,
  CustomShadowConfig,
} from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export type AdvancedEffectType =
  | 'glassmorphism'
  | 'neumorphism'
  | 'gradient-border'
  | 'text-effect'
  | 'shadow';

export interface AdvancedEffectPreset {
  id: string;
  name: string;
  description: string;
  type: AdvancedEffectType;
  config:
    | GlassmorphismConfig
    | NeumorphismConfig
    | GradientBorderConfig
    | TextEffectConfig
    | CustomShadowConfig;
  css: string;
  tailwind: string;
  framerMotion?: Record<string, unknown>;
}

export interface AdvancedEffectCategory {
  id: string;
  name: string;
  description: string;
  presets: AdvancedEffectPreset[];
}

// ============================================================================
// GLASSMORPHISM PRESETS
// ============================================================================

const glassmorphismPresets: AdvancedEffectPreset[] = [
  {
    id: 'glass-subtle',
    name: 'Subtle Glass',
    description: 'Light frosted glass effect for cards and panels',
    type: 'glassmorphism',
    config: {
      enabled: true,
      blur: 10,
      opacity: 0.7,
      saturation: 180,
      borderOpacity: 0.2,
    } as GlassmorphismConfig,
    css: 'background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px) saturate(180%); -webkit-backdrop-filter: blur(10px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.2);',
    tailwind: 'bg-white/70 backdrop-blur-md backdrop-saturate-[180%] border border-white/20',
  },
  {
    id: 'glass-medium',
    name: 'Medium Glass',
    description: 'Balanced frosted glass with more blur',
    type: 'glassmorphism',
    config: {
      enabled: true,
      blur: 16,
      opacity: 0.6,
      saturation: 180,
      borderOpacity: 0.25,
    } as GlassmorphismConfig,
    css: 'background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.25);',
    tailwind: 'bg-white/60 backdrop-blur-xl backdrop-saturate-[180%] border border-white/25',
  },
  {
    id: 'glass-strong',
    name: 'Strong Glass',
    description: 'Heavy frosted effect for prominent elements',
    type: 'glassmorphism',
    config: {
      enabled: true,
      blur: 24,
      opacity: 0.5,
      saturation: 200,
      borderOpacity: 0.3,
    } as GlassmorphismConfig,
    css: 'background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(24px) saturate(200%); -webkit-backdrop-filter: blur(24px) saturate(200%); border: 1px solid rgba(255, 255, 255, 0.3);',
    tailwind: 'bg-white/50 backdrop-blur-2xl backdrop-saturate-200 border border-white/30',
  },
  {
    id: 'glass-dark',
    name: 'Dark Glass',
    description: 'Dark frosted glass for dark themes',
    type: 'glassmorphism',
    config: {
      enabled: true,
      blur: 16,
      opacity: 0.3,
      saturation: 150,
      borderOpacity: 0.1,
    } as GlassmorphismConfig,
    css: 'background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(16px) saturate(150%); -webkit-backdrop-filter: blur(16px) saturate(150%); border: 1px solid rgba(255, 255, 255, 0.1);',
    tailwind: 'bg-black/30 backdrop-blur-xl backdrop-saturate-150 border border-white/10',
  },
  {
    id: 'glass-colored',
    name: 'Colored Glass',
    description: 'Tinted glass effect with purple hue',
    type: 'glassmorphism',
    config: {
      enabled: true,
      blur: 20,
      opacity: 0.4,
      saturation: 180,
      borderOpacity: 0.2,
    } as GlassmorphismConfig,
    css: 'background: rgba(139, 92, 246, 0.2); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(139, 92, 246, 0.3);',
    tailwind:
      'bg-purple-500/20 backdrop-blur-xl backdrop-saturate-[180%] border border-purple-500/30',
  },
];

// ============================================================================
// NEUMORPHISM PRESETS
// ============================================================================

const neumorphismPresets: AdvancedEffectPreset[] = [
  {
    id: 'neu-flat',
    name: 'Flat Neumorphism',
    description: 'Subtle raised surface effect',
    type: 'neumorphism',
    config: {
      enabled: true,
      style: 'flat',
      intensity: 'medium',
      lightAngle: 145,
    } as NeumorphismConfig,
    css: 'background: #e0e5ec; box-shadow: 9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff; border-radius: 12px;',
    tailwind: 'bg-[#e0e5ec] shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] rounded-xl',
  },
  {
    id: 'neu-pressed',
    name: 'Pressed Neumorphism',
    description: 'Inset pressed button effect',
    type: 'neumorphism',
    config: {
      enabled: true,
      style: 'pressed',
      intensity: 'medium',
      lightAngle: 145,
    } as NeumorphismConfig,
    css: 'background: #e0e5ec; box-shadow: inset 9px 9px 16px #a3b1c6, inset -9px -9px 16px #ffffff; border-radius: 12px;',
    tailwind:
      'bg-[#e0e5ec] shadow-[inset_9px_9px_16px_#a3b1c6,inset_-9px_-9px_16px_#ffffff] rounded-xl',
  },
  {
    id: 'neu-convex',
    name: 'Convex Neumorphism',
    description: 'Convex surface with gradient highlight',
    type: 'neumorphism',
    config: {
      enabled: true,
      style: 'convex',
      intensity: 'medium',
      lightAngle: 145,
    } as NeumorphismConfig,
    css: 'background: linear-gradient(145deg, #f0f5fc, #cacfd6); box-shadow: 9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff; border-radius: 12px;',
    tailwind:
      'bg-gradient-to-br from-[#f0f5fc] to-[#cacfd6] shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] rounded-xl',
  },
  {
    id: 'neu-concave',
    name: 'Concave Neumorphism',
    description: 'Concave surface for input fields',
    type: 'neumorphism',
    config: {
      enabled: true,
      style: 'concave',
      intensity: 'medium',
      lightAngle: 145,
    } as NeumorphismConfig,
    css: 'background: linear-gradient(145deg, #cacfd6, #f0f5fc); box-shadow: 9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff; border-radius: 12px;',
    tailwind:
      'bg-gradient-to-br from-[#cacfd6] to-[#f0f5fc] shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] rounded-xl',
  },
  {
    id: 'neu-dark',
    name: 'Dark Neumorphism',
    description: 'Neumorphism for dark themes',
    type: 'neumorphism',
    config: {
      enabled: true,
      style: 'flat',
      intensity: 'medium',
      lightAngle: 145,
    } as NeumorphismConfig,
    css: 'background: #1e1e2e; box-shadow: 9px 9px 16px #161622, -9px -9px 16px #26263a; border-radius: 12px;',
    tailwind: 'bg-[#1e1e2e] shadow-[9px_9px_16px_#161622,-9px_-9px_16px_#26263a] rounded-xl',
  },
];

// ============================================================================
// GRADIENT BORDER PRESETS
// ============================================================================

const gradientBorderPresets: AdvancedEffectPreset[] = [
  {
    id: 'gradient-border-rainbow',
    name: 'Rainbow Border',
    description: 'Colorful rainbow gradient border',
    type: 'gradient-border',
    config: {
      enabled: true,
      colors: ['#ff0080', '#ff8c00', '#40e0d0', '#7b68ee'],
      angle: 90,
      width: 2,
      animated: false,
    } as GradientBorderConfig,
    css: 'border: 2px solid transparent; background: linear-gradient(white, white) padding-box, linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #7b68ee) border-box; border-radius: 8px;',
    tailwind:
      'border-2 border-transparent bg-clip-padding rounded-lg [background:linear-gradient(white,white)_padding-box,linear-gradient(90deg,#ff0080,#ff8c00,#40e0d0,#7b68ee)_border-box]',
  },
  {
    id: 'gradient-border-purple-blue',
    name: 'Purple Blue Border',
    description: 'Purple to blue gradient border',
    type: 'gradient-border',
    config: {
      enabled: true,
      colors: ['#667eea', '#764ba2'],
      angle: 135,
      width: 2,
      animated: false,
    } as GradientBorderConfig,
    css: 'border: 2px solid transparent; background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #667eea, #764ba2) border-box; border-radius: 8px;',
    tailwind:
      'border-2 border-transparent bg-clip-padding rounded-lg [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#667eea,#764ba2)_border-box]',
  },
  {
    id: 'gradient-border-sunset',
    name: 'Sunset Border',
    description: 'Warm sunset gradient border',
    type: 'gradient-border',
    config: {
      enabled: true,
      colors: ['#f093fb', '#f5576c'],
      angle: 45,
      width: 2,
      animated: false,
    } as GradientBorderConfig,
    css: 'border: 2px solid transparent; background: linear-gradient(white, white) padding-box, linear-gradient(45deg, #f093fb, #f5576c) border-box; border-radius: 8px;',
    tailwind:
      'border-2 border-transparent bg-clip-padding rounded-lg [background:linear-gradient(white,white)_padding-box,linear-gradient(45deg,#f093fb,#f5576c)_border-box]',
  },
  {
    id: 'gradient-border-ocean',
    name: 'Ocean Border',
    description: 'Cool ocean gradient border',
    type: 'gradient-border',
    config: {
      enabled: true,
      colors: ['#00c6fb', '#005bea'],
      angle: 180,
      width: 2,
      animated: false,
    } as GradientBorderConfig,
    css: 'border: 2px solid transparent; background: linear-gradient(white, white) padding-box, linear-gradient(180deg, #00c6fb, #005bea) border-box; border-radius: 8px;',
    tailwind:
      'border-2 border-transparent bg-clip-padding rounded-lg [background:linear-gradient(white,white)_padding-box,linear-gradient(180deg,#00c6fb,#005bea)_border-box]',
  },
  {
    id: 'gradient-border-neon',
    name: 'Neon Border',
    description: 'Glowing neon gradient border',
    type: 'gradient-border',
    config: {
      enabled: true,
      colors: ['#00ff88', '#00d4ff'],
      angle: 90,
      width: 2,
      animated: false,
    } as GradientBorderConfig,
    css: 'border: 2px solid transparent; background: linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(90deg, #00ff88, #00d4ff) border-box; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 212, 255, 0.2);',
    tailwind:
      'border-2 border-transparent bg-clip-padding rounded-lg [background:linear-gradient(#0a0a0a,#0a0a0a)_padding-box,linear-gradient(90deg,#00ff88,#00d4ff)_border-box] shadow-[0_0_10px_rgba(0,255,136,0.3),0_0_20px_rgba(0,212,255,0.2)]',
  },
];

// ============================================================================
// TEXT EFFECT PRESETS
// ============================================================================

const textEffectPresets: AdvancedEffectPreset[] = [
  {
    id: 'text-gradient-purple',
    name: 'Purple Gradient Text',
    description: 'Purple to pink gradient text',
    type: 'text-effect',
    config: {
      type: 'gradient',
      colors: ['#667eea', '#764ba2'],
      intensity: 'medium',
    } as TextEffectConfig,
    css: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;',
    tailwind: 'bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent',
  },
  {
    id: 'text-gradient-rainbow',
    name: 'Rainbow Gradient Text',
    description: 'Multi-color rainbow text effect',
    type: 'text-effect',
    config: {
      type: 'gradient',
      colors: ['#ff0080', '#ff8c00', '#40e0d0', '#7b68ee'],
      intensity: 'strong',
    } as TextEffectConfig,
    css: 'background: linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #7b68ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;',
    tailwind:
      'bg-gradient-to-r from-[#ff0080] via-[#ff8c00] via-[#40e0d0] to-[#7b68ee] bg-clip-text text-transparent',
  },
  {
    id: 'text-gradient-sunset',
    name: 'Sunset Gradient Text',
    description: 'Warm sunset gradient text',
    type: 'text-effect',
    config: {
      type: 'gradient',
      colors: ['#f093fb', '#f5576c'],
      intensity: 'medium',
    } as TextEffectConfig,
    css: 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;',
    tailwind: 'bg-gradient-to-br from-[#f093fb] to-[#f5576c] bg-clip-text text-transparent',
  },
  {
    id: 'text-glow-green',
    name: 'Neon Green Glow',
    description: 'Glowing neon green text effect',
    type: 'text-effect',
    config: {
      type: 'glow',
      colors: ['#00ff88'],
      intensity: 'strong',
    } as TextEffectConfig,
    css: 'color: #00ff88; text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88, 0 0 40px #00ff88;',
    tailwind:
      'text-[#00ff88] [text-shadow:0_0_10px_#00ff88,0_0_20px_#00ff88,0_0_30px_#00ff88,0_0_40px_#00ff88]',
  },
  {
    id: 'text-glow-blue',
    name: 'Neon Blue Glow',
    description: 'Glowing neon blue text effect',
    type: 'text-effect',
    config: {
      type: 'glow',
      colors: ['#00d4ff'],
      intensity: 'strong',
    } as TextEffectConfig,
    css: 'color: #00d4ff; text-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff, 0 0 40px #00d4ff;',
    tailwind:
      'text-[#00d4ff] [text-shadow:0_0_10px_#00d4ff,0_0_20px_#00d4ff,0_0_30px_#00d4ff,0_0_40px_#00d4ff]',
  },
  {
    id: 'text-glow-pink',
    name: 'Neon Pink Glow',
    description: 'Glowing neon pink text effect',
    type: 'text-effect',
    config: {
      type: 'glow',
      colors: ['#ff0080'],
      intensity: 'strong',
    } as TextEffectConfig,
    css: 'color: #ff0080; text-shadow: 0 0 10px #ff0080, 0 0 20px #ff0080, 0 0 30px #ff0080, 0 0 40px #ff0080;',
    tailwind:
      'text-[#ff0080] [text-shadow:0_0_10px_#ff0080,0_0_20px_#ff0080,0_0_30px_#ff0080,0_0_40px_#ff0080]',
  },
  {
    id: 'text-outline',
    name: 'Text Outline',
    description: 'Outlined text effect',
    type: 'text-effect',
    config: {
      type: 'outline',
      colors: ['#ffffff'],
      intensity: 'medium',
    } as TextEffectConfig,
    css: 'color: transparent; -webkit-text-stroke: 2px #ffffff;',
    tailwind: 'text-transparent [-webkit-text-stroke:2px_#ffffff]',
  },
  {
    id: 'text-shadow-long',
    name: 'Long Shadow',
    description: '3D long shadow text effect',
    type: 'text-effect',
    config: {
      type: 'shadow',
      colors: ['#333333'],
      intensity: 'strong',
    } as TextEffectConfig,
    css: 'color: #ffffff; text-shadow: 1px 1px 0 #333, 2px 2px 0 #333, 3px 3px 0 #333, 4px 4px 0 #333, 5px 5px 0 #333;',
    tailwind:
      'text-white [text-shadow:1px_1px_0_#333,2px_2px_0_#333,3px_3px_0_#333,4px_4px_0_#333,5px_5px_0_#333]',
  },
];

// ============================================================================
// SHADOW PRESETS
// ============================================================================

const shadowPresets: AdvancedEffectPreset[] = [
  {
    id: 'shadow-soft',
    name: 'Soft Shadow',
    description: 'Soft diffused shadow',
    type: 'shadow',
    config: {
      layers: [{ offsetX: 0, offsetY: 4, blur: 20, spread: 0, color: 'rgba(0, 0, 0, 0.1)' }],
    } as CustomShadowConfig,
    css: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);',
    tailwind: 'shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
  },
  {
    id: 'shadow-elevated',
    name: 'Elevated Shadow',
    description: 'Multi-layer elevated shadow',
    type: 'shadow',
    config: {
      layers: [
        { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.05)' },
        { offsetX: 0, offsetY: 8, blur: 16, spread: 0, color: 'rgba(0, 0, 0, 0.1)' },
        { offsetX: 0, offsetY: 16, blur: 32, spread: 0, color: 'rgba(0, 0, 0, 0.1)' },
      ],
    } as CustomShadowConfig,
    css: 'box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05), 0 8px 16px rgba(0, 0, 0, 0.1), 0 16px 32px rgba(0, 0, 0, 0.1);',
    tailwind:
      'shadow-[0_2px_4px_rgba(0,0,0,0.05),0_8px_16px_rgba(0,0,0,0.1),0_16px_32px_rgba(0,0,0,0.1)]',
  },
  {
    id: 'shadow-glow-purple',
    name: 'Purple Glow',
    description: 'Glowing purple shadow effect',
    type: 'shadow',
    config: {
      layers: [
        { offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: 'rgba(139, 92, 246, 0.5)' },
        { offsetX: 0, offsetY: 0, blur: 40, spread: 0, color: 'rgba(139, 92, 246, 0.3)' },
      ],
    } as CustomShadowConfig,
    css: 'box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3);',
    tailwind: 'shadow-[0_0_20px_rgba(139,92,246,0.5),0_0_40px_rgba(139,92,246,0.3)]',
  },
  {
    id: 'shadow-glow-blue',
    name: 'Blue Glow',
    description: 'Glowing blue shadow effect',
    type: 'shadow',
    config: {
      layers: [
        { offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: 'rgba(59, 130, 246, 0.5)' },
        { offsetX: 0, offsetY: 0, blur: 40, spread: 0, color: 'rgba(59, 130, 246, 0.3)' },
      ],
    } as CustomShadowConfig,
    css: 'box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3);',
    tailwind: 'shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.3)]',
  },
  {
    id: 'shadow-inset',
    name: 'Inset Shadow',
    description: 'Inner shadow effect',
    type: 'shadow',
    config: {
      layers: [
        { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.1)', inset: true },
      ],
    } as CustomShadowConfig,
    css: 'box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);',
    tailwind: 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
  },
];

// ============================================================================
// EXPORTS
// ============================================================================

export const ADVANCED_EFFECT_PRESETS: AdvancedEffectPreset[] = [
  ...glassmorphismPresets,
  ...neumorphismPresets,
  ...gradientBorderPresets,
  ...textEffectPresets,
  ...shadowPresets,
];

export const ADVANCED_EFFECT_CATEGORIES: AdvancedEffectCategory[] = [
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted glass effects with backdrop blur',
    presets: glassmorphismPresets,
  },
  {
    id: 'neumorphism',
    name: 'Neumorphism',
    description: 'Soft UI shadow effects',
    presets: neumorphismPresets,
  },
  {
    id: 'gradient-border',
    name: 'Gradient Borders',
    description: 'Colorful gradient border effects',
    presets: gradientBorderPresets,
  },
  {
    id: 'text-effect',
    name: 'Text Effects',
    description: 'Gradient, glow, and shadow text effects',
    presets: textEffectPresets,
  },
  {
    id: 'shadow',
    name: 'Custom Shadows',
    description: 'Advanced shadow effects',
    presets: shadowPresets,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a preset by ID
 */
export function getAdvancedEffectPreset(id: string): AdvancedEffectPreset | undefined {
  return ADVANCED_EFFECT_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all presets of a specific type
 */
export function getAdvancedEffectsByType(type: AdvancedEffectType): AdvancedEffectPreset[] {
  return ADVANCED_EFFECT_PRESETS.filter((preset) => preset.type === type);
}

/**
 * Generate CSS for a custom glassmorphism config
 */
export function generateGlassmorphismCSS(config: GlassmorphismConfig): string {
  const { blur, opacity, saturation, borderOpacity } = config;
  return `background: rgba(255, 255, 255, ${opacity}); backdrop-filter: blur(${blur}px) saturate(${saturation}%); -webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%); border: 1px solid rgba(255, 255, 255, ${borderOpacity});`;
}

/**
 * Generate CSS for a custom neumorphism config
 */
export function generateNeumorphismCSS(
  config: NeumorphismConfig,
  baseColor: string = '#e0e5ec'
): string {
  const { style, intensity } = config;
  const shadowSize = intensity === 'subtle' ? 6 : intensity === 'medium' ? 9 : 12;
  const blurSize = intensity === 'subtle' ? 12 : intensity === 'medium' ? 16 : 20;

  const inset = style === 'pressed' ? 'inset ' : '';

  return `background: ${baseColor}; box-shadow: ${inset}${shadowSize}px ${shadowSize}px ${blurSize}px #a3b1c6, ${inset}-${shadowSize}px -${shadowSize}px ${blurSize}px #ffffff;`;
}

/**
 * Generate CSS for a gradient border config
 */
export function generateGradientBorderCSS(config: GradientBorderConfig): string {
  const { colors, angle, width } = config;
  const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
  return `border: ${width}px solid transparent; background: linear-gradient(white, white) padding-box, ${gradient} border-box;`;
}

/**
 * Generate CSS for a text effect config
 */
export function generateTextEffectCSS(config: TextEffectConfig): string {
  const { type, colors = [], intensity } = config;

  switch (type) {
    case 'gradient':
      return `background: linear-gradient(135deg, ${colors.join(', ')}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`;
    case 'glow': {
      const glowColor = colors[0] || '#ffffff';
      const layers = intensity === 'subtle' ? 2 : intensity === 'medium' ? 3 : 4;
      const shadows = Array.from(
        { length: layers },
        (_, i) => `0 0 ${(i + 1) * 10}px ${glowColor}`
      ).join(', ');
      return `color: ${glowColor}; text-shadow: ${shadows};`;
    }
    case 'outline':
      return `color: transparent; -webkit-text-stroke: 2px ${colors[0] || '#ffffff'};`;
    case 'shadow':
      return `text-shadow: 1px 1px 0 ${colors[0] || '#333'}, 2px 2px 0 ${colors[0] || '#333'}, 3px 3px 0 ${colors[0] || '#333'};`;
    default:
      return '';
  }
}

export default {
  ADVANCED_EFFECT_PRESETS,
  ADVANCED_EFFECT_CATEGORIES,
  getAdvancedEffectPreset,
  getAdvancedEffectsByType,
  generateGlassmorphismCSS,
  generateNeumorphismCSS,
  generateGradientBorderCSS,
  generateTextEffectCSS,
};
