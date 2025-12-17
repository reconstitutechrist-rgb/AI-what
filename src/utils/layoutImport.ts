/**
 * Layout Import Utilities
 *
 * Provides functions to import design tokens from various sources:
 * - Tailwind CSS configuration
 * - CSS custom properties (globals.css)
 * - shadcn/ui component.json
 */

import type {
  LayoutDesign,
  ColorSettings,
  TypographySettings,
  SpacingSettings,
  EffectsSettings,
} from '@/types/layoutDesign';

// ============================================================================
// COLOR CONVERSION UTILITIES
// ============================================================================

/**
 * Convert HSL string (shadcn format: "210 40% 98%") to hex
 */
function hslToHex(hslString: string): string {
  const parts = hslString.trim().split(/\s+/);
  if (parts.length < 3) return '#000000';

  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parse color value - handles hex, rgb, hsl, and shadcn HSL format
 */
function parseColorValue(value: string): string {
  if (!value) return '#000000';

  value = value.trim();

  // Already hex
  if (value.startsWith('#')) {
    return value;
  }

  // RGB format
  if (value.startsWith('rgb')) {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }

  // HSL format with hsl()
  if (value.startsWith('hsl')) {
    const match = value.match(/hsla?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%/);
    if (match) {
      return hslToHex(`${match[1]} ${match[2]}% ${match[3]}%`);
    }
  }

  // shadcn HSL format (no wrapper): "210 40% 98%"
  if (/^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/.test(value)) {
    return hslToHex(value);
  }

  return '#000000';
}

// ============================================================================
// CSS VARIABLES PARSER
// ============================================================================

export interface ParsedCSSVariables {
  colors: Partial<ColorSettings>;
  effects: Partial<EffectsSettings>;
  raw: Record<string, string>;
}

/**
 * Parse CSS custom properties from a CSS string (e.g., globals.css)
 */
export function parseCSSVariables(css: string): ParsedCSSVariables {
  const result: ParsedCSSVariables = {
    colors: {},
    effects: {},
    raw: {},
  };

  // Extract :root block
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
  if (!rootMatch) return result;

  const rootContent = rootMatch[1];

  // Parse each variable
  const varRegex = /--([^:]+):\s*([^;]+);/g;
  let match;

  while ((match = varRegex.exec(rootContent)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    result.raw[name] = value;
  }

  // Map shadcn/ui variables to ColorSettings
  const colorMap: Record<string, keyof ColorSettings> = {
    primary: 'primary',
    secondary: 'secondary',
    accent: 'accent',
    background: 'background',
    foreground: 'text',
    card: 'surface',
    'muted-foreground': 'textMuted',
    border: 'border',
    destructive: 'error',
  };

  for (const [cssVar, colorKey] of Object.entries(colorMap)) {
    if (result.raw[cssVar]) {
      (result.colors as Record<string, string>)[colorKey] = parseColorValue(result.raw[cssVar]);
    }
  }

  // Map radius to effects
  if (result.raw['radius']) {
    const radiusValue = result.raw['radius'];
    if (radiusValue.includes('0.3') || radiusValue === '0.3rem') {
      result.effects.borderRadius = 'sm';
    } else if (radiusValue.includes('0.5') || radiusValue === '0.5rem') {
      result.effects.borderRadius = 'md';
    } else if (radiusValue.includes('0.75') || radiusValue === '0.75rem') {
      result.effects.borderRadius = 'lg';
    } else if (radiusValue.includes('1') || radiusValue === '1rem') {
      result.effects.borderRadius = 'xl';
    } else if (radiusValue === '0' || radiusValue === '0px') {
      result.effects.borderRadius = 'none';
    }
  }

  return result;
}

// ============================================================================
// TAILWIND CONFIG PARSER
// ============================================================================

export interface ParsedTailwindConfig {
  colors: Partial<ColorSettings>;
  typography: Partial<TypographySettings>;
  spacing: Partial<SpacingSettings>;
  effects: Partial<EffectsSettings>;
}

/**
 * Parse Tailwind CSS configuration (JavaScript/JSON format)
 */
export function parseTailwindConfig(configString: string): ParsedTailwindConfig {
  const result: ParsedTailwindConfig = {
    colors: {},
    typography: {},
    spacing: {},
    effects: {},
  };

  try {
    // Try to extract the config object - handle both module.exports and export default
    let configContent = configString;

    // Remove module.exports = or export default
    configContent = configContent.replace(/module\.exports\s*=\s*/, '');
    configContent = configContent.replace(/export\s+default\s+/, '');

    // Try to parse as JSON (remove trailing commas first)
    configContent = configContent.replace(/,(\s*[}\]])/g, '$1');

    // Extract theme.extend or theme section
    const themeMatch = configContent.match(/theme\s*:\s*\{/);
    if (!themeMatch) return result;

    // Extract colors
    const colorsMatch = configContent.match(/colors\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
    if (colorsMatch) {
      const colorsContent = colorsMatch[1];

      // Parse primary color
      const primaryMatch = colorsContent.match(/primary\s*:\s*['"]?(#[a-fA-F0-9]{6})['"]?/);
      if (primaryMatch) result.colors.primary = primaryMatch[1];

      // Parse secondary color
      const secondaryMatch = colorsContent.match(/secondary\s*:\s*['"]?(#[a-fA-F0-9]{6})['"]?/);
      if (secondaryMatch) result.colors.secondary = secondaryMatch[1];

      // Parse background color
      const bgMatch = colorsContent.match(/background\s*:\s*['"]?(#[a-fA-F0-9]{6})['"]?/);
      if (bgMatch) result.colors.background = bgMatch[1];

      // Parse surface color
      const surfaceMatch = colorsContent.match(/surface\s*:\s*['"]?(#[a-fA-F0-9]{6})['"]?/);
      if (surfaceMatch) result.colors.surface = surfaceMatch[1];

      // Parse border color
      const borderMatch = colorsContent.match(/border\s*:\s*['"]?(#[a-fA-F0-9]{6})['"]?/);
      if (borderMatch) result.colors.border = borderMatch[1];
    }

    // Extract font family
    const fontMatch = configContent.match(/fontFamily\s*:\s*\{[^}]*sans\s*:\s*\[['"]([^'"]+)['"]/);
    if (fontMatch) {
      result.typography.fontFamily = fontMatch[1];
    }

    // Extract border radius
    const radiusMatch = configContent.match(
      /borderRadius\s*:\s*\{[^}]*DEFAULT\s*:\s*['"]([^'"]+)['"]/
    );
    if (radiusMatch) {
      const radius = radiusMatch[1];
      if (radius.includes('0.125') || radius === '2px') result.effects.borderRadius = 'sm';
      else if (radius.includes('0.375') || radius === '6px') result.effects.borderRadius = 'md';
      else if (radius.includes('0.5') || radius === '8px') result.effects.borderRadius = 'lg';
      else if (radius.includes('0.75') || radius === '12px') result.effects.borderRadius = 'xl';
    }
  } catch {
    // If parsing fails, return empty result
    console.warn('Failed to parse Tailwind config');
  }

  return result;
}

// ============================================================================
// SHADCN COMPONENTS.JSON PARSER
// ============================================================================

export interface ParsedShadcnConfig {
  style: 'default' | 'new-york';
  baseColor: string;
  cssVariables: boolean;
}

/**
 * Parse shadcn/ui components.json configuration
 */
export function parseShadcnConfig(jsonString: string): ParsedShadcnConfig | null {
  try {
    const config = JSON.parse(jsonString);

    return {
      style: config.style || 'default',
      baseColor: config.tailwind?.baseColor || 'slate',
      cssVariables: config.tailwind?.cssVariables ?? true,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// UNIFIED IMPORT
// ============================================================================

export type ImportFormat = 'css' | 'tailwind' | 'shadcn' | 'unknown';

export interface ImportResult {
  format: ImportFormat;
  design: Partial<LayoutDesign>;
  warnings: string[];
  success: boolean;
}

/**
 * Auto-detect format and import design tokens
 */
export function importDesignTokens(content: string): ImportResult {
  const warnings: string[] = [];
  let format: ImportFormat = 'unknown';
  let design: Partial<LayoutDesign> = {};

  content = content.trim();

  // Try to detect format
  if (content.startsWith('{') && content.includes('"style"')) {
    // Likely shadcn components.json
    format = 'shadcn';
    const parsed = parseShadcnConfig(content);
    if (parsed) {
      // Map base color to a default palette
      const baseColorMap: Record<string, Partial<ColorSettings>> = {
        slate: { primary: '#0f172a', background: '#ffffff', text: '#0f172a', border: '#e2e8f0' },
        gray: { primary: '#111827', background: '#ffffff', text: '#111827', border: '#e5e7eb' },
        zinc: { primary: '#18181b', background: '#ffffff', text: '#18181b', border: '#e4e4e7' },
        neutral: { primary: '#171717', background: '#ffffff', text: '#171717', border: '#e5e5e5' },
        stone: { primary: '#1c1917', background: '#ffffff', text: '#1c1917', border: '#e7e5e4' },
      };

      design = {
        globalStyles: {
          colors: baseColorMap[parsed.baseColor] || baseColorMap.slate,
        } as LayoutDesign['globalStyles'],
      };
      warnings.push(`Imported base color palette: ${parsed.baseColor}`);
    } else {
      warnings.push('Failed to parse shadcn components.json');
    }
  } else if (content.includes(':root') && content.includes('--')) {
    // CSS variables
    format = 'css';
    const parsed = parseCSSVariables(content);

    design = {
      globalStyles: {
        colors: parsed.colors,
        effects: parsed.effects,
      } as LayoutDesign['globalStyles'],
    };

    const colorCount = Object.keys(parsed.colors).length;
    if (colorCount === 0) {
      warnings.push('No color variables found in CSS');
    } else {
      warnings.push(`Imported ${colorCount} colors from CSS variables`);
    }
  } else if (
    content.includes('module.exports') ||
    content.includes('theme:') ||
    content.includes('"theme"')
  ) {
    // Tailwind config
    format = 'tailwind';
    const parsed = parseTailwindConfig(content);

    design = {
      globalStyles: {
        colors: parsed.colors,
        typography: parsed.typography,
        spacing: parsed.spacing,
        effects: parsed.effects,
      } as LayoutDesign['globalStyles'],
    };

    const colorCount = Object.keys(parsed.colors).length;
    if (colorCount === 0) {
      warnings.push('No colors found in Tailwind config');
    } else {
      warnings.push(`Imported ${colorCount} colors from Tailwind config`);
    }
  } else {
    warnings.push(
      'Could not detect file format. Supported formats: CSS (globals.css), Tailwind config, shadcn components.json'
    );
    return { format: 'unknown', design: {}, warnings, success: false };
  }

  return {
    format,
    design,
    warnings,
    success: Object.keys(design).length > 0,
  };
}

/**
 * Merge imported design with existing design
 */
export function mergeDesigns(
  existing: Partial<LayoutDesign>,
  imported: Partial<LayoutDesign>
): Partial<LayoutDesign> {
  return {
    ...existing,
    globalStyles: {
      ...existing.globalStyles,
      colors: {
        ...existing.globalStyles?.colors,
        ...imported.globalStyles?.colors,
      },
      typography: {
        ...existing.globalStyles?.typography,
        ...imported.globalStyles?.typography,
      },
      spacing: {
        ...existing.globalStyles?.spacing,
        ...imported.globalStyles?.spacing,
      },
      effects: {
        ...existing.globalStyles?.effects,
        ...imported.globalStyles?.effects,
      },
    } as LayoutDesign['globalStyles'],
  };
}
