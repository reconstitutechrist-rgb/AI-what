/**
 * Layout Export Utilities
 *
 * Provides functions to export LayoutDesign to various formats:
 * - React components
 * - Tailwind CSS configuration
 * - CSS custom properties (variables)
 * - Design tokens (Figma-compatible JSON)
 * - shadcn/ui theme (globals.css)
 */

import type { LayoutDesign, GridConfig } from '@/types/layoutDesign';

// ============================================================================
// COLOR CONVERSION UTILITIES
// ============================================================================

/**
 * Convert hex color to HSL values (without hsl() wrapper)
 * Returns format: "210 40% 98%" for shadcn/ui compatibility
 */
function hexToHSL(hex: string): string {
  // Validate input
  if (!hex || typeof hex !== 'string') return '0 0% 50%';

  // Remove # if present
  hex = hex.replace(/^#/, '').trim();

  // Handle shorthand hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  // Validate length
  if (hex.length !== 6) return '0 0% 50%';

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Check for NaN values
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '0 0% 50%';

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Format: "H S% L%" (shadcn format without hsl() wrapper)
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generate a foreground color (light or dark) based on background luminance
 */
function getForegroundHSL(backgroundHex: string): string {
  // Validate input
  if (!backgroundHex || typeof backgroundHex !== 'string') return '210 40% 98%';

  const hex = backgroundHex.replace(/^#/, '').trim();
  if (hex.length < 6) return '210 40% 98%';

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Check for NaN values
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '210 40% 98%';

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return light text for dark backgrounds, dark text for light backgrounds
  return luminance > 0.5 ? '222.2 84% 4.9%' : '210 40% 98%';
}

/**
 * Adjust HSL lightness for generating variants
 */
function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  const parts = hsl.split(' ');
  const h = parts[0];
  const s = parts[1];
  const l = parseInt(parts[2]);

  const newL = Math.max(0, Math.min(100, l + amount));
  return `${h} ${s} ${newL}%`;
}

// ============================================================================
// CSS VARIABLES EXPORT
// ============================================================================

/**
 * Convert spacing preset to CSS value
 */
function spacingPresetToValue(preset: string): string {
  const map: Record<string, string> = {
    compact: '0.5rem',
    normal: '1rem',
    relaxed: '1.5rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    narrow: '640px',
    standard: '1024px',
    wide: '1280px',
    full: '100%',
  };
  return map[preset] || preset;
}

/**
 * Convert effects preset to CSS value
 */
function effectsPresetToValue(type: string, preset: string): string {
  const borderRadiusMap: Record<string, string> = {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  };

  const shadowMap: Record<string, string> = {
    none: 'none',
    subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    strong: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  };

  const blurMap: Record<string, string> = {
    none: '0',
    subtle: '4px',
    medium: '12px',
    strong: '24px',
  };

  switch (type) {
    case 'borderRadius':
      return borderRadiusMap[preset] || preset;
    case 'shadows':
      return shadowMap[preset] || preset;
    case 'blur':
      return blurMap[preset] || preset;
    default:
      return preset;
  }
}

/**
 * Export LayoutDesign to CSS custom properties
 */
export function exportToCSSVariables(design: LayoutDesign): string {
  const { globalStyles } = design;
  const { typography, colors, spacing, effects } = globalStyles;

  const lines: string[] = [
    ':root {',
    '  /* Typography */',
    `  --font-family: ${typography.fontFamily};`,
    `  --font-heading: ${typography.headingFont || typography.fontFamily};`,
    `  --font-weight-heading: ${typography.headingWeight === 'bold' ? '700' : typography.headingWeight === 'semibold' ? '600' : typography.headingWeight === 'medium' ? '500' : typography.headingWeight === 'light' ? '300' : '400'};`,
    `  --font-weight-body: ${typography.bodyWeight === 'medium' ? '500' : typography.bodyWeight === 'light' ? '300' : '400'};`,
    `  --font-size-heading: ${typography.headingSize === 'xl' ? '2.25rem' : typography.headingSize === 'lg' ? '1.875rem' : typography.headingSize === 'sm' ? '1.25rem' : '1.5rem'};`,
    `  --font-size-body: ${typography.bodySize === 'xs' ? '0.75rem' : typography.bodySize === 'sm' ? '0.875rem' : '1rem'};`,
    `  --line-height: ${typography.lineHeight === 'tight' ? '1.25' : typography.lineHeight === 'relaxed' ? '1.75' : '1.5'};`,
    `  --letter-spacing: ${typography.letterSpacing === 'tight' ? '-0.025em' : typography.letterSpacing === 'wide' ? '0.025em' : '0'};`,
    '',
    '  /* Colors */',
    `  --color-primary: ${colors.primary};`,
    `  --color-secondary: ${colors.secondary || colors.primary};`,
    `  --color-accent: ${colors.accent || colors.primary};`,
    `  --color-background: ${colors.background};`,
    `  --color-surface: ${colors.surface};`,
    `  --color-text: ${colors.text};`,
    `  --color-text-muted: ${colors.textMuted};`,
    `  --color-border: ${colors.border};`,
    `  --color-success: ${colors.success || '#22C55E'};`,
    `  --color-warning: ${colors.warning || '#F59E0B'};`,
    `  --color-error: ${colors.error || '#EF4444'};`,
    `  --color-info: ${colors.info || '#3B82F6'};`,
    '',
    '  /* Spacing */',
    `  --spacing-density: ${spacingPresetToValue(spacing.density)};`,
    `  --container-width: ${spacingPresetToValue(spacing.containerWidth)};`,
    `  --section-padding: ${spacingPresetToValue(spacing.sectionPadding)};`,
    `  --component-gap: ${spacingPresetToValue(spacing.componentGap)};`,
    '',
    '  /* Effects */',
    `  --border-radius: ${effectsPresetToValue('borderRadius', effects.borderRadius)};`,
    `  --shadow: ${effectsPresetToValue('shadows', effects.shadows)};`,
    `  --blur: ${effectsPresetToValue('blur', effects.blur)};`,
    `  --use-gradients: ${effects.gradients ? '1' : '0'};`,
    '}',
  ];

  return lines.join('\n');
}

// ============================================================================
// SHADCN/UI THEME EXPORT
// ============================================================================

/**
 * Export LayoutDesign to shadcn/ui globals.css format
 * Generates CSS variables in HSL format compatible with shadcn/ui components
 */
export function exportToShadcnTheme(design: LayoutDesign): string {
  const { globalStyles } = design;
  const { colors, effects } = globalStyles;

  // Convert hex colors to HSL format
  const primary = hexToHSL(colors.primary);
  const primaryForeground = getForegroundHSL(colors.primary);
  const secondary = hexToHSL(colors.secondary || colors.primary);
  const secondaryForeground = getForegroundHSL(colors.secondary || colors.primary);
  const accent = hexToHSL(colors.accent || colors.primary);
  const accentForeground = getForegroundHSL(colors.accent || colors.primary);
  const background = hexToHSL(colors.background);
  const foreground = hexToHSL(colors.text);
  const card = hexToHSL(colors.surface);
  const cardForeground = hexToHSL(colors.text);
  const muted = adjustLightness(colors.background, -5);
  const mutedForeground = hexToHSL(colors.textMuted);
  const border = hexToHSL(colors.border);
  const input = hexToHSL(colors.border);
  const ring = hexToHSL(colors.primary);

  // Status colors
  const destructive = hexToHSL(colors.error || '#EF4444');
  const destructiveForeground = getForegroundHSL(colors.error || '#EF4444');

  // Get border radius value
  const radiusMap: Record<string, string> = {
    none: '0',
    sm: '0.3rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  };
  const radius = radiusMap[effects.borderRadius] || '0.5rem';

  // Generate dark mode colors (invert light/dark)
  const darkBackground = hexToHSL(colors.text);
  const darkForeground = hexToHSL(colors.background);
  const darkCard = adjustLightness(colors.text, 5);
  const darkCardForeground = hexToHSL(colors.background);
  const darkMuted = adjustLightness(colors.text, 10);
  const darkMutedForeground = adjustLightness(colors.background, -20);
  const darkBorder = adjustLightness(colors.text, 15);

  const css = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: ${background};
    --foreground: ${foreground};
    --card: ${card};
    --card-foreground: ${cardForeground};
    --popover: ${card};
    --popover-foreground: ${cardForeground};
    --primary: ${primary};
    --primary-foreground: ${primaryForeground};
    --secondary: ${secondary};
    --secondary-foreground: ${secondaryForeground};
    --muted: ${muted};
    --muted-foreground: ${mutedForeground};
    --accent: ${accent};
    --accent-foreground: ${accentForeground};
    --destructive: ${destructive};
    --destructive-foreground: ${destructiveForeground};
    --border: ${border};
    --input: ${input};
    --ring: ${ring};
    --radius: ${radius};
    --chart-1: ${hexToHSL(colors.primary)};
    --chart-2: ${hexToHSL(colors.secondary || colors.primary)};
    --chart-3: ${hexToHSL(colors.accent || colors.primary)};
    --chart-4: ${hexToHSL(colors.success || '#22C55E')};
    --chart-5: ${hexToHSL(colors.warning || '#F59E0B')};
  }

  .dark {
    --background: ${darkBackground};
    --foreground: ${darkForeground};
    --card: ${darkCard};
    --card-foreground: ${darkCardForeground};
    --popover: ${darkCard};
    --popover-foreground: ${darkCardForeground};
    --primary: ${primary};
    --primary-foreground: ${primaryForeground};
    --secondary: ${darkMuted};
    --secondary-foreground: ${darkForeground};
    --muted: ${darkMuted};
    --muted-foreground: ${darkMutedForeground};
    --accent: ${darkMuted};
    --accent-foreground: ${darkForeground};
    --destructive: ${destructive};
    --destructive-foreground: ${destructiveForeground};
    --border: ${darkBorder};
    --input: ${darkBorder};
    --ring: ${primary};
    --chart-1: ${hexToHSL(colors.primary)};
    --chart-2: ${hexToHSL(colors.secondary || colors.primary)};
    --chart-3: ${hexToHSL(colors.accent || colors.primary)};
    --chart-4: ${hexToHSL(colors.success || '#22C55E')};
    --chart-5: ${hexToHSL(colors.warning || '#F59E0B')};
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;

  return css;
}

// ============================================================================
// TAILWIND CONFIG EXPORT
// ============================================================================

/**
 * Export LayoutDesign to Tailwind CSS configuration
 */
export function exportToTailwindConfig(design: LayoutDesign): string {
  const { globalStyles, responsive } = design;
  const { typography, colors, spacing, effects } = globalStyles;

  const config = {
    theme: {
      extend: {
        fontFamily: {
          sans: [typography.fontFamily, 'system-ui', 'sans-serif'],
          heading: [typography.headingFont || typography.fontFamily, 'system-ui', 'sans-serif'],
        },
        colors: {
          primary: {
            DEFAULT: colors.primary,
            50: `${colors.primary}10`,
            100: `${colors.primary}20`,
            200: `${colors.primary}40`,
            300: `${colors.primary}60`,
            400: `${colors.primary}80`,
            500: colors.primary,
            600: colors.primary,
            700: colors.primary,
            800: colors.primary,
            900: colors.primary,
          },
          secondary: colors.secondary || colors.primary,
          accent: colors.accent || colors.primary,
          background: colors.background,
          surface: colors.surface,
          border: colors.border,
          muted: colors.textMuted,
          success: colors.success || '#22C55E',
          warning: colors.warning || '#F59E0B',
          error: colors.error || '#EF4444',
          info: colors.info || '#3B82F6',
        },
        spacing: {
          density: spacingPresetToValue(spacing.density),
          section: spacingPresetToValue(spacing.sectionPadding),
          gap: spacingPresetToValue(spacing.componentGap),
        },
        maxWidth: {
          container: spacingPresetToValue(spacing.containerWidth),
        },
        borderRadius: {
          DEFAULT: effectsPresetToValue('borderRadius', effects.borderRadius),
        },
        boxShadow: {
          DEFAULT: effectsPresetToValue('shadows', effects.shadows),
        },
        screens: {
          mobile: `${responsive.mobileBreakpoint}px`,
          tablet: `${responsive.tabletBreakpoint}px`,
        },
      },
    },
  };

  return `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(config, null, 2)}`;
}

// ============================================================================
// DESIGN TOKENS EXPORT (Figma-compatible)
// ============================================================================

interface DesignToken {
  value: string | number | boolean;
  type: string;
  description?: string;
}

interface DesignTokenGroup {
  [key: string]: DesignToken | DesignTokenGroup;
}

/**
 * Export LayoutDesign to Figma-compatible design tokens (JSON)
 */
export function exportToFigmaTokens(design: LayoutDesign): object {
  const { globalStyles, structure, responsive } = design;
  const { typography, colors, spacing, effects } = globalStyles;

  const tokens: DesignTokenGroup = {
    color: {
      primary: { value: colors.primary, type: 'color', description: 'Primary brand color' },
      secondary: {
        value: colors.secondary || colors.primary,
        type: 'color',
        description: 'Secondary brand color',
      },
      accent: {
        value: colors.accent || colors.primary,
        type: 'color',
        description: 'Accent color for highlights',
      },
      background: { value: colors.background, type: 'color', description: 'Page background color' },
      surface: {
        value: colors.surface,
        type: 'color',
        description: 'Card/surface background color',
      },
      text: { value: colors.text, type: 'color', description: 'Primary text color' },
      textMuted: {
        value: colors.textMuted,
        type: 'color',
        description: 'Secondary/muted text color',
      },
      border: { value: colors.border, type: 'color', description: 'Border color' },
      success: {
        value: colors.success || '#22C55E',
        type: 'color',
        description: 'Success state color',
      },
      warning: {
        value: colors.warning || '#F59E0B',
        type: 'color',
        description: 'Warning state color',
      },
      error: { value: colors.error || '#EF4444', type: 'color', description: 'Error state color' },
      info: { value: colors.info || '#3B82F6', type: 'color', description: 'Info state color' },
    },
    typography: {
      fontFamily: {
        body: { value: typography.fontFamily, type: 'fontFamily', description: 'Body text font' },
        heading: {
          value: typography.headingFont || typography.fontFamily,
          type: 'fontFamily',
          description: 'Heading font',
        },
      },
      fontWeight: {
        body: { value: typography.bodyWeight, type: 'fontWeight', description: 'Body text weight' },
        heading: {
          value: typography.headingWeight,
          type: 'fontWeight',
          description: 'Heading weight',
        },
      },
      fontSize: {
        body: { value: typography.bodySize, type: 'fontSize', description: 'Base body text size' },
        heading: {
          value: typography.headingSize,
          type: 'fontSize',
          description: 'Base heading size',
        },
      },
      lineHeight: {
        value: typography.lineHeight,
        type: 'lineHeight',
        description: 'Line height preset',
      },
      letterSpacing: {
        value: typography.letterSpacing,
        type: 'letterSpacing',
        description: 'Letter spacing preset',
      },
    },
    spacing: {
      density: { value: spacing.density, type: 'spacing', description: 'Overall spacing density' },
      containerWidth: {
        value: spacing.containerWidth,
        type: 'dimension',
        description: 'Max container width',
      },
      sectionPadding: {
        value: spacing.sectionPadding,
        type: 'spacing',
        description: 'Section vertical padding',
      },
      componentGap: {
        value: spacing.componentGap,
        type: 'spacing',
        description: 'Gap between components',
      },
    },
    effects: {
      borderRadius: {
        value: effects.borderRadius,
        type: 'borderRadius',
        description: 'Default border radius',
      },
      shadows: { value: effects.shadows, type: 'shadow', description: 'Shadow intensity' },
      blur: { value: effects.blur, type: 'blur', description: 'Blur intensity' },
      animations: { value: effects.animations, type: 'animation', description: 'Animation style' },
      gradients: { value: effects.gradients, type: 'boolean', description: 'Use gradients' },
    },
    layout: {
      type: { value: structure.type, type: 'string', description: 'Layout type' },
      hasHeader: { value: structure.hasHeader, type: 'boolean' },
      hasSidebar: { value: structure.hasSidebar, type: 'boolean' },
      hasFooter: { value: structure.hasFooter, type: 'boolean' },
      sidebarPosition: { value: structure.sidebarPosition, type: 'string' },
      contentLayout: { value: structure.contentLayout, type: 'string' },
      mainContentWidth: { value: structure.mainContentWidth, type: 'string' },
    },
    responsive: {
      mobileBreakpoint: {
        value: responsive.mobileBreakpoint,
        type: 'dimension',
        description: 'Mobile breakpoint (px)',
      },
      tabletBreakpoint: {
        value: responsive.tabletBreakpoint,
        type: 'dimension',
        description: 'Tablet breakpoint (px)',
      },
      mobileLayout: { value: responsive.mobileLayout, type: 'string' },
      mobileHeader: { value: responsive.mobileHeader, type: 'string' },
    },
  };

  return tokens;
}

// ============================================================================
// REACT COMPONENT EXPORT
// ============================================================================

/**
 * Generate CSS class string from design settings (currently unused but kept for future use)
 */
// function generateClassString(globalStyles: GlobalStyles): string {
//   const classes: string[] = [];

//   // Typography classes
//   classes.push(`font-[${globalStyles.typography.fontFamily.split(',')[0].trim()}]`);

//   // Spacing classes
//   switch (globalStyles.spacing.density) {
//     case 'compact':
//       classes.push('gap-2');
//       break;
//     case 'relaxed':
//       classes.push('gap-6');
//       break;
//     default:
//       classes.push('gap-4');
//   }

//   return classes.join(' ');
// }

/**
 * Export LayoutDesign to a React component string
 */
export function exportToReactComponent(design: LayoutDesign): string {
  const { globalStyles, components, structure } = design;
  const { colors, effects } = globalStyles;

  const componentName = design.name.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedLayout';

  const component = `'use client';

import React from 'react';

/**
 * ${design.name}
 * Generated from LayoutDesign
 *
 * Design Specifications:
 * - Style: ${design.basePreferences.style}
 * - Color Scheme: ${design.basePreferences.colorScheme}
 * - Layout: ${design.basePreferences.layout}
 */

// Design tokens as CSS custom properties
const designTokens = {
  '--color-primary': '${colors.primary}',
  '--color-secondary': '${colors.secondary || colors.primary}',
  '--color-accent': '${colors.accent || colors.primary}',
  '--color-background': '${colors.background}',
  '--color-surface': '${colors.surface}',
  '--color-text': '${colors.text}',
  '--color-text-muted': '${colors.textMuted}',
  '--color-border': '${colors.border}',
  '--border-radius': '${effectsPresetToValue('borderRadius', effects.borderRadius)}',
} as React.CSSProperties;

interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

export function ${componentName}({ children, className = '' }: ${componentName}Props) {
  return (
    <div
      className={\`min-h-screen \${className}\`}
      style={{
        ...designTokens,
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
      }}
    >
      ${
        structure.hasHeader
          ? `{/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">{/* Logo */}</div>
          <nav className="flex items-center gap-4">
            {/* Navigation items */}
          </nav>
          ${
            components.header?.hasCTA
              ? `<button
            className="px-4 py-2 rounded-lg text-white"
            style={{
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            ${components.header.ctaText || 'Get Started'}
          </button>`
              : ''
          }
        </div>
      </header>`
          : ''
      }

      ${
        structure.hasSidebar
          ? `{/* Sidebar */}
      <aside
        className="fixed ${structure.sidebarPosition === 'left' ? 'left-0' : 'right-0'} top-0 h-screen w-64 border-r pt-16"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <nav className="p-4">
          {/* Sidebar navigation */}
        </nav>
      </aside>`
          : ''
      }

      {/* Main Content */}
      <main className="${structure.hasSidebar ? (structure.sidebarPosition === 'left' ? 'ml-64' : 'mr-64') : ''} ${structure.hasHeader ? 'pt-16' : ''}">
        <div className="${structure.contentLayout === 'centered' ? 'container mx-auto' : 'w-full'} px-4 py-8">
          {children}
        </div>
      </main>

      ${
        structure.hasFooter
          ? `{/* Footer */}
      <footer
        className="border-t py-8"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="container mx-auto px-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
          <p>&copy; {new Date().getFullYear()} ${design.name}. All rights reserved.</p>
        </div>
      </footer>`
          : ''
      }
    </div>
  );
}

export default ${componentName};
`;

  return component;
}

// ============================================================================
// GRID CONFIG EXPORT
// ============================================================================

/**
 * Export GridConfig to CSS grid template
 */
export function exportGridConfigToCSS(config: GridConfig): string {
  const lines: string[] = [];

  // Grid template columns
  if (typeof config.columns === 'number') {
    lines.push(`grid-template-columns: repeat(${config.columns}, 1fr);`);
  } else if (config.columnWidths) {
    lines.push(`grid-template-columns: ${config.columnWidths.join(' ')};`);
  } else {
    lines.push(
      `grid-template-columns: repeat(${config.columns}, minmax(${config.minColumnWidth || '250px'}, 1fr));`
    );
  }

  // Gap
  lines.push(`gap: ${config.gap};`);
  if (config.rowGap && config.rowGap !== config.gap) {
    lines.push(`row-gap: ${config.rowGap};`);
  }

  // Alignment
  if (config.alignItems) {
    lines.push(`align-items: ${config.alignItems};`);
  }
  if (config.justifyItems) {
    lines.push(`justify-items: ${config.justifyItems};`);
  }

  return `.grid-container {\n  display: grid;\n  ${lines.join('\n  ')}\n}`;
}

// ============================================================================
// COMBINED EXPORT
// ============================================================================

export interface ExportOptions {
  format: 'css' | 'tailwind' | 'tokens' | 'react' | 'shadcn' | 'all';
  includeComments?: boolean;
}

export interface ExportResult {
  css?: string;
  tailwind?: string;
  tokens?: object;
  react?: string;
  shadcn?: string;
}

/**
 * Export LayoutDesign to multiple formats
 */
export function exportLayout(design: LayoutDesign, options: ExportOptions): ExportResult {
  const result: ExportResult = {};

  if (options.format === 'all' || options.format === 'css') {
    result.css = exportToCSSVariables(design);
  }

  if (options.format === 'all' || options.format === 'tailwind') {
    result.tailwind = exportToTailwindConfig(design);
  }

  if (options.format === 'all' || options.format === 'tokens') {
    result.tokens = exportToFigmaTokens(design);
  }

  if (options.format === 'all' || options.format === 'react') {
    result.react = exportToReactComponent(design);
  }

  if (options.format === 'all' || options.format === 'shadcn') {
    result.shadcn = exportToShadcnTheme(design);
  }

  return result;
}

/**
 * Download exported content as a file
 */
export function downloadExport(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
