/**
 * Gemini Layout Service Configuration
 *
 * Model constants, interfaces, and default configurations.
 */

import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import type { DesignSpec } from '@/types/designSpec';

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const MODEL_FLASH = 'gemini-3-flash-preview';
// export const MODEL_PRO_IMAGE = 'gemini-3-pro-preview'; // Future use for assets

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Legacy critique result structure
 */
export interface LayoutCritique {
  score: number; // 0-100
  discrepancies: {
    componentId?: string;
    issue: string; // "Padding too small", "Wrong color"
    suggestion: string; // "Increase padding to 24px"
    correctionJSON?: Partial<DetectedComponentEnhanced>;
  }[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Get default design spec for fallback scenarios
 */
export function getDefaultDesignSpec(): DesignSpec {
  return {
    colorPalette: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f3f4f6',
      text: '#1f2937',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      additional: [],
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSizes: { h1: '48px', h2: '36px', h3: '24px', body: '16px', small: '14px' },
      fontWeights: { heading: 700, body: 400, bold: 600 },
    },
    spacing: {
      unit: 8,
      scale: [4, 8, 12, 16, 24, 32, 48, 64],
      containerPadding: '24px',
      sectionGap: '48px',
    },
    structure: {
      type: 'header-top',
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      mainContentWidth: 'standard',
    },
    componentTypes: [],
    effects: {
      borderRadius: '8px',
      shadows: 'subtle',
      hasGradients: false,
      hasBlur: false,
    },
    vibe: 'Modern and clean',
    confidence: 0.5, // Low confidence for default
  } as DesignSpec;
}
