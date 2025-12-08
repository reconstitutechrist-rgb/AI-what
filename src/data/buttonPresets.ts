/**
 * Button Presets Data
 *
 * Pre-built button styles for the Button Designer.
 * Includes variants, sizes, and complete state configurations.
 */

import type { ButtonSpec } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export interface ButtonPreset {
  id: string;
  name: string;
  description: string;
  category: 'solid' | 'outline' | 'ghost' | 'gradient' | 'glass';
  spec: ButtonSpec;
}

export interface ButtonSizePreset {
  id: string;
  name: string;
  padding: string;
  fontSize: string;
  borderRadius: string;
  iconSize?: string;
}

// ============================================================================
// SIZE PRESETS
// ============================================================================

export const BUTTON_SIZES: ButtonSizePreset[] = [
  {
    id: 'xs',
    name: 'Extra Small',
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '4px',
    iconSize: '14px',
  },
  {
    id: 'sm',
    name: 'Small',
    padding: '8px 16px',
    fontSize: '13px',
    borderRadius: '6px',
    iconSize: '16px',
  },
  {
    id: 'md',
    name: 'Medium',
    padding: '10px 20px',
    fontSize: '14px',
    borderRadius: '8px',
    iconSize: '18px',
  },
  {
    id: 'lg',
    name: 'Large',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '10px',
    iconSize: '20px',
  },
  {
    id: 'xl',
    name: 'Extra Large',
    padding: '16px 32px',
    fontSize: '18px',
    borderRadius: '12px',
    iconSize: '24px',
  },
];

// ============================================================================
// BUTTON PRESETS
// ============================================================================

export const BUTTON_PRESETS: ButtonPreset[] = [
  // SOLID VARIANTS
  {
    id: 'primary-solid',
    name: 'Primary',
    description: 'Main call-to-action button',
    category: 'solid',
    spec: {
      variant: 'primary',
      size: 'md',
      states: {
        default: {
          background: '#3B82F6',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: 'none',
        },
        hover: {
          background: '#2563EB',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          transform: 'translateY(-1px)',
        },
        focus: {
          background: '#3B82F6',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
          transform: 'none',
        },
        active: {
          background: '#1D4ED8',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: '#64748B',
          color: '#94A3B8',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.6',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },
  {
    id: 'secondary-solid',
    name: 'Secondary',
    description: 'Secondary action button',
    category: 'solid',
    spec: {
      variant: 'secondary',
      size: 'md',
      states: {
        default: {
          background: '#475569',
          color: '#F8FAFC',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: 'none',
        },
        hover: {
          background: '#334155',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 4px 12px rgba(71, 85, 105, 0.4)',
          transform: 'translateY(-1px)',
        },
        focus: {
          background: '#475569',
          color: '#F8FAFC',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 3px rgba(71, 85, 105, 0.5)',
          transform: 'none',
        },
        active: {
          background: '#1E293B',
          color: '#F8FAFC',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: '#334155',
          color: '#64748B',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.5',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },
  {
    id: 'success-solid',
    name: 'Success',
    description: 'Positive action button',
    category: 'solid',
    spec: {
      variant: 'success',
      size: 'md',
      states: {
        default: {
          background: '#10B981',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: 'none',
        },
        hover: {
          background: '#059669',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          transform: 'translateY(-1px)',
        },
        focus: {
          background: '#10B981',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.5)',
          transform: 'none',
        },
        active: {
          background: '#047857',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: '#64748B',
          color: '#94A3B8',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.6',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },
  {
    id: 'danger-solid',
    name: 'Danger',
    description: 'Destructive action button',
    category: 'solid',
    spec: {
      variant: 'danger',
      size: 'md',
      states: {
        default: {
          background: '#EF4444',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: 'none',
        },
        hover: {
          background: '#DC2626',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          transform: 'translateY(-1px)',
        },
        focus: {
          background: '#EF4444',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.5)',
          transform: 'none',
        },
        active: {
          background: '#B91C1C',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: '#64748B',
          color: '#94A3B8',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.6',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },

  // OUTLINE VARIANTS
  {
    id: 'primary-outline',
    name: 'Primary Outline',
    description: 'Outlined primary button',
    category: 'outline',
    spec: {
      variant: 'primary-outline',
      size: 'md',
      states: {
        default: {
          background: 'transparent',
          color: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'none',
        },
        hover: {
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: '1px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
          transform: 'translateY(-1px)',
        },
        focus: {
          background: 'transparent',
          color: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: '2px',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
          transform: 'none',
        },
        active: {
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#2563EB',
          borderColor: '#2563EB',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: 'transparent',
          color: '#64748B',
          borderColor: '#475569',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.5',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },
  {
    id: 'secondary-outline',
    name: 'Secondary Outline',
    description: 'Outlined secondary button',
    category: 'outline',
    spec: {
      variant: 'secondary-outline',
      size: 'md',
      states: {
        default: {
          background: 'transparent',
          color: '#94A3B8',
          borderColor: '#475569',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'none',
        },
        hover: {
          background: 'rgba(148, 163, 184, 0.1)',
          color: '#F8FAFC',
          borderColor: '#64748B',
          borderWidth: '1px',
          boxShadow: '0 4px 12px rgba(71, 85, 105, 0.2)',
          transform: 'translateY(-1px)',
        },
        focus: {
          background: 'transparent',
          color: '#94A3B8',
          borderColor: '#64748B',
          borderWidth: '2px',
          boxShadow: '0 0 0 3px rgba(71, 85, 105, 0.3)',
          transform: 'none',
        },
        active: {
          background: 'rgba(148, 163, 184, 0.2)',
          color: '#F8FAFC',
          borderColor: '#94A3B8',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: 'transparent',
          color: '#475569',
          borderColor: '#334155',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.5',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },

  // GHOST VARIANTS
  {
    id: 'primary-ghost',
    name: 'Primary Ghost',
    description: 'Minimal primary button',
    category: 'ghost',
    spec: {
      variant: 'primary-ghost',
      size: 'md',
      states: {
        default: {
          background: 'transparent',
          color: '#3B82F6',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
        },
        hover: {
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#60A5FA',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
        },
        focus: {
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.4)',
          transform: 'none',
        },
        active: {
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#2563EB',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
        },
        disabled: {
          background: 'transparent',
          color: '#64748B',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.5',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.15s ease',
    },
  },
  {
    id: 'neutral-ghost',
    name: 'Neutral Ghost',
    description: 'Minimal neutral button',
    category: 'ghost',
    spec: {
      variant: 'neutral-ghost',
      size: 'md',
      states: {
        default: {
          background: 'transparent',
          color: '#94A3B8',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
        },
        hover: {
          background: 'rgba(148, 163, 184, 0.1)',
          color: '#F8FAFC',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
        },
        focus: {
          background: 'rgba(148, 163, 184, 0.1)',
          color: '#F8FAFC',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 2px rgba(148, 163, 184, 0.4)',
          transform: 'none',
        },
        active: {
          background: 'rgba(148, 163, 184, 0.2)',
          color: '#F8FAFC',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
        },
        disabled: {
          background: 'transparent',
          color: '#475569',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.5',
        },
      },
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.15s ease',
    },
  },

  // GRADIENT VARIANTS
  {
    id: 'purple-gradient',
    name: 'Purple Gradient',
    description: 'Purple to pink gradient',
    category: 'gradient',
    spec: {
      variant: 'purple-gradient',
      size: 'md',
      states: {
        default: {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
          transform: 'none',
        },
        hover: {
          background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
          transform: 'translateY(-2px)',
        },
        focus: {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.5)',
          transform: 'none',
        },
        active: {
          background: 'linear-gradient(135deg, #6D28D9 0%, #BE185D 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
          color: '#94A3B8',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.6',
        },
      },
      borderRadius: '10px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.3s ease',
    },
  },
  {
    id: 'ocean-gradient',
    name: 'Ocean Gradient',
    description: 'Blue to cyan gradient',
    category: 'gradient',
    spec: {
      variant: 'ocean-gradient',
      size: 'md',
      states: {
        default: {
          background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
          transform: 'none',
        },
        hover: {
          background: 'linear-gradient(135deg, #2563EB 0%, #0891B2 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
          transform: 'translateY(-2px)',
        },
        focus: {
          background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
          transform: 'none',
        },
        active: {
          background: 'linear-gradient(135deg, #1D4ED8 0%, #0E7490 100%)',
          color: '#FFFFFF',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
          transform: 'translateY(1px)',
        },
        disabled: {
          background: 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
          color: '#94A3B8',
          borderColor: 'transparent',
          borderWidth: '0px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.6',
        },
      },
      borderRadius: '10px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.3s ease',
    },
  },

  // GLASS VARIANTS
  {
    id: 'glass-light',
    name: 'Glass Light',
    description: 'Glassmorphic light button',
    category: 'glass',
    spec: {
      variant: 'glass-light',
      size: 'md',
      states: {
        default: {
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#F8FAFC',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: '1px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          transform: 'none',
          backdropFilter: 'blur(10px)',
        },
        hover: {
          background: 'rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: '1px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-1px)',
          backdropFilter: 'blur(12px)',
        },
        focus: {
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#F8FAFC',
          borderColor: 'rgba(255, 255, 255, 0.4)',
          borderWidth: '1px',
          boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.2)',
          transform: 'none',
          backdropFilter: 'blur(10px)',
        },
        active: {
          background: 'rgba(255, 255, 255, 0.2)',
          color: '#FFFFFF',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: '1px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(1px)',
          backdropFilter: 'blur(10px)',
        },
        disabled: {
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#64748B',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.5',
          backdropFilter: 'blur(5px)',
        },
      },
      borderRadius: '12px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },
  {
    id: 'glass-dark',
    name: 'Glass Dark',
    description: 'Glassmorphic dark button',
    category: 'glass',
    spec: {
      variant: 'glass-dark',
      size: 'md',
      states: {
        default: {
          background: 'rgba(0, 0, 0, 0.3)',
          color: '#F8FAFC',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: '1px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
          transform: 'none',
          backdropFilter: 'blur(10px)',
        },
        hover: {
          background: 'rgba(0, 0, 0, 0.4)',
          color: '#FFFFFF',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: '1px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          transform: 'translateY(-1px)',
          backdropFilter: 'blur(12px)',
        },
        focus: {
          background: 'rgba(0, 0, 0, 0.3)',
          color: '#F8FAFC',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: '1px',
          boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.15)',
          transform: 'none',
          backdropFilter: 'blur(10px)',
        },
        active: {
          background: 'rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: '1px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
          transform: 'translateY(1px)',
          backdropFilter: 'blur(10px)',
        },
        disabled: {
          background: 'rgba(0, 0, 0, 0.2)',
          color: '#64748B',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: '1px',
          boxShadow: 'none',
          transform: 'none',
          opacity: '0.5',
          backdropFilter: 'blur(5px)',
        },
      },
      borderRadius: '12px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getPresetsByCategory(category: ButtonPreset['category']): ButtonPreset[] {
  return BUTTON_PRESETS.filter((preset) => preset.category === category);
}

export function getPresetById(id: string): ButtonPreset | undefined {
  return BUTTON_PRESETS.find((preset) => preset.id === id);
}

export function getSizeById(id: string): ButtonSizePreset | undefined {
  return BUTTON_SIZES.find((size) => size.id === id);
}

export function applySize(spec: ButtonSpec, size: ButtonSizePreset): ButtonSpec {
  return {
    ...spec,
    size: size.id,
    padding: size.padding,
    fontSize: size.fontSize,
    borderRadius: size.borderRadius,
  };
}

export const PRESET_CATEGORIES = [
  { id: 'solid', name: 'Solid', icon: '■' },
  { id: 'outline', name: 'Outline', icon: '□' },
  { id: 'ghost', name: 'Ghost', icon: '◇' },
  { id: 'gradient', name: 'Gradient', icon: '◆' },
  { id: 'glass', name: 'Glass', icon: '◈' },
] as const;

export default BUTTON_PRESETS;
