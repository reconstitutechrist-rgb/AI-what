/**
 * Design Specification Types
 *
 * Stage 1 output from "The Architect" (Gemini Flash)
 * Pure analysis before any code generation
 */

export interface DesignSpec {
  // Color System
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    // Additional colors detected
    additional: Array<{
      name: string;
      hex: string;
      usage: string; // "button", "header", "card", etc.
    }>;
  };

  // Typography System
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSizes: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
      small: string;
    };
    fontWeights: {
      heading: number;
      body: number;
      bold: number;
    };
  };

  // Spacing System
  spacing: {
    unit: number; // Base unit (4 or 8)
    scale: number[]; // [4, 8, 12, 16, 24, 32, 48, 64]
    containerPadding: string;
    sectionGap: string;
  };

  // Layout Structure
  structure: {
    type: 'sidebar-left' | 'sidebar-right' | 'header-top' | 'centered' | 'split' | 'dashboard';
    hasHeader: boolean;
    hasSidebar: boolean;
    hasFooter: boolean;
    mainContentWidth: 'narrow' | 'standard' | 'wide' | 'full';
  };

  // Component Inventory (high-level)
  componentTypes: Array<{
    type: string; // "hero", "cards", "navigation", etc.
    count: number;
    locations: string[]; // ["top", "middle", "bottom"]
  }>;

  // Effects & Style
  effects: {
    borderRadius: string; // "8px", "16px", "none"
    shadows: 'none' | 'subtle' | 'medium' | 'strong';
    hasGradients: boolean;
    hasBlur: boolean;
  };

  // Overall Vibe
  vibe: string; // "Modern and minimalist", "Bold and colorful", etc.
  confidence: number; // 0-1
}
