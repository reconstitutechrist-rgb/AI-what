/**
 * Colormind Service
 *
 * AI-powered color palette generation using the Colormind API.
 * Generates harmonious 5-color palettes from seed colors using ML models
 * trained on real design examples.
 *
 * API: http://colormind.io/api/
 * Cost: FREE (no API key required)
 */

// Colormind API endpoint
const COLORMIND_API = 'http://colormind.io/api/';

// Available models for color generation
export type ColormindModel = 'default' | 'ui' | 'makoto_shinkai' | 'metroid_fusion' | 'akira_film';

// RGB color as [r, g, b] array
export type RGBColor = [number, number, number];

// Color position can be locked (RGB) or unlocked ('N')
export type ColorInput = RGBColor | 'N';

export interface ColormindRequest {
  model?: ColormindModel;
  input?: [ColorInput, ColorInput, ColorInput, ColorInput, ColorInput];
}

export interface ColormindResponse {
  result: [RGBColor, RGBColor, RGBColor, RGBColor, RGBColor];
}

export interface GeneratedPalette {
  colors: string[]; // Hex colors
  rgb: RGBColor[]; // RGB values
  roles: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
  css: {
    variables: string;
    tailwind: Record<string, string>;
  };
}

/**
 * Convert hex color to RGB array
 */
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

/**
 * Convert RGB array to hex color
 */
export function rgbToHex(rgb: RGBColor): string {
  return (
    '#' +
    rgb
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Calculate relative luminance for contrast calculations
 */
function getLuminance(rgb: RGBColor): number {
  const [r, g, b] = rgb.map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determine if a color is light or dark
 */
function isLightColor(rgb: RGBColor): boolean {
  return getLuminance(rgb) > 0.5;
}

/**
 * Generate a harmonious color palette using Colormind API
 *
 * @param options.seedColor - Optional starting color (hex) to base the palette on
 * @param options.seedPosition - Position (0-4) to place the seed color
 * @param options.model - ML model to use for generation
 * @param options.lockedColors - Array of [position, hexColor] pairs to lock specific colors
 */
export async function generateColorPalette(
  options: {
    seedColor?: string;
    seedPosition?: 0 | 1 | 2 | 3 | 4;
    model?: ColormindModel;
    lockedColors?: Array<[number, string]>;
  } = {}
): Promise<GeneratedPalette> {
  const { seedColor, seedPosition = 0, model = 'ui', lockedColors = [] } = options;

  // Build input array with locked colors
  const input: [ColorInput, ColorInput, ColorInput, ColorInput, ColorInput] = [
    'N',
    'N',
    'N',
    'N',
    'N',
  ];

  // Lock seed color if provided
  if (seedColor) {
    try {
      input[seedPosition] = hexToRgb(seedColor);
    } catch (e) {
      console.warn(`Invalid seed color: ${seedColor}, using random generation`);
    }
  }

  // Lock additional colors
  for (const [position, hexColor] of lockedColors) {
    if (position >= 0 && position <= 4) {
      try {
        input[position] = hexToRgb(hexColor);
      } catch (e) {
        console.warn(`Invalid locked color at position ${position}: ${hexColor}`);
      }
    }
  }

  // Make API request
  const requestBody: ColormindRequest = {
    model,
    input,
  };

  try {
    const response = await fetch(COLORMIND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Colormind API error: ${response.status} ${response.statusText}`);
    }

    const data: ColormindResponse = await response.json();

    if (!data.result || data.result.length !== 5) {
      throw new Error('Invalid response from Colormind API');
    }

    // Convert RGB results to hex
    const hexColors = data.result.map(rgbToHex);

    // Assign semantic roles based on color characteristics
    // Colormind typically returns: [darkest, dark, mid, light, lightest]
    const sortedByLuminance = [...data.result]
      .map((rgb, i) => ({ rgb, hex: hexColors[i], luminance: getLuminance(rgb) }))
      .sort((a, b) => a.luminance - b.luminance);

    // Assign roles intelligently
    const roles = {
      primary: hexColors[2], // Middle color - usually the main brand color
      secondary: hexColors[1], // Darker accent
      accent: hexColors[3], // Lighter accent for highlights
      background: sortedByLuminance[4].hex, // Lightest for backgrounds
      surface: sortedByLuminance[3].hex, // Second lightest for cards/surfaces
    };

    // Generate CSS variables
    const cssVariables = `
:root {
  --color-primary: ${roles.primary};
  --color-secondary: ${roles.secondary};
  --color-accent: ${roles.accent};
  --color-background: ${roles.background};
  --color-surface: ${roles.surface};

  /* Full palette */
  --color-palette-1: ${hexColors[0]};
  --color-palette-2: ${hexColors[1]};
  --color-palette-3: ${hexColors[2]};
  --color-palette-4: ${hexColors[3]};
  --color-palette-5: ${hexColors[4]};
}`.trim();

    // Generate Tailwind config
    const tailwind = {
      primary: roles.primary,
      secondary: roles.secondary,
      accent: roles.accent,
      background: roles.background,
      surface: roles.surface,
    };

    return {
      colors: hexColors,
      rgb: data.result,
      roles,
      css: {
        variables: cssVariables,
        tailwind,
      },
    };
  } catch (error) {
    console.error('Error generating color palette:', error);
    throw error;
  }
}

/**
 * Generate multiple palette variations from a seed color
 */
export async function generatePaletteVariations(
  seedColor: string,
  count: number = 3
): Promise<GeneratedPalette[]> {
  const palettes: GeneratedPalette[] = [];
  const positions: Array<0 | 1 | 2 | 3 | 4> = [0, 1, 2, 3, 4];

  for (let i = 0; i < Math.min(count, 5); i++) {
    try {
      const palette = await generateColorPalette({
        seedColor,
        seedPosition: positions[i % 5],
        model: 'ui',
      });
      palettes.push(palette);

      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Error generating variation ${i}:`, error);
    }
  }

  return palettes;
}

/**
 * Get available Colormind models
 */
export function getAvailableModels(): { id: ColormindModel; name: string; description: string }[] {
  return [
    { id: 'default', name: 'Default', description: 'General purpose color generation' },
    { id: 'ui', name: 'UI Design', description: 'Optimized for user interface design' },
    {
      id: 'makoto_shinkai',
      name: 'Makoto Shinkai',
      description: 'Inspired by anime film color palettes',
    },
    { id: 'metroid_fusion', name: 'Metroid Fusion', description: 'Sci-fi game inspired colors' },
    { id: 'akira_film', name: 'Akira Film', description: 'Cyberpunk anime color palette' },
  ];
}

/**
 * Analyze a color and suggest complementary roles
 */
export function analyzeColor(hexColor: string): {
  isLight: boolean;
  suggestedRole: 'primary' | 'background' | 'accent';
  contrastColor: string;
} {
  const rgb = hexToRgb(hexColor);
  const light = isLightColor(rgb);

  return {
    isLight: light,
    suggestedRole: light ? 'background' : 'primary',
    contrastColor: light ? '#1a1a1a' : '#ffffff',
  };
}

export default {
  generateColorPalette,
  generatePaletteVariations,
  getAvailableModels,
  analyzeColor,
  hexToRgb,
  rgbToHex,
};
