/**
 * Layout Builder Chat - API Route
 *
 * Handles AI-powered layout design conversations with vision capabilities.
 * Claude can "see" the layout preview via screenshots and provide visual feedback.
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  buildLayoutBuilderPrompt,
  buildPixelPerfectPrompt,
} from '@/prompts/layoutBuilderSystemPrompt';
import type {
  LayoutDesign,
  LayoutChatRequest,
  LayoutChatResponse,
  DesignChange,
  SuggestedAction,
  CompleteDesignAnalysis,
  QuickAnalysis,
  DesignContext,
} from '@/types/layoutDesign';
import {
  matchDesignPattern,
  applyPatternToDesign,
  type DesignPattern,
} from '@/utils/designPatterns';
import { parseDesignDescription } from '@/utils/designLanguageParser';
import { DesignReplicator } from '@/services/designReplicator';
import { getDalleService, getImageCost } from '@/services/dalleService';
import { getAnimationPreset, ANIMATION_PRESETS } from '@/data/animationPresets';
import type { DetectedAnimation } from '@/types/layoutDesign';

// Vercel serverless function config
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Hex color validation regex
const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

// Typography settings schema
const TypographySchema = z
  .object({
    fontFamily: z.string().optional(),
    headingWeight: z.enum(['light', 'normal', 'medium', 'semibold', 'bold']).optional(),
    bodyWeight: z.enum(['light', 'normal', 'medium', 'semibold']).optional(),
    headingSize: z.enum(['sm', 'base', 'lg', 'xl', '2xl']).optional(),
    bodySize: z.enum(['xs', 'sm', 'base', 'lg']).optional(),
    lineHeight: z.enum(['tight', 'normal', 'relaxed']).optional(),
    letterSpacing: z.enum(['tight', 'normal', 'wide']).optional(),
  })
  .strict()
  .optional();

// Color settings schema with hex validation
const ColorSchema = z
  .object({
    primary: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    secondary: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    accent: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    background: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    surface: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    text: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    textMuted: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    border: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    success: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    warning: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    error: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
    info: z.string().regex(hexColorRegex, 'Invalid hex color format').optional(),
  })
  .strict()
  .optional();

// Spacing settings schema
const SpacingSchema = z
  .object({
    density: z.enum(['compact', 'normal', 'relaxed']).optional(),
    containerWidth: z.enum(['narrow', 'standard', 'wide', 'full']).optional(),
    sectionPadding: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
    componentGap: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  })
  .strict()
  .optional();

// Effects settings schema
const EffectsSchema = z
  .object({
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).optional(),
    shadows: z.enum(['none', 'subtle', 'medium', 'strong']).optional(),
    animations: z.enum(['none', 'subtle', 'smooth', 'playful']).optional(),
    blur: z.enum(['none', 'subtle', 'medium', 'strong']).optional(),
    gradients: z.boolean().optional(),
  })
  .strict()
  .optional();

// Global styles schema
const GlobalStylesSchema = z
  .object({
    typography: TypographySchema,
    colors: ColorSchema,
    spacing: SpacingSchema,
    effects: EffectsSchema,
  })
  .strict()
  .optional();

// Base preferences schema
const BasePreferencesSchema = z
  .object({
    style: z.enum(['modern', 'minimalist', 'playful', 'professional', 'custom']).optional(),
    colorScheme: z.enum(['light', 'dark', 'auto', 'custom']).optional(),
    layout: z.enum(['single-page', 'multi-page', 'dashboard', 'custom']).optional(),
  })
  .strict()
  .optional();

// Component schemas
const HeaderDesignSchema = z
  .object({
    visible: z.boolean().optional(),
    height: z.enum(['compact', 'standard', 'tall']).optional(),
    style: z.enum(['solid', 'gradient', 'blur', 'transparent']).optional(),
    logoPosition: z.enum(['left', 'center', 'right']).optional(),
    navPosition: z.enum(['left', 'center', 'right']).optional(),
    hasSearch: z.boolean().optional(),
    hasCTA: z.boolean().optional(),
    ctaText: z.string().optional(),
    ctaStyle: z.enum(['filled', 'outline', 'ghost']).optional(),
  })
  .strict()
  .optional();

const SidebarDesignSchema = z
  .object({
    visible: z.boolean().optional(),
    position: z.enum(['left', 'right']).optional(),
    width: z.enum(['narrow', 'standard', 'wide']).optional(),
    collapsible: z.boolean().optional(),
    defaultCollapsed: z.boolean().optional(),
    style: z.enum(['standard', 'minimal', 'floating']).optional(),
    iconOnly: z.boolean().optional(),
    hasLogo: z.boolean().optional(),
  })
  .strict()
  .optional();

const HeroDesignSchema = z
  .object({
    visible: z.boolean().optional(),
    height: z.enum(['compact', 'standard', 'tall', 'fullscreen']).optional(),
    layout: z.enum(['centered', 'split', 'offset']).optional(),
    hasImage: z.boolean().optional(),
    imagePosition: z.enum(['left', 'right', 'background']).optional(),
    hasSubtitle: z.boolean().optional(),
    hasCTA: z.boolean().optional(),
    ctaCount: z.number().min(1).max(3).optional(),
  })
  .strict()
  .optional();

const CardDesignSchema = z
  .object({
    style: z.enum(['minimal', 'bordered', 'elevated', 'filled']).optional(),
    imagePosition: z.enum(['none', 'top', 'left', 'right', 'background']).optional(),
    showBadge: z.boolean().optional(),
    showFooter: z.boolean().optional(),
    hoverEffect: z.enum(['none', 'lift', 'glow', 'scale', 'border']).optional(),
    aspectRatio: z.enum(['auto', 'square', 'portrait', 'landscape', 'video']).optional(),
  })
  .strict()
  .optional();

const FooterDesignSchema = z
  .object({
    visible: z.boolean().optional(),
    style: z.enum(['minimal', 'standard', 'rich']).optional(),
    columns: z.number().min(1).max(5).optional(),
    showSocial: z.boolean().optional(),
    showNewsletter: z.boolean().optional(),
    showCopyright: z.boolean().optional(),
    position: z.enum(['static', 'fixed', 'sticky']).optional(),
  })
  .strict()
  .optional();

// Components schema
const ComponentsSchema = z
  .object({
    header: HeaderDesignSchema,
    sidebar: SidebarDesignSchema,
    hero: HeroDesignSchema,
    cards: CardDesignSchema,
    footer: FooterDesignSchema,
  })
  .strict()
  .optional();

// Structure schema
const StructureSchema = z
  .object({
    type: z.enum(['single-page', 'multi-page', 'dashboard', 'landing']).optional(),
    hasHeader: z.boolean().optional(),
    hasSidebar: z.boolean().optional(),
    hasFooter: z.boolean().optional(),
    sidebarPosition: z.enum(['left', 'right']).optional(),
    headerType: z.enum(['fixed', 'sticky', 'static']).optional(),
    contentLayout: z.enum(['centered', 'full-width', 'offset']).optional(),
    mainContentWidth: z.enum(['narrow', 'standard', 'wide', 'full']).optional(),
  })
  .strict()
  .optional();

// Responsive schema
const ResponsiveSchema = z
  .object({
    mobileBreakpoint: z.number().optional(),
    tabletBreakpoint: z.number().optional(),
    mobileLayout: z.enum(['stack', 'drawer', 'bottom-nav']).optional(),
    mobileHeader: z.enum(['hamburger', 'bottom-tabs', 'minimal']).optional(),
    hideSidebarOnMobile: z.boolean().optional(),
    stackCardsOnMobile: z.boolean().optional(),
  })
  .strict()
  .optional();

// Complete design updates schema
const DesignUpdatesSchema = z
  .object({
    basePreferences: BasePreferencesSchema,
    globalStyles: GlobalStylesSchema,
    components: ComponentsSchema,
    structure: StructureSchema,
    responsive: ResponsiveSchema,
  })
  .strict();

// Design change schema
const DesignChangeSchema = z.object({
  property: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
  reason: z.string(),
});

// Complete extraction response schema
const ExtractionResponseSchema = z.object({
  updates: DesignUpdatesSchema.optional().default({}),
  changes: z.array(DesignChangeSchema).optional().default([]),
});

// ============================================================================
// TOOL DEFINITIONS FOR ANIMATION & BACKGROUND GENERATION
// ============================================================================

const LAYOUT_BUILDER_TOOLS: Anthropic.Tool[] = [
  {
    name: 'generate_background',
    description:
      'Generate a custom background image using DALL-E 3. Use this when the user asks for a generated background, custom image, or AI-created visual asset. Returns the generated image URL and cost info.',
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: {
          type: 'string',
          description:
            'Detailed description of the background to generate. Include style, colors, mood, and pattern preferences.',
        },
        targetElement: {
          type: 'string',
          description:
            'CSS selector or element name where the background should be applied (e.g., ".hero-section", "header", "body")',
        },
        style: {
          type: 'string',
          enum: ['abstract', 'geometric', 'gradient', 'texture', 'natural', 'vivid'],
          description: 'Visual style for the generated background',
        },
        quality: {
          type: 'string',
          enum: ['standard', 'hd'],
          description: 'Image quality - standard ($0.04) or hd ($0.08-0.12)',
        },
      },
      required: ['prompt', 'targetElement'],
    },
  },
  {
    name: 'apply_animation',
    description:
      'Apply an animation to a specific element in the layout. Use this when the user wants to add motion, transitions, or effects to elements. Can use preset animations or create custom ones.',
    input_schema: {
      type: 'object' as const,
      properties: {
        animationType: {
          type: 'string',
          description:
            'Type of animation (fade, slide, scale, rotate, gradient-shift, particle-flow, wave, morph, aurora, noise-texture, etc.)',
        },
        targetElement: {
          type: 'string',
          description: 'CSS selector or element name to apply animation to',
        },
        presetId: {
          type: 'string',
          description:
            'Optional: ID of a preset animation to use (e.g., fadeIn, hoverLift, gradientShift)',
        },
        duration: {
          type: 'string',
          description: 'Animation duration (e.g., "0.3s", "2s", "500ms")',
        },
        easing: {
          type: 'string',
          description:
            'Easing function (e.g., "ease-out", "ease-in-out", "cubic-bezier(0.4, 0, 0.2, 1)")',
        },
        delay: {
          type: 'string',
          description: 'Animation delay (e.g., "0.1s")',
        },
        iterations: {
          type: 'string',
          description: 'Number of iterations ("1", "3", "infinite")',
        },
      },
      required: ['animationType', 'targetElement'],
    },
  },
  {
    name: 'list_elements',
    description:
      'List the available elements in the current layout that can be selected for animation or styling. Use this when the user needs to choose an element or when clarification is needed about which element to target.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'sections', 'components', 'interactive'],
          description: 'Filter elements by category',
        },
      },
      required: [],
    },
  },
];

// ============================================================================
// TOOL EXECUTION HANDLERS
// ============================================================================

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  cost?: number;
  remaining?: number;
}

/**
 * Execute the generate_background tool
 */
async function executeGenerateBackground(input: {
  prompt: string;
  targetElement: string;
  style?: string;
  quality?: 'standard' | 'hd';
}): Promise<ToolResult> {
  const dalleService = getDalleService();

  if (!dalleService.checkAvailability()) {
    return {
      success: false,
      error: 'DALL-E service not available. OPENAI_API_KEY not configured.',
    };
  }

  try {
    const quality = input.quality || 'standard';
    const size = '1024x1024';
    const cost = getImageCost(quality, size);

    // Build enhanced prompt for background generation
    const enhancedPrompt = `Create a web application background image. ${input.prompt}

Style: ${input.style || 'abstract'}
Requirements:
- Suitable as a website background for ${input.targetElement}
- Must not be distracting, allowing content to remain readable
- Professional, modern aesthetic
- No text or logos`;

    const result = await dalleService.generateImage({
      prompt: enhancedPrompt,
      size,
      quality,
      style: input.style === 'vivid' ? 'vivid' : 'natural',
    });

    return {
      success: true,
      data: {
        imageUrl: result.url,
        revisedPrompt: result.revisedPrompt,
        targetElement: input.targetElement,
        size,
        quality,
      },
      cost,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate background image',
    };
  }
}

/**
 * Execute the apply_animation tool
 */
function executeApplyAnimation(input: {
  animationType: string;
  targetElement: string;
  presetId?: string;
  duration?: string;
  easing?: string;
  delay?: string;
  iterations?: string;
}): ToolResult {
  // If preset ID provided, use the preset
  let animation: Partial<DetectedAnimation> = {};

  if (input.presetId) {
    const preset = getAnimationPreset(input.presetId);
    if (preset) {
      animation = {
        id: `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: input.animationType as DetectedAnimation['type'],
        element: `Animation for ${input.targetElement}`,
        targetElement: input.targetElement,
        property: 'transform',
        fromValue: '0',
        toValue: '1',
        duration: input.duration || `${preset.duration}ms`,
        easing: input.easing || preset.easing,
        delay: input.delay,
        iterations:
          input.iterations === 'infinite' ? 'infinite' : parseInt(input.iterations || '1'),
        cssKeyframes: preset.css.keyframes,
        cssAnimation: preset.css.animation,
        tailwindConfig: preset.tailwind,
        framerMotionVariants: preset.framerMotion,
        confidence: 1,
        matchedPreset: preset.id,
        presetConfidence: 1,
      };
    }
  }

  // If no preset or preset not found, create custom animation
  if (!animation.id) {
    animation = {
      id: `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: input.animationType as DetectedAnimation['type'],
      element: `Custom animation for ${input.targetElement}`,
      targetElement: input.targetElement,
      property: getPropertyForAnimationType(input.animationType),
      fromValue: '0',
      toValue: '1',
      duration: input.duration || '0.3s',
      easing: input.easing || 'ease-out',
      delay: input.delay,
      iterations: input.iterations === 'infinite' ? 'infinite' : parseInt(input.iterations || '1'),
      confidence: 0.9,
    };
  }

  return {
    success: true,
    data: {
      animation,
      targetElement: input.targetElement,
      message: `Applied ${input.animationType} animation to ${input.targetElement}`,
    },
  };
}

/**
 * Get the CSS property for an animation type
 */
function getPropertyForAnimationType(type: string): string {
  const propertyMap: Record<string, string> = {
    fade: 'opacity',
    slide: 'transform',
    scale: 'transform',
    rotate: 'transform',
    'color-change': 'background-color',
    blur: 'filter',
    parallax: 'transform',
    'hover-effect': 'transform',
    'scroll-reveal': 'opacity, transform',
    'page-transition': 'opacity, transform',
    loading: 'transform',
    'micro-interaction': 'transform',
    'gradient-shift': 'background-position',
    'particle-flow': 'transform',
    wave: 'transform',
    morph: 'border-radius',
    aurora: 'opacity, transform',
    'noise-texture': 'transform',
  };
  return propertyMap[type] || 'transform';
}

/**
 * Execute the list_elements tool
 */
function executeListElements(currentDesign: Partial<LayoutDesign>, category?: string): ToolResult {
  // Build list of available elements based on current design
  const elements: Array<{ selector: string; name: string; category: string }> = [];

  // Add structure elements
  if (currentDesign.structure?.hasHeader || currentDesign.components?.header?.visible) {
    elements.push({ selector: 'header', name: 'Header', category: 'sections' });
    elements.push({ selector: '.nav-item', name: 'Navigation Items', category: 'interactive' });
  }

  if (currentDesign.components?.hero?.visible) {
    elements.push({ selector: '.hero-section', name: 'Hero Section', category: 'sections' });
    elements.push({ selector: '.hero-title', name: 'Hero Title', category: 'components' });
    elements.push({ selector: '.hero-subtitle', name: 'Hero Subtitle', category: 'components' });
    if (currentDesign.components.hero.hasCTA) {
      elements.push({ selector: '.hero-cta', name: 'Hero CTA Button', category: 'interactive' });
    }
  }

  if (currentDesign.structure?.hasSidebar || currentDesign.components?.sidebar?.visible) {
    elements.push({ selector: '.sidebar', name: 'Sidebar', category: 'sections' });
  }

  // Add card elements if cards are configured
  if (currentDesign.components?.cards) {
    elements.push({ selector: '.card', name: 'Card Component', category: 'components' });
    elements.push({ selector: '.card-grid', name: 'Card Grid', category: 'sections' });
  }

  if (currentDesign.structure?.hasFooter || currentDesign.components?.footer?.visible) {
    elements.push({ selector: 'footer', name: 'Footer', category: 'sections' });
  }

  // Always include common elements
  elements.push({ selector: 'body', name: 'Page Background', category: 'sections' });
  elements.push({ selector: '.main-content', name: 'Main Content Area', category: 'sections' });
  elements.push({ selector: '.button', name: 'Buttons', category: 'interactive' });
  elements.push({ selector: '.section', name: 'Content Sections', category: 'sections' });

  // Filter by category if specified
  const filteredElements =
    category && category !== 'all' ? elements.filter((el) => el.category === category) : elements;

  return {
    success: true,
    data: {
      elements: filteredElements,
      totalCount: filteredElements.length,
      availablePresets: ANIMATION_PRESETS.slice(0, 10).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        description: p.description,
      })),
    },
  };
}

/**
 * Process tool calls from Claude's response
 */
async function processToolCalls(
  toolUseBlocks: Anthropic.ToolUseBlock[],
  currentDesign: Partial<LayoutDesign>
): Promise<{
  results: Array<{ toolName: string; result: ToolResult }>;
  animations: DetectedAnimation[];
  generatedImages: Array<{ url: string; targetElement: string; prompt: string }>;
}> {
  const results: Array<{ toolName: string; result: ToolResult }> = [];
  const animations: DetectedAnimation[] = [];
  const generatedImages: Array<{ url: string; targetElement: string; prompt: string }> = [];

  for (const toolUse of toolUseBlocks) {
    let result: ToolResult;
    const input = toolUse.input as Record<string, unknown>;

    switch (toolUse.name) {
      case 'generate_background':
        result = await executeGenerateBackground({
          prompt: input.prompt as string,
          targetElement: input.targetElement as string,
          style: input.style as string | undefined,
          quality: input.quality as 'standard' | 'hd' | undefined,
        });
        if (result.success && result.data) {
          const data = result.data as {
            imageUrl: string;
            targetElement: string;
            revisedPrompt: string;
          };
          generatedImages.push({
            url: data.imageUrl,
            targetElement: data.targetElement,
            prompt: data.revisedPrompt,
          });
        }
        break;

      case 'apply_animation':
        result = executeApplyAnimation({
          animationType: input.animationType as string,
          targetElement: input.targetElement as string,
          presetId: input.presetId as string | undefined,
          duration: input.duration as string | undefined,
          easing: input.easing as string | undefined,
          delay: input.delay as string | undefined,
          iterations: input.iterations as string | undefined,
        });
        if (result.success && result.data) {
          const data = result.data as { animation: DetectedAnimation };
          animations.push(data.animation);
        }
        break;

      case 'list_elements':
        result = executeListElements(currentDesign, input.category as string | undefined);
        break;

      default:
        result = { success: false, error: `Unknown tool: ${toolUse.name}` };
    }

    results.push({ toolName: toolUse.name, result });
  }

  return { results, animations, generatedImages };
}

// ============================================================================
// DESIGN EXTRACTION
// ============================================================================

/**
 * Extract design changes from the AI response
 * Looks for specific property change suggestions
 * Uses Zod validation to ensure extracted data is valid
 */
async function extractDesignUpdates(
  response: string,
  currentDesign: Partial<LayoutDesign>
): Promise<{
  updates: Partial<LayoutDesign>;
  changes: DesignChange[];
  validationErrors?: string[];
}> {
  const extractionPrompt = `Analyze this design assistant response and extract any specific design changes mentioned.

Return a JSON object with:
1. "updates" - A partial LayoutDesign object with only the fields that should be changed
2. "changes" - An array describing each change

**IMPORTANT VALIDATION RULES:**
- Color values MUST be valid hex codes (e.g., "#3B82F6" or "#FFF")
- borderRadius must be one of: "none", "sm", "md", "lg", "xl", "full"
- shadows must be one of: "none", "subtle", "medium", "strong"
- animations must be one of: "none", "subtle", "smooth", "playful"
- style must be one of: "modern", "minimalist", "playful", "professional", "custom"
- colorScheme must be one of: "light", "dark", "auto", "custom"
- layout must be one of: "single-page", "multi-page", "dashboard", "custom"

**RESPONSE TO ANALYZE:**
${response}

**CURRENT DESIGN STATE:**
${JSON.stringify(currentDesign, null, 2)}

Return ONLY valid JSON in this format:
{
  "updates": {
    "globalStyles": {
      "colors": { "primary": "#6366F1" },
      "effects": { "borderRadius": "xl" }
    }
  },
  "changes": [
    {
      "property": "globalStyles.colors.primary",
      "oldValue": "#3B82F6",
      "newValue": "#6366F1",
      "reason": "Changed to purple for a more vibrant feel"
    }
  ]
}

If no specific changes were suggested, return:
{
  "updates": {},
  "changes": []
}`;

  try {
    const extractResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content: extractionPrompt }],
    });

    const textBlock = extractResponse.content.find((block) => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      let jsonText = textBlock.text.trim();
      // Clean markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText
          .replace(/```json?\n?/g, '')
          .replace(/```$/g, '')
          .trim();
      }

      const rawExtracted = JSON.parse(jsonText);

      // Validate using Zod schema
      const validationResult = ExtractionResponseSchema.safeParse(rawExtracted);

      if (validationResult.success) {
        // Validation passed - use validated data (cast to Partial<LayoutDesign>)
        return {
          updates: validationResult.data.updates as Partial<LayoutDesign>,
          changes: (validationResult.data.changes || []) as DesignChange[],
        };
      } else {
        // Validation failed - log errors and attempt partial recovery
        const errors = validationResult.error.issues.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        );
        console.warn('Design extraction validation errors:', errors);

        // Try to salvage valid parts by removing invalid fields
        const sanitizedUpdates = sanitizeDesignUpdates(rawExtracted.updates || {});
        const sanitizedChanges = (rawExtracted.changes || [])
          .filter((c: unknown) => {
            const result = DesignChangeSchema.safeParse(c);
            return result.success;
          })
          .map((c: unknown) => c as DesignChange);

        return {
          updates: sanitizedUpdates,
          changes: sanitizedChanges,
          validationErrors: errors,
        };
      }
    }
  } catch (error) {
    console.error('Design extraction error:', error);
  }

  return { updates: {}, changes: [] };
}

/**
 * Sanitize design updates by removing invalid fields
 * Attempts to preserve valid data while discarding invalid values
 * Uses explicit type casting since we're dealing with partial/validated data
 */
function sanitizeDesignUpdates(updates: Record<string, unknown>): Partial<LayoutDesign> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitized: Record<string, any> = {};

  // Validate and sanitize basePreferences
  if (updates.basePreferences && typeof updates.basePreferences === 'object') {
    const baseResult = BasePreferencesSchema.safeParse(updates.basePreferences);
    if (baseResult.success && baseResult.data) {
      sanitized.basePreferences = baseResult.data;
    }
  }

  // Validate and sanitize globalStyles
  if (updates.globalStyles && typeof updates.globalStyles === 'object') {
    const stylesInput = updates.globalStyles as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitizedStyles: Record<string, any> = {};

    // Validate each sub-section separately
    if (stylesInput.typography) {
      const typoResult = TypographySchema.safeParse(stylesInput.typography);
      if (typoResult.success && typoResult.data) {
        sanitizedStyles.typography = typoResult.data;
      }
    }
    if (stylesInput.colors) {
      const colorsResult = ColorSchema.safeParse(stylesInput.colors);
      if (colorsResult.success && colorsResult.data) {
        sanitizedStyles.colors = colorsResult.data;
      } else {
        // Try to salvage valid colors individually
        const validColors = sanitizeColors(stylesInput.colors as Record<string, unknown>);
        if (Object.keys(validColors).length > 0) {
          sanitizedStyles.colors = validColors;
        }
      }
    }
    if (stylesInput.spacing) {
      const spacingResult = SpacingSchema.safeParse(stylesInput.spacing);
      if (spacingResult.success && spacingResult.data) {
        sanitizedStyles.spacing = spacingResult.data;
      }
    }
    if (stylesInput.effects) {
      const effectsResult = EffectsSchema.safeParse(stylesInput.effects);
      if (effectsResult.success && effectsResult.data) {
        sanitizedStyles.effects = effectsResult.data;
      }
    }

    if (Object.keys(sanitizedStyles).length > 0) {
      sanitized.globalStyles = sanitizedStyles;
    }
  }

  // Validate and sanitize components
  if (updates.components && typeof updates.components === 'object') {
    const componentsResult = ComponentsSchema.safeParse(updates.components);
    if (componentsResult.success && componentsResult.data) {
      sanitized.components = componentsResult.data;
    }
  }

  // Validate and sanitize structure
  if (updates.structure && typeof updates.structure === 'object') {
    const structureResult = StructureSchema.safeParse(updates.structure);
    if (structureResult.success && structureResult.data) {
      sanitized.structure = structureResult.data;
    }
  }

  // Validate and sanitize responsive
  if (updates.responsive && typeof updates.responsive === 'object') {
    const responsiveResult = ResponsiveSchema.safeParse(updates.responsive);
    if (responsiveResult.success && responsiveResult.data) {
      sanitized.responsive = responsiveResult.data;
    }
  }

  return sanitized as Partial<LayoutDesign>;
}

/**
 * Sanitize individual color values, keeping only valid hex colors
 */
function sanitizeColors(colors: Record<string, unknown>): Record<string, string> {
  const validColors: Record<string, string> = {};

  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string' && hexColorRegex.test(value)) {
      validColors[key] = value;
    }
  }

  return validColors;
}

/**
 * Deep merge design updates into current design
 */
function mergeDesignUpdates(
  current: Partial<LayoutDesign>,
  updates: Partial<LayoutDesign>
): Partial<LayoutDesign> {
  const merged = { ...current };

  // Merge globalStyles
  if (updates.globalStyles) {
    merged.globalStyles = {
      ...current.globalStyles,
      ...updates.globalStyles,
      typography: {
        ...current.globalStyles?.typography,
        ...updates.globalStyles?.typography,
      },
      colors: {
        ...current.globalStyles?.colors,
        ...updates.globalStyles?.colors,
      },
      spacing: {
        ...current.globalStyles?.spacing,
        ...updates.globalStyles?.spacing,
      },
      effects: {
        ...current.globalStyles?.effects,
        ...updates.globalStyles?.effects,
      },
    } as LayoutDesign['globalStyles'];
  }

  // Merge components
  if (updates.components) {
    merged.components = {
      ...current.components,
      ...updates.components,
    };
  }

  // Merge structure
  if (updates.structure) {
    merged.structure = {
      ...current.structure,
      ...updates.structure,
    } as LayoutDesign['structure'];
  }

  // Merge responsive
  if (updates.responsive) {
    merged.responsive = {
      ...current.responsive,
      ...updates.responsive,
    } as LayoutDesign['responsive'];
  }

  // Merge base preferences
  if (updates.basePreferences) {
    merged.basePreferences = {
      ...current.basePreferences,
      ...updates.basePreferences,
    } as LayoutDesign['basePreferences'];
  }

  return merged;
}

/**
 * Detect and apply design patterns from user message
 * Returns pattern info and enhanced updates if a pattern was detected
 */
function detectAndApplyPattern(
  userMessage: string,
  currentDesign: Partial<LayoutDesign>,
  extractedUpdates: Partial<LayoutDesign>
): {
  updates: Partial<LayoutDesign>;
  detectedPattern: DesignPattern | null;
  patternApplied: boolean;
} {
  // Try to match a design pattern from the user's message
  const detectedPattern = matchDesignPattern(userMessage);

  if (detectedPattern) {
    // Pattern detected - apply it to the design and merge with extracted updates
    const patternAppliedDesign = applyPatternToDesign(currentDesign, detectedPattern);

    // Merge extracted updates on top of pattern (user explicit requests override pattern defaults)
    const mergedUpdates: Partial<LayoutDesign> = {
      ...patternAppliedDesign,
      ...extractedUpdates,
      globalStyles: {
        ...patternAppliedDesign.globalStyles,
        ...extractedUpdates.globalStyles,
        colors: {
          ...patternAppliedDesign.globalStyles?.colors,
          ...extractedUpdates.globalStyles?.colors,
        },
        typography: {
          ...patternAppliedDesign.globalStyles?.typography,
          ...extractedUpdates.globalStyles?.typography,
        },
        spacing: {
          ...patternAppliedDesign.globalStyles?.spacing,
          ...extractedUpdates.globalStyles?.spacing,
        },
        effects: {
          ...patternAppliedDesign.globalStyles?.effects,
          ...extractedUpdates.globalStyles?.effects,
        },
      } as LayoutDesign['globalStyles'],
    };

    return {
      updates: mergedUpdates,
      detectedPattern,
      patternApplied: true,
    };
  }

  // No pattern matched - try parsing design vocabulary from message
  const parsedDesign = parseDesignDescription(userMessage);

  if (Object.keys(parsedDesign).length > 0) {
    // Design vocabulary found - merge with extracted updates
    // Use type assertion since DeepPartial types don't match Partial exactly
    const mergedUpdates = {
      ...parsedDesign,
      ...extractedUpdates,
      globalStyles: {
        ...parsedDesign.globalStyles,
        ...extractedUpdates.globalStyles,
        colors: {
          ...parsedDesign.globalStyles?.colors,
          ...extractedUpdates.globalStyles?.colors,
        },
        typography: {
          ...parsedDesign.globalStyles?.typography,
          ...extractedUpdates.globalStyles?.typography,
        },
        spacing: {
          ...parsedDesign.globalStyles?.spacing,
          ...extractedUpdates.globalStyles?.spacing,
        },
        effects: {
          ...parsedDesign.globalStyles?.effects,
          ...extractedUpdates.globalStyles?.effects,
        },
      } as LayoutDesign['globalStyles'],
    } as Partial<LayoutDesign>;

    return {
      updates: mergedUpdates,
      detectedPattern: null,
      patternApplied: false,
    };
  }

  // No pattern or vocabulary detected
  return {
    updates: extractedUpdates,
    detectedPattern: null,
    patternApplied: false,
  };
}

/**
 * Generate suggested actions based on conversation state
 */
function generateSuggestedActions(
  design: Partial<LayoutDesign>,
  messageCount: number,
  hasScreenshot: boolean
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Always suggest capturing if no screenshot was provided
  if (!hasScreenshot && messageCount > 0) {
    actions.push({
      label: 'Capture Preview',
      action: 'capture_preview',
      icon: '📸',
    });
  }

  // Suggest reference upload if none exist
  if (!design.referenceMedia?.length) {
    actions.push({
      label: 'Upload Inspiration',
      action: 'upload_reference',
      icon: '🎨',
    });
  }

  // Suggest theme toggle
  const isDark = design.basePreferences?.colorScheme === 'dark';
  actions.push({
    label: isDark ? 'Try Light Mode' : 'Try Dark Mode',
    action: 'toggle_theme',
    icon: isDark ? '☀️' : '🌙',
  });

  // Suggest saving after some conversation
  if (messageCount >= 4) {
    actions.push({
      label: 'Save Design',
      action: 'save_design',
      icon: '💾',
    });
  }

  // Suggest applying to concept after significant progress
  if (messageCount >= 6 && design.globalStyles?.colors?.primary) {
    actions.push({
      label: 'Apply to App Concept',
      action: 'apply_to_concept',
      icon: '✨',
    });
  }

  return actions;
}

// ============================================================================
// CONTEXT EXTRACTION
// ============================================================================

/**
 * Extract design context from user message
 * Detects purpose, target users, and requirements from natural language
 */
function extractDesignContext(
  userMessage: string,
  existingContext?: DesignContext
): DesignContext | null {
  const context: DesignContext = { ...existingContext };
  let hasNewContext = false;

  // Purpose detection patterns
  const purposePatterns = [
    /(?:building|creating|designing|making|working on)\s+(?:a|an|the)?\s*([^,.]+?)(?:\s+(?:for|aimed|targeted|designed)|\s*[,.]|$)/i,
    /(?:this is|it's|its)\s+(?:a|an|the)?\s*([^,.]+?)(?:\s+(?:for|aimed)|\s*[,.]|$)/i,
    /(?:app|site|website|platform|dashboard|portal|store|shop)\s+(?:for|about|to)\s+([^,.]+)/i,
  ];

  for (const pattern of purposePatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1] && match[1].length > 3 && match[1].length < 100) {
      const purpose = match[1].trim();
      // Avoid matching design-related terms
      if (!/^(modern|dark|light|minimal|clean|professional)/i.test(purpose)) {
        context.purpose = purpose;
        hasNewContext = true;
        break;
      }
    }
  }

  // Target users detection patterns
  const userPatterns = [
    /(?:for|aimed at|targeting|designed for|meant for)\s+([^,.]+?)(?:\s+(?:who|that|and)|\s*[,.]|$)/i,
    /(?:users?|audience|customers?|clients?)\s+(?:are|will be|include)\s+([^,.]+)/i,
    /(?:small business|enterprise|developers?|designers?|teams?|professionals?|students?|creators?)/i,
  ];

  for (const pattern of userPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      const users = match[1] ? match[1].trim() : match[0].trim();
      if (users.length > 2 && users.length < 100) {
        context.targetUsers = users;
        hasNewContext = true;
        break;
      }
    }
  }

  // Requirements detection
  const requirementPatterns = [
    { pattern: /mobile[- ]?first/i, req: 'Mobile-first' },
    { pattern: /accessible|accessibility|a11y/i, req: 'Accessible' },
    { pattern: /fast|performance|speed/i, req: 'Fast loading' },
    { pattern: /premium|luxury|high[- ]?end/i, req: 'Premium feel' },
    { pattern: /simple|minimal|clean/i, req: 'Simple & clean' },
    { pattern: /professional|corporate|business/i, req: 'Professional' },
    { pattern: /playful|fun|friendly/i, req: 'Playful' },
    { pattern: /dark\s*mode/i, req: 'Dark mode' },
    { pattern: /responsive/i, req: 'Responsive' },
  ];

  const requirements = new Set(existingContext?.requirements || []);
  for (const { pattern, req } of requirementPatterns) {
    if (pattern.test(userMessage)) {
      requirements.add(req);
      hasNewContext = true;
    }
  }

  if (requirements.size > 0) {
    context.requirements = Array.from(requirements);
  }

  if (hasNewContext) {
    context.lastUpdated = new Date().toISOString();
    return context;
  }

  return null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: Request) {
  try {
    const body: LayoutChatRequest = await request.json();
    const {
      message,
      conversationHistory,
      currentDesign,
      selectedElement,
      previewScreenshot,
      referenceImages,
      analysisMode = 'standard',
      requestedAnalysis,
    } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'Anthropic API key not configured',
        },
        { status: 500 }
      );
    }

    // Handle pixel-perfect mode with reference images
    let pixelPerfectAnalysis: CompleteDesignAnalysis | null = null;
    let quickAnalysisResult: QuickAnalysis | null = null;

    if (analysisMode === 'pixel-perfect' && referenceImages && referenceImages.length > 0) {
      const replicator = new DesignReplicator(process.env.ANTHROPIC_API_KEY);

      try {
        if (requestedAnalysis === 'quick') {
          // Quick analysis only
          quickAnalysisResult = await replicator.quickAnalysis(referenceImages[0]);
        } else if (requestedAnalysis === 'deep' || requestedAnalysis === 'full') {
          // Full analysis (quick + deep)
          const fullResult = await replicator.fullAnalysis(referenceImages[0]);
          pixelPerfectAnalysis = fullResult.deep;
          quickAnalysisResult = fullResult.quick;
        } else {
          // Default: quick analysis for faster response
          quickAnalysisResult = await replicator.quickAnalysis(referenceImages[0]);
        }
      } catch (analysisError) {
        console.error('Pixel-perfect analysis error:', analysisError);
        // Continue with standard mode if analysis fails
      }
    }

    // Build Claude messages from conversation history
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content,
      });
    }

    // Build current message with images
    const currentContent: Anthropic.ContentBlockParam[] = [];

    // Add preview screenshot if provided
    if (previewScreenshot) {
      const match = previewScreenshot.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        currentContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: match[2],
          },
        });
      }
    }

    // Add reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      for (const imageData of referenceImages) {
        const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          currentContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: match[2],
            },
          });
        }
      }
    }

    // Add text message
    let messageText = message;

    // Add selected element context to message
    if (selectedElement) {
      messageText = `[User has selected the "${selectedElement}" element in the preview]\n\n${message}`;
    }

    currentContent.push({ type: 'text', text: messageText });

    // Add current message
    messages.push({
      role: 'user',
      content: currentContent.length > 1 ? currentContent : messageText,
    });

    // Build system prompt with context
    let systemPrompt: string;

    if (analysisMode === 'pixel-perfect' && referenceImages?.length) {
      // Use pixel-perfect prompt for design replication
      const hasAnalysis = !!(pixelPerfectAnalysis || quickAnalysisResult);
      systemPrompt = buildPixelPerfectPrompt(
        hasAnalysis,
        quickAnalysisResult
          ? {
              layoutType: quickAnalysisResult.layoutType,
              overallStyle: quickAnalysisResult.overallStyle,
              primaryFont: quickAnalysisResult.primaryFont,
              dominantColors: quickAnalysisResult.dominantColors?.map((c) => c.hex),
            }
          : undefined
      );
    } else {
      // Use standard layout builder prompt
      systemPrompt = buildLayoutBuilderPrompt(
        currentDesign,
        selectedElement || null,
        !!previewScreenshot,
        referenceImages?.length || 0
      );
    }

    // Call Claude API with tools enabled
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages,
      tools: LAYOUT_BUILDER_TOOLS,
    });

    // Process response - may contain tool_use blocks
    let assistantMessage = '';
    const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
    let processedAnimations: DetectedAnimation[] = [];
    let generatedImages: Array<{ url: string; targetElement: string; prompt: string }> = [];
    const toolResults: Array<{ toolName: string; result: ToolResult }> = [];

    // Extract text and tool_use blocks from response
    for (const block of response.content) {
      if (block.type === 'text') {
        assistantMessage += block.text;
      } else if (block.type === 'tool_use') {
        toolUseBlocks.push(block);
      }
    }

    // Process any tool calls
    if (toolUseBlocks.length > 0) {
      const toolProcessingResult = await processToolCalls(toolUseBlocks, currentDesign);
      toolResults.push(...toolProcessingResult.results);
      processedAnimations = toolProcessingResult.animations;
      generatedImages = toolProcessingResult.generatedImages;

      // If tools were called, we might need to continue the conversation
      // to get Claude's final response incorporating tool results
      if (response.stop_reason === 'tool_use') {
        // Build tool results message
        const toolResultsContent: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
          (toolUse, index) => ({
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResults[index]?.result || { error: 'Unknown error' }),
          })
        );

        // Continue conversation with tool results
        const continuationMessages: Anthropic.MessageParam[] = [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResultsContent },
        ];

        const continuationResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2048,
          temperature: 0.7,
          system: systemPrompt,
          messages: continuationMessages,
          tools: LAYOUT_BUILDER_TOOLS,
        });

        // Extract final text response
        const finalTextBlock = continuationResponse.content.find((block) => block.type === 'text');
        if (finalTextBlock && finalTextBlock.type === 'text') {
          assistantMessage = finalTextBlock.text;
        }
      }
    }

    // Extract design updates from the response
    const { updates: extractedUpdates, changes } = await extractDesignUpdates(
      assistantMessage,
      currentDesign
    );

    // Detect and apply design patterns from user message
    const {
      updates: enhancedUpdates,
      detectedPattern,
      patternApplied,
    } = detectAndApplyPattern(message, currentDesign, extractedUpdates);

    // Add pattern detection to changes if a pattern was applied
    const allChanges = [...changes];
    if (patternApplied && detectedPattern) {
      allChanges.unshift({
        property: 'designPattern',
        oldValue: 'none',
        newValue: detectedPattern.id,
        reason: `Applied "${detectedPattern.name}" design pattern: ${detectedPattern.description}`,
      });
    }

    // Merge updates into current design
    const updatedDesign = mergeDesignUpdates(currentDesign, enhancedUpdates);

    // Update conversation context
    const newMessageCount = (currentDesign.conversationContext?.messageCount || 0) + 2;
    updatedDesign.conversationContext = {
      ...currentDesign.conversationContext,
      messageCount: newMessageCount,
      lastUpdated: new Date().toISOString(),
      keyDecisions: [
        ...(currentDesign.conversationContext?.keyDecisions || []),
        ...changes.map((c) => c.reason),
      ].slice(-10), // Keep last 10 decisions
      userPreferences: currentDesign.conversationContext?.userPreferences || [],
    };

    // Generate suggested actions
    const suggestedActions = generateSuggestedActions(
      updatedDesign,
      newMessageCount,
      !!previewScreenshot
    );

    // If we have pixel-perfect analysis, merge it into the design
    if (pixelPerfectAnalysis) {
      const replicator = new DesignReplicator(process.env.ANTHROPIC_API_KEY!);
      const analysisDesign = replicator.analysisToLayoutDesign(pixelPerfectAnalysis);
      Object.assign(updatedDesign, analysisDesign);
    }

    // Extract design context from user message (auto-detection)
    const extractedContext = extractDesignContext(message, currentDesign.designContext);
    if (extractedContext) {
      updatedDesign.designContext = extractedContext;
    }

    // Build extended result with tool outputs
    const result: LayoutChatResponse & {
      animations?: DetectedAnimation[];
      generatedBackgrounds?: Array<{ url: string; targetElement: string; prompt: string }>;
      toolsUsed?: string[];
    } = {
      message: assistantMessage,
      updatedDesign,
      suggestedActions,
      designChanges: allChanges.length > 0 ? allChanges : undefined,
      detectedPattern: detectedPattern
        ? {
            id: detectedPattern.id,
            name: detectedPattern.name,
            description: detectedPattern.description,
          }
        : undefined,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      // Include pixel-perfect analysis results if available
      pixelPerfectAnalysis: pixelPerfectAnalysis || undefined,
      quickAnalysis: quickAnalysisResult || undefined,
      // Include extracted context if detected from user message
      extractedContext: extractedContext || undefined,
      // Include tool outputs: animations and generated backgrounds
      animations: processedAnimations.length > 0 ? processedAnimations : undefined,
      generatedBackgrounds: generatedImages.length > 0 ? generatedImages : undefined,
      toolsUsed: toolResults.length > 0 ? toolResults.map((t) => t.toolName) : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Layout chat error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process layout message',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Return layout builder configuration
// ============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'Layout Builder Chat',
    version: '1.0',
    description: 'AI-powered layout design with vision capabilities',
    features: [
      'Visual analysis via screenshots',
      'Element selection awareness',
      'Reference image comparison',
      'Real-time design updates',
      'Design change tracking',
    ],
    endpoints: {
      chat: 'POST /api/layout/chat',
    },
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxImageSize: '5MB',
  });
}
