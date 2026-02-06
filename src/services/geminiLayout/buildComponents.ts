/**
 * Stage 2: The Engineer
 *
 * Build specific component list from design images using the DesignSpec from Stage 1.
 * Creates a hierarchical JSON Scene Graph with pixel-perfect layout specifications.
 */

import type { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import type { DesignSpec } from '@/types/designSpec';
import {
  sanitizeComponents,
  inferContainerLayouts,
  resolveRootOverlaps,
} from '@/utils/layoutValidation';
import { MODEL_FLASH } from './config';
import { fileToPart, normalizeCoordinates, validateTypographyScaling } from './helpers';

/**
 * STAGE 2: The Engineer
 * Build specific component list using the DesignSpec from Stage 1
 * Colors are provided, so no guessing needed
 */
export async function buildComponentsFromSpec(
  client: GoogleGenerativeAI,
  imageBase64: string,
  designSpec: DesignSpec,
  instructions?: string
): Promise<DetectedComponentEnhanced[]> {
  const model = client.getGenerativeModel({
    model: MODEL_FLASH,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
    You are "The Engineer" - a pixel-perfect layout reconstruction specialist.

    USER INSTRUCTIONS: ${instructions || 'Build component list.'}

    DESIGN SPEC (from Stage 1 - The Architect):
    ${JSON.stringify(designSpec, null, 2)}

    YOUR TASK: Create a HIERARCHICAL JSON Scene Graph of every visible UI element.

    COORDINATE SYSTEM: Use normalized 0-1000 scale where:
    - 0 = left/top edge of the image/parent
    - 1000 = right/bottom edge of the image/parent
    - 500 = center

    COMPONENT ROLES:
    1. "container" - Has children, uses flex/grid layout to arrange them
    2. "leaf" - No children, renders actual content (text, image, button, icon)
    3. "overlay" - Positioned absolutely over other content (modals, tooltips, dropdowns)

    For EACH element, return:
    {
      "id": "descriptive-unique-id",
      "type": "header|sidebar|hero|section|container|cards|navigation|footer|form|logo|button|text|image|input|link|icon|badge|avatar|divider|list|menu|card|unknown",
      "role": "container|leaf|overlay",
      "parentId": "<parent-id or null for root sections>",
      "children": ["child-id-1", "child-id-2"],
      "bounds": {
        "top": <0-1000>,
        "left": <0-1000>,
        "width": <0-1000>,
        "height": <0-1000>
      },
      "layout": {
        // MANDATORY for containers - DO NOT OMIT
        "type": "flex|grid",
        "direction": "row|column",
        "gap": "24px",
        "justify": "start|center|end|between|evenly",
        "align": "start|center|end|stretch"
      },
      "style": {
        "backgroundColor": "<hex or linear-gradient(...)>",
        "textColor": "<hex>",
        "fontFamily": "<font name>",
        "fontSize": "<px value>",
        "fontWeight": "<weight>",
        "fontStyle": "normal|italic",
        "textAlign": "left|center|right|justify",
        "textTransform": "uppercase|lowercase|capitalize|none",
        "textDecoration": "none|underline|line-through",
        "textShadow": "<shadow value>",
        "letterSpacing": "<px or em>",
        "lineHeight": "<number or px>",
        "whiteSpace": "normal|nowrap|pre-wrap",
        "textOverflow": "clip|ellipsis",
        "wordBreak": "normal|break-all|keep-all|break-word",
        "backgroundImage": "<url(...) or linear-gradient(...)>",
        "backgroundSize": "cover|contain|<px>",
        "backgroundPosition": "center|top left|<px px>",
        "backgroundRepeat": "no-repeat|repeat|repeat-x|repeat-y",
        "padding": "<px value>",
        "margin": "<px value>",
        "gap": "<px value>",
        "maxWidth": "<px or %>",
        "maxHeight": "<px or %>",
        "minHeight": "<px>",
        "aspectRatio": "16/9 or 1/1 or auto",
        "borderRadius": "<px value>",
        "borderWidth": "<px value>",
        "borderColor": "<hex>",
        "borderStyle": "solid|dashed|dotted|none",
        "shadow": "<box-shadow value>",
        "opacity": "<0-1>",
        "backdropFilter": "blur(10px)",
        "filter": "blur(5px) or grayscale(100%)",
        "mixBlendMode": "normal|multiply|screen|overlay",
        "transform": "<rotate(5deg) scale(1.1)>",
        "overflow": "hidden|visible|scroll|auto",
        "objectFit": "cover|contain",
        "objectPosition": "center|top",
        "position": "static|relative|absolute|fixed|sticky",
        "top": "<px or %>",
        "left": "<px or %>",
        "cursor": "pointer|text|default|grab",
        "animation": "<CSS animation shorthand>",
        "animationKeyframes": {
          "0%": { "backgroundPosition": "0% 50%" },
          "50%": { "backgroundPosition": "100% 50%" },
          "100%": { "backgroundPosition": "0% 50%" }
        },
        "transition": "<CSS transition shorthand>",
        "flexGrow": "<number>",
        "flexShrink": "<number>",
        "order": "<number>",
        "customCSS": {
          "<any-css-property>": "<value>"
        }
      },
      "content": {
        "text": "<EXACT visible text>",
        "hasImage": true/false,
        "imageDescription": "<detailed description>",
        "imageAlt": "<alt text>",
        "hasIcon": true/false,
        "iconSvgPath": "<SVG path d attribute>",
        "iconViewBox": "0 0 24 24",
        "iconName": "<Lucide icon name as FALLBACK>",
        "iconColor": "<hex>",
        "iconPosition": "left|right|center|top|bottom",
        "iconSize": "sm|md|lg",
        "iconContainerStyle": {
          "shape": "circle|square|rounded",
          "backgroundColor": "<hex>",
          "borderColor": "<hex>",
          "borderWidth": "<px>",
          "size": "sm|md|lg"
        }
      },
      "zIndex": <number>,
      "interactions": {
        "hover": {
          "backgroundColor": "<hex>",
          "textColor": "<hex>",
          "transform": "scale(1.05)",
          "boxShadow": "<shadow>",
          "opacity": "<0-1>",
          "borderColor": "<hex>"
        },
        "active": {
          "backgroundColor": "<hex>",
          "textColor": "<hex>",
          "transform": "scale(0.95)",
          "scale": "<number>"
        },
        "focus": {
          "outline": "<CSS outline>",
          "boxShadow": "<focus ring shadow>",
          "borderColor": "<hex>"
        }
      },
      "visualEffects": [
        {
          "description": "<what the effect looks like>",
          "type": "css-animation|particle-system",
          "trigger": "always|hover|click|scroll",
          "cssKeyframes": {
            "0%": { "<property>": "<value>" },
            "100%": { "<property>": "<value>" }
          },
          "particleConfig": {
            "count": 20,
            "shape": "circle|square|star",
            "colors": ["#hex1", "#hex2"],
            "direction": "up|down|left|right|radial|random",
            "speed": "slow|medium|fast",
            "size": { "min": 2, "max": 8 },
            "opacity": { "start": 1, "end": 0 },
            "lifetime": "1s|2s|3s"
          }
        }
      ],
      "confidence": 0.9
    }

    HIERARCHY RULES:

    1. **DETECT VISUAL CONTAINERS**: Headers, hero sections, card groups, footers are containers.
    2. **ASSIGN PARENT-CHILD RELATIONSHIPS**: Every non-root component MUST have a parentId.
    3. **SPECIFY CONTAINER LAYOUTS**: Every container MUST include layout.type, layout.direction, layout.gap, layout.justify, layout.align.
    4. **ROOT COMPONENTS** (parentId: null): Major page sections - header, hero, content, footer. MUST NOT OVERLAP.
    5. **CHILD BOUNDS ARE RELATIVE**: Children use 0-1000 scale within their parent.
    6. **LEAF COMPONENTS**: Have role: "leaf", no children, render actual content.
    7. **COLOR HANDLING**: MEASURE actual hex from image. Use designSpec colors when they match.
    8. **ICON DETECTION**: Set hasIcon, provide iconSvgPath if possible, else iconName.
    9. **FOOTER HIERARCHY**: Preserve multi-column structure.
    10. **CUSTOM CSS**: Put any unlisted CSS properties in customCSS.
    11. **ANIMATION DETECTION**: Set style.animation and animationKeyframes for animated elements.
    12. **VISUAL EFFECTS**: Create visualEffects entries for particles, animations, etc.
    13. **IMAGE DETECTION**: Set hasImage=true with detailed imageDescription.

    Return ONLY a JSON array of components. No markdown, no explanation, no wrapping object.
  `;

  const imagePart = fileToPart(imageBase64);
  const result = await withGeminiRetry(() => model.generateContent([prompt, imagePart]));
  const response = result.response;

  try {
    const rawData = JSON.parse(response.text());

    // CRITICAL FIX: Normalize 0-1000 scale to 0-100 scale
    const normalizedData = normalizeCoordinates(rawData);

    const { components: sanitizedComponents, errors } = sanitizeComponents(
      normalizedData as unknown[]
    );
    if (errors.length > 0) {
      console.warn('[buildComponentsFromSpec] Validation issues:', errors);
    }

    // CRITICAL: Infer layout for containers missing layout data
    const withInferredLayouts = inferContainerLayouts(sanitizedComponents);

    // Post-process: Validate typography scaling
    const withValidatedTypography = validateTypographyScaling(withInferredLayouts);

    // CRITICAL FIX: Resolve root overlaps
    const components = resolveRootOverlaps(withValidatedTypography);

    console.log('[buildComponentsFromSpec] After processing:', {
      before: sanitizedComponents.filter((c) => c.role === 'container' && !c.layout?.type).length,
      after: components.filter((c) => c.role === 'container' && !c.layout?.type).length,
      overlapsResolved: components.length > 0,
    });

    // Debug log
    const containersWithLayout = components.filter((c) => c.role === 'container' && c.layout?.type);
    const containersWithoutLayout = components.filter(
      (c) => c.role === 'container' && !c.layout?.type
    );

    console.log('[buildComponentsFromSpec] Stage 2 result:', {
      count: components.length,
      hasHierarchy: components.some((c) => c.parentId || (c.children && c.children.length > 0)),
      layoutStats: {
        containersWithLayout: containersWithLayout.length,
        containersWithoutLayout: containersWithoutLayout.length,
        missingLayoutIds: containersWithoutLayout.map((c) => c.id),
      },
      layoutSample: containersWithLayout.slice(0, 3).map((c) => ({
        id: c.id,
        layout: c.layout,
      })),
      colorsSample: components.slice(0, 5).map((c) => ({
        id: c.id,
        bg: c.style?.backgroundColor,
        text: c.style?.textColor,
        role: c.role,
        parentId: c.parentId,
      })),
    });

    return components;
  } catch (e) {
    console.error('[buildComponentsFromSpec] Failed to parse components', e);
    return [];
  }
}
