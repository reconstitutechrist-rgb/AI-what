/**
 * Design Language Interpreter
 *
 * Maps vague, natural language design requests to concrete design parameter changes.
 * This allows users to express design intent without knowing specific property names.
 *
 * @example
 * User: "make it pop" → increases shadows, saturation, and border radius
 * User: "feels cramped" → increases spacing density and padding
 */

import type { LayoutDesign } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export type ColorAction =
  | { action: 'saturate'; amount: number }
  | { action: 'desaturate'; amount: number }
  | { action: 'brighten'; amount: number }
  | { action: 'darken'; amount: number }
  | { action: 'shift'; hue: number };

export type StepAction = { action: 'increase' | 'decrease'; steps: number };

export type ChangeValue = string | number | boolean | ColorAction | StepAction;

export interface DesignInterpretation {
  /** Human-readable description of the intent */
  intent: string;
  /** Property path → new value or action */
  changes: Record<string, ChangeValue>;
  /** Explanation to show the user */
  explanation: string;
  /** Keywords that trigger this interpretation */
  keywords: string[];
  /** Confidence level for this interpretation (0-1) */
  confidence?: number;
}

export interface InterpretationResult {
  matched: boolean;
  interpretation?: DesignInterpretation;
  matchedPhrase?: string;
  matchedKeywords?: string[];
  confidence: number;
}

// ============================================================================
// NATURAL LANGUAGE MAPPINGS (50+ phrases)
// ============================================================================

export const DESIGN_LANGUAGE_MAP: Record<string, DesignInterpretation> = {
  // ---------------------------------------------------------------------------
  // VISUAL IMPACT
  // ---------------------------------------------------------------------------
  'make it pop': {
    intent: 'increase visual impact',
    changes: {
      'globalStyles.effects.shadows': 'strong',
      'globalStyles.effects.borderRadius': 'lg',
      'globalStyles.colors.primary': { action: 'saturate', amount: 15 },
    },
    explanation:
      'Increasing shadows to strong, rounding corners to large, and boosting primary color saturation by 15%',
    keywords: ['pop', 'stand out', 'eye-catching', 'attention'],
  },

  'make it bold': {
    intent: 'increase boldness and contrast',
    changes: {
      'globalStyles.typography.headingWeight': 'bold',
      'globalStyles.effects.shadows': 'strong',
      'globalStyles.colors.primary': { action: 'saturate', amount: 20 },
    },
    explanation: 'Setting heading weight to bold, strong shadows, and increasing color saturation',
    keywords: ['bold', 'strong', 'impactful', 'powerful'],
  },

  'more dramatic': {
    intent: 'increase visual drama',
    changes: {
      'globalStyles.effects.shadows': 'strong',
      'globalStyles.effects.animations': 'playful',
      'globalStyles.spacing.sectionPadding': 'xl',
    },
    explanation: 'Adding strong shadows, playful animations, and extra large section padding',
    keywords: ['dramatic', 'intense', 'striking'],
  },

  // ---------------------------------------------------------------------------
  // SPACING & DENSITY
  // ---------------------------------------------------------------------------
  'feels cramped': {
    intent: 'increase spacing',
    changes: {
      'globalStyles.spacing.density': 'relaxed',
      'globalStyles.spacing.sectionPadding': { action: 'increase', steps: 1 },
      'globalStyles.spacing.componentGap': { action: 'increase', steps: 1 },
    },
    explanation: 'Switching to relaxed density and increasing padding and gaps by one level',
    keywords: ['cramped', 'tight', 'squished', 'crowded', 'cluttered'],
  },

  'needs more space': {
    intent: 'add whitespace',
    changes: {
      'globalStyles.spacing.density': 'relaxed',
      'globalStyles.spacing.sectionPadding': 'xl',
      'globalStyles.spacing.componentGap': 'lg',
    },
    explanation:
      'Setting relaxed density with extra large section padding and large component gaps',
    keywords: ['space', 'breathing room', 'whitespace', 'air'],
  },

  'too much space': {
    intent: 'reduce whitespace',
    changes: {
      'globalStyles.spacing.density': 'compact',
      'globalStyles.spacing.sectionPadding': { action: 'decrease', steps: 1 },
      'globalStyles.spacing.componentGap': { action: 'decrease', steps: 1 },
    },
    explanation: 'Switching to compact density and reducing padding and gaps',
    keywords: ['too much space', 'too spread out', 'sparse', 'empty'],
  },

  'make it tighter': {
    intent: 'reduce spacing',
    changes: {
      'globalStyles.spacing.density': 'compact',
      'globalStyles.spacing.componentGap': 'sm',
    },
    explanation: 'Setting compact density with small component gaps',
    keywords: ['tighter', 'compact', 'condensed', 'dense'],
  },

  // ---------------------------------------------------------------------------
  // SIMPLICITY & COMPLEXITY
  // ---------------------------------------------------------------------------
  'too busy': {
    intent: 'simplify design',
    changes: {
      'globalStyles.effects.animations': 'subtle',
      'globalStyles.effects.gradients': false,
      'globalStyles.effects.shadows': 'subtle',
      'globalStyles.effects.blur': 'none',
    },
    explanation:
      'Reducing animations to subtle, removing gradients, softening shadows, and removing blur effects',
    keywords: ['busy', 'overwhelming', 'chaotic', 'noisy', 'distracting'],
  },

  'make it cleaner': {
    intent: 'minimize visual noise',
    changes: {
      'globalStyles.effects.shadows': 'subtle',
      'globalStyles.effects.gradients': false,
      'globalStyles.effects.borderRadius': 'md',
      'globalStyles.spacing.density': 'relaxed',
    },
    explanation:
      'Using subtle shadows, removing gradients, medium border radius, and relaxed spacing',
    keywords: ['cleaner', 'clean', 'minimal', 'simple', 'streamlined'],
  },

  'simplify it': {
    intent: 'reduce complexity',
    changes: {
      'globalStyles.effects.animations': 'none',
      'globalStyles.effects.gradients': false,
      'globalStyles.effects.shadows': 'none',
      'globalStyles.effects.blur': 'none',
    },
    explanation: 'Removing all animations, gradients, shadows, and blur effects',
    keywords: ['simplify', 'simpler', 'basic', 'plain'],
  },

  'more minimalist': {
    intent: 'achieve minimalist aesthetic',
    changes: {
      'basePreferences.style': 'minimalist',
      'globalStyles.effects.shadows': 'none',
      'globalStyles.effects.borderRadius': 'none',
      'globalStyles.effects.gradients': false,
      'globalStyles.spacing.density': 'relaxed',
    },
    explanation:
      'Setting minimalist style with no shadows, sharp corners, no gradients, and relaxed spacing',
    keywords: ['minimalist', 'minimal', 'less is more'],
  },

  // ---------------------------------------------------------------------------
  // PROFESSIONALISM & STYLE
  // ---------------------------------------------------------------------------
  'more professional': {
    intent: 'increase professionalism',
    changes: {
      'basePreferences.style': 'professional',
      'globalStyles.effects.animations': 'subtle',
      'globalStyles.typography.fontFamily': 'Inter',
      'globalStyles.effects.borderRadius': 'md',
      'globalStyles.effects.shadows': 'subtle',
    },
    explanation:
      'Setting professional style with Inter font, subtle animations, medium border radius, and subtle shadows',
    keywords: ['professional', 'corporate', 'business', 'formal', 'serious'],
  },

  'more playful': {
    intent: 'add playfulness',
    changes: {
      'basePreferences.style': 'playful',
      'globalStyles.effects.animations': 'playful',
      'globalStyles.effects.borderRadius': 'xl',
      'globalStyles.colors.primary': { action: 'saturate', amount: 20 },
    },
    explanation:
      'Setting playful style with playful animations, extra large border radius, and boosted color saturation',
    keywords: ['playful', 'fun', 'friendly', 'casual', 'whimsical'],
  },

  'more modern': {
    intent: 'modernize design',
    changes: {
      'basePreferences.style': 'modern',
      'globalStyles.effects.borderRadius': 'xl',
      'globalStyles.effects.blur': 'subtle',
      'globalStyles.typography.fontFamily': 'Inter',
      'globalStyles.effects.animations': 'smooth',
    },
    explanation:
      'Setting modern style with large rounded corners, subtle blur, Inter font, and smooth animations',
    keywords: ['modern', 'contemporary', 'current', 'trendy', 'fresh'],
  },

  'feels outdated': {
    intent: 'modernize design',
    changes: {
      'globalStyles.effects.borderRadius': 'lg',
      'globalStyles.typography.fontFamily': 'Inter',
      'globalStyles.effects.animations': 'smooth',
      'globalStyles.effects.shadows': 'medium',
    },
    explanation:
      'Updating to modern design with rounded corners, Inter font, smooth animations, and medium shadows',
    keywords: ['outdated', 'old', 'dated', 'stale', 'old-fashioned'],
  },

  // ---------------------------------------------------------------------------
  // DEPTH & FLATNESS
  // ---------------------------------------------------------------------------
  'feels flat': {
    intent: 'add depth',
    changes: {
      'globalStyles.effects.shadows': 'medium',
      'globalStyles.effects.gradients': true,
    },
    explanation: 'Adding medium shadows and enabling gradients for visual depth',
    keywords: ['flat', 'boring', 'lifeless', 'dull'],
  },

  'add more depth': {
    intent: 'increase depth',
    changes: {
      'globalStyles.effects.shadows': 'strong',
      'globalStyles.effects.gradients': true,
      'globalStyles.effects.blur': 'subtle',
    },
    explanation: 'Adding strong shadows, gradients, and subtle blur for layered depth',
    keywords: ['depth', 'dimension', 'layers', '3d'],
  },

  'too flat': {
    intent: 'add visual dimension',
    changes: {
      'globalStyles.effects.shadows': 'medium',
      'globalStyles.effects.borderRadius': 'lg',
    },
    explanation: 'Adding medium shadows and larger border radius for dimension',
    keywords: ['too flat', 'needs depth'],
  },

  // ---------------------------------------------------------------------------
  // ENERGY & MOTION
  // ---------------------------------------------------------------------------
  'needs energy': {
    intent: 'add dynamism',
    changes: {
      'globalStyles.effects.animations': 'playful',
      'globalStyles.colors.primary': { action: 'brighten', amount: 10 },
      'globalStyles.colors.accent': { action: 'saturate', amount: 20 },
    },
    explanation: 'Adding playful animations and brightening/saturating colors',
    keywords: ['energy', 'dynamic', 'lively', 'vibrant', 'exciting'],
  },

  'more animated': {
    intent: 'add motion',
    changes: {
      'globalStyles.effects.animations': 'playful',
    },
    explanation: 'Enabling playful animations throughout the design',
    keywords: ['animated', 'moving', 'motion', 'alive'],
  },

  'too static': {
    intent: 'add movement',
    changes: {
      'globalStyles.effects.animations': 'smooth',
    },
    explanation: 'Adding smooth animations for subtle movement',
    keywords: ['static', 'still', 'dead', 'unmoving'],
  },

  'remove animations': {
    intent: 'disable motion',
    changes: {
      'globalStyles.effects.animations': 'none',
    },
    explanation: 'Disabling all animations',
    keywords: ['no animations', 'remove animations', 'stop moving'],
  },

  // ---------------------------------------------------------------------------
  // COLOR & THEME
  // ---------------------------------------------------------------------------
  'too dark': {
    intent: 'lighten design',
    changes: {
      'basePreferences.colorScheme': 'light',
    },
    explanation: 'Switching to light color scheme',
    keywords: ['too dark', 'brighten', 'lighter'],
  },

  'too light': {
    intent: 'darken design',
    changes: {
      'basePreferences.colorScheme': 'dark',
    },
    explanation: 'Switching to dark color scheme',
    keywords: ['too light', 'darken', 'darker'],
  },

  'warmer colors': {
    intent: 'shift to warm palette',
    changes: {
      'globalStyles.colors.primary': { action: 'shift', hue: 30 },
      'globalStyles.colors.accent': { action: 'shift', hue: 20 },
    },
    explanation: 'Shifting colors toward warmer hues (orange/yellow)',
    keywords: ['warmer', 'warm', 'cozy', 'inviting'],
  },

  'cooler colors': {
    intent: 'shift to cool palette',
    changes: {
      'globalStyles.colors.primary': { action: 'shift', hue: -30 },
      'globalStyles.colors.accent': { action: 'shift', hue: -20 },
    },
    explanation: 'Shifting colors toward cooler hues (blue/teal)',
    keywords: ['cooler', 'cool', 'calm', 'serene'],
  },

  'more colorful': {
    intent: 'increase color variety',
    changes: {
      'globalStyles.colors.primary': { action: 'saturate', amount: 25 },
      'globalStyles.colors.secondary': { action: 'saturate', amount: 20 },
      'globalStyles.colors.accent': { action: 'saturate', amount: 30 },
      'globalStyles.effects.gradients': true,
    },
    explanation: 'Boosting saturation across all colors and enabling gradients',
    keywords: ['colorful', 'vibrant', 'rich colors', 'more color'],
  },

  'less colorful': {
    intent: 'reduce color intensity',
    changes: {
      'globalStyles.colors.primary': { action: 'desaturate', amount: 20 },
      'globalStyles.colors.accent': { action: 'desaturate', amount: 25 },
      'globalStyles.effects.gradients': false,
    },
    explanation: 'Desaturating colors and removing gradients',
    keywords: ['less colorful', 'muted', 'subdued', 'toned down'],
  },

  // ---------------------------------------------------------------------------
  // CORNERS & SHAPES
  // ---------------------------------------------------------------------------
  'more rounded': {
    intent: 'increase border radius',
    changes: {
      'globalStyles.effects.borderRadius': 'xl',
    },
    explanation: 'Setting extra large border radius for more rounded corners',
    keywords: ['rounded', 'rounder', 'soft corners', 'curves'],
  },

  'sharper corners': {
    intent: 'decrease border radius',
    changes: {
      'globalStyles.effects.borderRadius': 'sm',
    },
    explanation: 'Setting small border radius for sharper corners',
    keywords: ['sharp', 'sharper', 'hard corners', 'angular'],
  },

  'completely rounded': {
    intent: 'maximum border radius',
    changes: {
      'globalStyles.effects.borderRadius': 'full',
    },
    explanation: 'Setting full border radius for pill-shaped elements',
    keywords: ['pill', 'fully rounded', 'circular'],
  },

  'no rounded corners': {
    intent: 'remove border radius',
    changes: {
      'globalStyles.effects.borderRadius': 'none',
    },
    explanation: 'Removing all border radius for sharp square corners',
    keywords: ['square', 'no radius', 'straight corners'],
  },

  // ---------------------------------------------------------------------------
  // SHADOWS
  // ---------------------------------------------------------------------------
  'add shadows': {
    intent: 'enable shadows',
    changes: {
      'globalStyles.effects.shadows': 'medium',
    },
    explanation: 'Adding medium shadows to elements',
    keywords: ['add shadows', 'shadows', 'drop shadow'],
  },

  'stronger shadows': {
    intent: 'increase shadow intensity',
    changes: {
      'globalStyles.effects.shadows': 'strong',
    },
    explanation: 'Setting strong shadows for more pronounced depth',
    keywords: ['stronger shadows', 'more shadow', 'deeper shadows'],
  },

  'softer shadows': {
    intent: 'reduce shadow intensity',
    changes: {
      'globalStyles.effects.shadows': 'subtle',
    },
    explanation: 'Setting subtle shadows for softer depth',
    keywords: ['softer shadows', 'less shadow', 'gentle shadows'],
  },

  'remove shadows': {
    intent: 'disable shadows',
    changes: {
      'globalStyles.effects.shadows': 'none',
    },
    explanation: 'Removing all shadows',
    keywords: ['no shadows', 'remove shadows', 'flat'],
  },

  // ---------------------------------------------------------------------------
  // TYPOGRAPHY
  // ---------------------------------------------------------------------------
  'bigger text': {
    intent: 'increase text size',
    changes: {
      'globalStyles.typography.headingSize': { action: 'increase', steps: 1 },
      'globalStyles.typography.bodySize': { action: 'increase', steps: 1 },
    },
    explanation: 'Increasing heading and body text sizes by one level',
    keywords: ['bigger text', 'larger text', 'bigger font', 'increase font'],
  },

  'smaller text': {
    intent: 'decrease text size',
    changes: {
      'globalStyles.typography.headingSize': { action: 'decrease', steps: 1 },
      'globalStyles.typography.bodySize': { action: 'decrease', steps: 1 },
    },
    explanation: 'Decreasing heading and body text sizes by one level',
    keywords: ['smaller text', 'smaller font', 'decrease font'],
  },

  'bolder headings': {
    intent: 'increase heading weight',
    changes: {
      'globalStyles.typography.headingWeight': 'bold',
    },
    explanation: 'Setting heading weight to bold',
    keywords: ['bolder', 'heavier', 'thicker headings'],
  },

  'lighter headings': {
    intent: 'decrease heading weight',
    changes: {
      'globalStyles.typography.headingWeight': 'normal',
    },
    explanation: 'Setting heading weight to normal',
    keywords: ['lighter headings', 'thinner headings'],
  },

  'more readable': {
    intent: 'improve readability',
    changes: {
      'globalStyles.typography.lineHeight': 'relaxed',
      'globalStyles.typography.bodySize': 'base',
      'globalStyles.spacing.containerWidth': 'narrow',
    },
    explanation:
      'Setting relaxed line height, base body size, and narrow container for readability',
    keywords: ['readable', 'easier to read', 'legible'],
  },

  // ---------------------------------------------------------------------------
  // SPECIAL EFFECTS
  // ---------------------------------------------------------------------------
  'make it glassy': {
    intent: 'add glassmorphism',
    changes: {
      'globalStyles.effects.blur': 'medium',
      'globalStyles.effects.shadows': 'subtle',
    },
    explanation: 'Adding medium blur and subtle shadows for glass effect',
    keywords: ['glassy', 'glass', 'frosted', 'glassmorphism', 'transparent'],
  },

  'add blur': {
    intent: 'enable blur effects',
    changes: {
      'globalStyles.effects.blur': 'medium',
    },
    explanation: 'Adding medium blur effects',
    keywords: ['blur', 'blurry', 'frosted'],
  },

  'remove blur': {
    intent: 'disable blur effects',
    changes: {
      'globalStyles.effects.blur': 'none',
    },
    explanation: 'Removing all blur effects',
    keywords: ['no blur', 'remove blur', 'clear'],
  },

  // ---------------------------------------------------------------------------
  // LAYOUT
  // ---------------------------------------------------------------------------
  'make it wider': {
    intent: 'increase container width',
    changes: {
      'globalStyles.spacing.containerWidth': 'wide',
    },
    explanation: 'Setting container width to wide',
    keywords: ['wider', 'more width', 'expand'],
  },

  'make it narrower': {
    intent: 'decrease container width',
    changes: {
      'globalStyles.spacing.containerWidth': 'narrow',
    },
    explanation: 'Setting container width to narrow',
    keywords: ['narrower', 'less width', 'thinner'],
  },

  'full width': {
    intent: 'maximize container width',
    changes: {
      'globalStyles.spacing.containerWidth': 'full',
    },
    explanation: 'Setting container to full width',
    keywords: ['full width', 'edge to edge', 'full screen'],
  },
};

// ============================================================================
// INTERPRETATION FUNCTIONS
// ============================================================================

/**
 * Normalize text for matching (lowercase, remove punctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Calculate similarity score between two strings using keywords
 */
function calculateKeywordMatch(input: string, keywords: string[]): number {
  const normalizedInput = normalizeText(input);
  const inputWords = normalizedInput.split(/\s+/);

  let matchCount = 0;
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (
      normalizedInput.includes(normalizedKeyword) ||
      inputWords.some((word) => word === normalizedKeyword)
    ) {
      matchCount++;
    }
  }

  return keywords.length > 0 ? matchCount / keywords.length : 0;
}

/**
 * Find the best interpretation for a user's natural language input
 */
export function interpretDesignLanguage(userInput: string): InterpretationResult {
  const normalizedInput = normalizeText(userInput);

  let bestMatch: {
    phrase: string;
    interpretation: DesignInterpretation;
    confidence: number;
    keywords: string[];
  } | null = null;

  for (const [phrase, interpretation] of Object.entries(DESIGN_LANGUAGE_MAP)) {
    const normalizedPhrase = normalizeText(phrase);

    // Check for exact phrase match
    if (normalizedInput.includes(normalizedPhrase)) {
      const confidence = interpretation.confidence ?? 0.95;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          phrase,
          interpretation,
          confidence,
          keywords: [phrase],
        };
      }
      continue;
    }

    // Check for keyword matches
    const keywordScore = calculateKeywordMatch(normalizedInput, interpretation.keywords);
    if (keywordScore > 0.3) {
      const confidence = (interpretation.confidence ?? 0.7) * keywordScore;
      if (!bestMatch || confidence > bestMatch.confidence) {
        const matchedKeywords = interpretation.keywords.filter((k) =>
          normalizedInput.includes(normalizeText(k))
        );
        bestMatch = {
          phrase,
          interpretation,
          confidence,
          keywords: matchedKeywords,
        };
      }
    }
  }

  if (bestMatch && bestMatch.confidence >= 0.3) {
    return {
      matched: true,
      interpretation: bestMatch.interpretation,
      matchedPhrase: bestMatch.phrase,
      matchedKeywords: bestMatch.keywords,
      confidence: bestMatch.confidence,
    };
  }

  return {
    matched: false,
    confidence: 0,
  };
}

/**
 * Get all available interpretation phrases (for documentation/help)
 */
export function getAvailablePhrases(): string[] {
  return Object.keys(DESIGN_LANGUAGE_MAP);
}

/**
 * Get interpretation by exact phrase
 */
export function getInterpretation(phrase: string): DesignInterpretation | undefined {
  return DESIGN_LANGUAGE_MAP[phrase.toLowerCase()];
}

/**
 * Apply a step action to a scale value
 */
export function applyStepAction(currentValue: string, action: StepAction, scale: string[]): string {
  const currentIndex = scale.indexOf(currentValue);
  if (currentIndex === -1) return currentValue;

  const newIndex =
    action.action === 'increase'
      ? Math.min(currentIndex + action.steps, scale.length - 1)
      : Math.max(currentIndex - action.steps, 0);

  return scale[newIndex];
}

// ============================================================================
// SCALE DEFINITIONS (for step actions)
// ============================================================================

export const SCALES = {
  density: ['compact', 'normal', 'relaxed'],
  sectionPadding: ['sm', 'md', 'lg', 'xl'],
  componentGap: ['sm', 'md', 'lg', 'xl'],
  borderRadius: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
  shadows: ['none', 'subtle', 'medium', 'strong'],
  animations: ['none', 'subtle', 'smooth', 'playful'],
  blur: ['none', 'subtle', 'medium', 'strong'],
  headingSize: ['sm', 'base', 'lg', 'xl', '2xl'],
  bodySize: ['xs', 'sm', 'base', 'lg'],
  headingWeight: ['light', 'normal', 'medium', 'semibold', 'bold'],
  containerWidth: ['narrow', 'standard', 'wide', 'full'],
};

/**
 * Apply interpretation changes to a design
 * Returns the updated design with changes applied
 */
export function applyInterpretationChanges(
  design: Partial<LayoutDesign>,
  interpretation: DesignInterpretation
): {
  updatedDesign: Partial<LayoutDesign>;
  appliedChanges: Array<{ property: string; oldValue: unknown; newValue: unknown }>;
} {
  const updatedDesign = JSON.parse(JSON.stringify(design)) as Partial<LayoutDesign>;
  const appliedChanges: Array<{ property: string; oldValue: unknown; newValue: unknown }> = [];

  for (const [path, value] of Object.entries(interpretation.changes)) {
    const parts = path.split('.');
    let current: Record<string, unknown> = updatedDesign as Record<string, unknown>;
    let oldValue: unknown;

    // Navigate to the parent of the target property
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }

    const finalKey = parts[parts.length - 1];
    oldValue = current[finalKey];

    // Handle different value types
    if (typeof value === 'object' && value !== null && 'action' in value) {
      if ('steps' in value) {
        // Step action
        const stepAction = value as StepAction;
        const scaleKey = finalKey as keyof typeof SCALES;
        if (SCALES[scaleKey] && typeof oldValue === 'string') {
          const newValue = applyStepAction(oldValue, stepAction, SCALES[scaleKey]);
          current[finalKey] = newValue;
          appliedChanges.push({ property: path, oldValue, newValue });
        }
      } else {
        // Color action - just record it, actual color manipulation happens elsewhere
        appliedChanges.push({ property: path, oldValue, newValue: value });
      }
    } else {
      // Direct value assignment
      current[finalKey] = value;
      appliedChanges.push({ property: path, oldValue, newValue: value });
    }
  }

  return { updatedDesign, appliedChanges };
}

export default {
  DESIGN_LANGUAGE_MAP,
  interpretDesignLanguage,
  getAvailablePhrases,
  getInterpretation,
  applyStepAction,
  applyInterpretationChanges,
  SCALES,
};
