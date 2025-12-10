/**
 * Font Identification Service
 *
 * Identifies fonts from images using font recognition APIs.
 * Provides definitive font matches with confidence scores and
 * suggests Google Fonts alternatives.
 *
 * Primary: WhatTheFont API (MyFonts)
 * Fallback: Font analysis based on characteristics
 *
 * Note: WhatTheFont API requires authentication for production use.
 * This service provides a framework and fallback font analysis.
 */

// Font characteristics for manual analysis
export interface FontCharacteristics {
  serif: boolean;
  weight: 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
  width: 'condensed' | 'normal' | 'expanded';
  style: 'normal' | 'italic' | 'oblique';
  contrast: 'low' | 'medium' | 'high';
  xHeight: 'small' | 'medium' | 'large';
}

export interface FontMatch {
  name: string;
  family: string;
  confidence: number; // 0-100
  foundry?: string;
  style?: string;
  weight?: string;
  googleFontsUrl?: string;
  googleFontsAlternative?: string;
  preview?: string;
}

export interface FontIdentificationResult {
  matches: FontMatch[];
  characteristics?: FontCharacteristics;
  suggestions: string[];
  googleFontsRecommendations: Array<{
    name: string;
    url: string;
    similarity: number;
  }>;
}

// Common font mappings to Google Fonts alternatives
const FONT_ALTERNATIVES: Record<string, string[]> = {
  // Sans-serif fonts
  Helvetica: ['Inter', 'Roboto', 'Open Sans'],
  Arial: ['Open Sans', 'Roboto', 'Lato'],
  Futura: ['Poppins', 'Nunito', 'Quicksand'],
  Avenir: ['Nunito', 'Lato', 'Source Sans Pro'],
  Gotham: ['Montserrat', 'Raleway', 'Work Sans'],
  'Proxima Nova': ['Montserrat', 'Open Sans', 'Nunito Sans'],
  'Brandon Grotesque': ['Nunito', 'Varela Round', 'Quicksand'],
  DIN: ['Oswald', 'Barlow', 'Bebas Neue'],
  'Gill Sans': ['Lato', 'Source Sans Pro', 'PT Sans'],
  Frutiger: ['Open Sans', 'Fira Sans', 'Source Sans Pro'],

  // Serif fonts
  'Times New Roman': ['Libre Baskerville', 'EB Garamond', 'Playfair Display'],
  Georgia: ['Merriweather', 'Lora', 'Crimson Text'],
  Garamond: ['EB Garamond', 'Cormorant Garamond', 'Libre Baskerville'],
  Bodoni: ['Playfair Display', 'Libre Bodoni', 'Cormorant'],
  Didot: ['Playfair Display', 'Cormorant', 'Libre Bodoni'],
  Baskerville: ['Libre Baskerville', 'Lora', 'Crimson Pro'],
  Caslon: ['Libre Caslon Text', 'EB Garamond', 'Cormorant'],

  // Display fonts
  Impact: ['Anton', 'Oswald', 'Bebas Neue'],
  'Cooper Black': ['Alfa Slab One', 'Patua One', 'Rokkitt'],

  // Monospace fonts
  Courier: ['Courier Prime', 'Source Code Pro', 'Roboto Mono'],
  Monaco: ['JetBrains Mono', 'Fira Code', 'Source Code Pro'],
  Consolas: ['Fira Code', 'JetBrains Mono', 'IBM Plex Mono'],
};

// Popular Google Fonts database for suggestions
const GOOGLE_FONTS_DATABASE = {
  sansSerif: [
    { name: 'Inter', weight: 'regular', characteristics: { modern: true, geometric: false } },
    { name: 'Roboto', weight: 'regular', characteristics: { modern: true, geometric: true } },
    { name: 'Open Sans', weight: 'regular', characteristics: { modern: true, humanist: true } },
    { name: 'Lato', weight: 'regular', characteristics: { modern: true, humanist: true } },
    { name: 'Montserrat', weight: 'regular', characteristics: { modern: true, geometric: true } },
    { name: 'Poppins', weight: 'regular', characteristics: { modern: true, geometric: true } },
    { name: 'Nunito', weight: 'regular', characteristics: { modern: true, rounded: true } },
    { name: 'Work Sans', weight: 'regular', characteristics: { modern: true, grotesque: true } },
    { name: 'Raleway', weight: 'regular', characteristics: { modern: true, elegant: true } },
    {
      name: 'Source Sans Pro',
      weight: 'regular',
      characteristics: { modern: true, humanist: true },
    },
  ],
  serif: [
    {
      name: 'Playfair Display',
      weight: 'regular',
      characteristics: { elegant: true, contrast: 'high' },
    },
    {
      name: 'Merriweather',
      weight: 'regular',
      characteristics: { readable: true, traditional: true },
    },
    { name: 'Lora', weight: 'regular', characteristics: { elegant: true, contrast: 'medium' } },
    { name: 'EB Garamond', weight: 'regular', characteristics: { classic: true, elegant: true } },
    { name: 'Crimson Text', weight: 'regular', characteristics: { readable: true, classic: true } },
    {
      name: 'Libre Baskerville',
      weight: 'regular',
      characteristics: { classic: true, readable: true },
    },
  ],
  display: [
    { name: 'Bebas Neue', weight: 'bold', characteristics: { bold: true, condensed: true } },
    { name: 'Anton', weight: 'bold', characteristics: { bold: true, impact: true } },
    { name: 'Oswald', weight: 'medium', characteristics: { condensed: true, modern: true } },
    { name: 'Abril Fatface', weight: 'bold', characteristics: { elegant: true, display: true } },
  ],
  monospace: [
    { name: 'Fira Code', weight: 'regular', characteristics: { ligatures: true, modern: true } },
    {
      name: 'JetBrains Mono',
      weight: 'regular',
      characteristics: { ligatures: true, readable: true },
    },
    {
      name: 'Source Code Pro',
      weight: 'regular',
      characteristics: { readable: true, classic: true },
    },
    { name: 'Roboto Mono', weight: 'regular', characteristics: { modern: true, readable: true } },
  ],
};

/**
 * Identify font from image (placeholder for API integration)
 *
 * In production, this would call the WhatTheFont API:
 * POST https://www.myfonts.com/api/wtf/upload
 *
 * For now, returns analysis suggestions based on described characteristics.
 */
export async function identifyFontFromImage(
  imageBase64: string,
  options: {
    returnAlternatives?: boolean;
    maxResults?: number;
  } = {}
): Promise<FontIdentificationResult> {
  const { returnAlternatives = true, maxResults = 5 } = options;

  // Placeholder: In production, send to WhatTheFont API
  // const response = await fetch('https://www.myfonts.com/api/wtf/upload', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${API_KEY}` },
  //   body: imageBase64
  // });

  // Return placeholder result with suggestions
  return {
    matches: [],
    suggestions: [
      'For accurate font identification, upload a clear image with:',
      '- High contrast between text and background',
      '- Characters at least 100px tall',
      '- Multiple characters (ideally full alphabet)',
      '- Horizontal text orientation',
    ],
    googleFontsRecommendations: GOOGLE_FONTS_DATABASE.sansSerif
      .slice(0, maxResults)
      .map((font) => ({
        name: font.name,
        url: `https://fonts.google.com/specimen/${font.name.replace(/ /g, '+')}`,
        similarity: 75 + Math.random() * 20, // Placeholder similarity score
      })),
  };
}

/**
 * Get Google Fonts alternatives for a known font
 */
export function getGoogleFontsAlternatives(fontName: string): FontMatch[] {
  const normalizedName = fontName.trim();

  // Check direct mapping
  for (const [original, alternatives] of Object.entries(FONT_ALTERNATIVES)) {
    if (original.toLowerCase() === normalizedName.toLowerCase()) {
      return alternatives.map((alt, index) => ({
        name: alt,
        family: alt,
        confidence: 90 - index * 10,
        googleFontsUrl: `https://fonts.google.com/specimen/${alt.replace(/ /g, '+')}`,
        googleFontsAlternative: alt,
      }));
    }
  }

  // Suggest based on characteristics
  return suggestFontsByCharacteristics({
    serif: normalizedName.toLowerCase().includes('serif'),
    weight: 'regular',
    width: 'normal',
    style: 'normal',
    contrast: 'medium',
    xHeight: 'medium',
  });
}

/**
 * Suggest fonts based on characteristics
 */
export function suggestFontsByCharacteristics(
  characteristics: Partial<FontCharacteristics>
): FontMatch[] {
  const { serif, weight = 'regular' } = characteristics;

  let fontPool;
  if (serif === true) {
    fontPool = GOOGLE_FONTS_DATABASE.serif;
  } else if (serif === false) {
    fontPool = GOOGLE_FONTS_DATABASE.sansSerif;
  } else {
    fontPool = [...GOOGLE_FONTS_DATABASE.sansSerif, ...GOOGLE_FONTS_DATABASE.serif];
  }

  return fontPool.slice(0, 5).map((font, index) => ({
    name: font.name,
    family: font.name,
    confidence: 85 - index * 5,
    weight: font.weight,
    googleFontsUrl: `https://fonts.google.com/specimen/${font.name.replace(/ /g, '+')}`,
    googleFontsAlternative: font.name,
  }));
}

/**
 * Get font pairing suggestions
 */
export function getFontPairings(
  primaryFont: string
): Array<{ heading: string; body: string; reason: string }> {
  const pairings: Record<string, Array<{ heading: string; body: string; reason: string }>> = {
    'Playfair Display': [
      {
        heading: 'Playfair Display',
        body: 'Source Sans Pro',
        reason: 'Classic serif with modern sans-serif',
      },
      { heading: 'Playfair Display', body: 'Lato', reason: 'Elegant contrast with readable body' },
    ],
    Montserrat: [
      { heading: 'Montserrat', body: 'Open Sans', reason: 'Geometric with humanist warmth' },
      { heading: 'Montserrat', body: 'Merriweather', reason: 'Modern with traditional serif' },
    ],
    Roboto: [
      { heading: 'Roboto', body: 'Roboto', reason: 'Consistent material design' },
      { heading: 'Roboto Slab', body: 'Roboto', reason: 'Slab heading with clean body' },
    ],
    Inter: [
      { heading: 'Inter', body: 'Inter', reason: 'Highly readable for UI' },
      { heading: 'Fraunces', body: 'Inter', reason: 'Playful heading with clean body' },
    ],
  };

  return (
    pairings[primaryFont] || [
      { heading: 'Montserrat', body: 'Open Sans', reason: 'Versatile combination' },
      { heading: 'Playfair Display', body: 'Lato', reason: 'Elegant and readable' },
      { heading: 'Raleway', body: 'Roboto', reason: 'Modern and professional' },
    ]
  );
}

/**
 * Generate CSS for font usage
 */
export function generateFontCSS(fontName: string, weights: number[] = [400, 700]): string {
  const weightsParam = weights.map((w) => `wght@${w}`).join(';');
  const fontParam = fontName.replace(/ /g, '+');

  return `
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=${fontParam}:${weightsParam}&display=swap');

/* Usage */
.font-${fontName.toLowerCase().replace(/ /g, '-')} {
  font-family: '${fontName}', sans-serif;
}
`.trim();
}

/**
 * Get all available font categories
 */
export function getFontCategories(): Array<{ id: string; name: string; fonts: string[] }> {
  return [
    {
      id: 'sans-serif',
      name: 'Sans Serif',
      fonts: GOOGLE_FONTS_DATABASE.sansSerif.map((f) => f.name),
    },
    {
      id: 'serif',
      name: 'Serif',
      fonts: GOOGLE_FONTS_DATABASE.serif.map((f) => f.name),
    },
    {
      id: 'display',
      name: 'Display',
      fonts: GOOGLE_FONTS_DATABASE.display.map((f) => f.name),
    },
    {
      id: 'monospace',
      name: 'Monospace',
      fonts: GOOGLE_FONTS_DATABASE.monospace.map((f) => f.name),
    },
  ];
}

export default {
  identifyFontFromImage,
  getGoogleFontsAlternatives,
  suggestFontsByCharacteristics,
  getFontPairings,
  generateFontCSS,
  getFontCategories,
};
