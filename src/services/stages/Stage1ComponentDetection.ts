/**
 * Stage 1: Component Detection
 *
 * OPEN-ENDED: Detect everything visible, don't force into categories.
 * Let Gemini describe what it sees, not what we expect.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DetectedComponent {
  id: string;
  type: string; // Open-ended - whatever Gemini thinks it is
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  parentId: string | null;
  children: string[];
  isInteractive: boolean;
  visualDescription: string; // What it looks like, not what category it fits
}

export interface Stage1Output {
  componentCount: number;
  components: DetectedComponent[];
}

export interface Stage1Input {
  image: string;
}

const STAGE1_PROMPT = `
# VISUAL ELEMENT DETECTOR

Analyze this UI image and identify EVERY distinct visual element.

## YOUR MISSION
- Find EVERY element: buttons, text, images, icons, containers, shapes, decorations
- Return PRECISE bounding boxes as percentages (0-100)
- Describe what each element LOOKS LIKE, not what category you think it fits

## BOUNDING BOX FORMAT
- x: Left edge percentage (0 = left, 100 = right)
- y: Top edge percentage (0 = top, 100 = bottom)
- width: Width as percentage of image
- height: Height as percentage of image

## FOR EACH ELEMENT, PROVIDE:
1. id: Unique identifier (e.g., "element-1", "top-left-text", "main-button")
2. type: Your best guess at what it is (be specific: "pill-shaped-button", "gradient-card", "icon-circle")
3. bounds: { x, y, width, height } as percentages
4. description: Brief functional description
5. parentId: ID of containing element, or null if top-level
6. children: Array of child element IDs
7. isInteractive: true if clickable/interactive
8. visualDescription: Describe the APPEARANCE - colors, shapes, effects you observe

## DETECTION RULES
- Detect EVERYTHING visible - every piece of text, every icon, every shape
- If you see a button, describe its shape: "rounded rectangle", "pill", "circle"
- If you see text, note its apparent size: "large heading", "small caption"
- If you see an effect, describe it: "has shadow", "appears blurred", "has gradient"
- Don't skip decorative elements - they matter for visual fidelity
- Target: 20-50+ elements for a typical UI screen

## OUTPUT FORMAT (JSON ONLY)
{
  "componentCount": 30,
  "components": [
    {
      "id": "header-container",
      "type": "horizontal-container",
      "bounds": { "x": 0, "y": 0, "width": 100, "height": 8 },
      "description": "Top navigation bar",
      "parentId": null,
      "children": ["logo-1", "nav-links", "cta-button"],
      "isInteractive": false,
      "visualDescription": "White background with subtle bottom shadow, contains logo on left and navigation on right"
    },
    {
      "id": "cta-button",
      "type": "pill-button",
      "bounds": { "x": 85, "y": 2, "width": 12, "height": 4 },
      "description": "Call to action button",
      "parentId": "header-container",
      "children": [],
      "isInteractive": true,
      "visualDescription": "Blue pill-shaped button with white text, slight shadow, appears to be primary action"
    }
  ]
}

Describe what you SEE, not what you assume. Be exhaustive.
`;

function cleanJson(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export async function executeStage1(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  input: Stage1Input
): Promise<Stage1Output> {
  console.log('[Stage1] Starting open-ended component detection...');

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: input.image } },
      { text: STAGE1_PROMPT },
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(cleanJson(responseText)) as Stage1Output;

    // Validate and clamp bounds
    if (parsed.components) {
      for (const comp of parsed.components) {
        if (comp.bounds) {
          comp.bounds.x = Math.max(0, Math.min(100, comp.bounds.x || 0));
          comp.bounds.y = Math.max(0, Math.min(100, comp.bounds.y || 0));
          comp.bounds.width = Math.max(0, Math.min(100, comp.bounds.width || 10));
          comp.bounds.height = Math.max(0, Math.min(100, comp.bounds.height || 10));
        }
        // Ensure visualDescription exists
        if (!comp.visualDescription) {
          comp.visualDescription = comp.description || '';
        }
      }
    }

    console.log(`[Stage1] Detected ${parsed.componentCount} elements`);
    return parsed;
  } catch (error) {
    console.error('[Stage1] Detection failed:', error);
    // Minimal fallback - just a root container
    return {
      componentCount: 1,
      components: [
        {
          id: 'root-fallback',
          type: 'container',
          bounds: { x: 0, y: 0, width: 100, height: 100 },
          description: 'Root container (detection failed)',
          parentId: null,
          children: [],
          isInteractive: false,
          visualDescription: 'Full-screen container',
        },
      ],
    };
  }
}
