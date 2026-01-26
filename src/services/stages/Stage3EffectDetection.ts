/**
 * Stage 3: Effect Detection
 *
 * OPEN-ENDED: Describe visual effects as CSS, not as categories.
 * Don't ask "is this glassmorphism?" - ask "what CSS creates this effect?"
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DetectedEffect {
  elementId: string; // Which element has this effect
  css: string; // The actual CSS needed to recreate it
  description: string; // Human description of what the effect looks like
}

export interface Stage3Output {
  effects: DetectedEffect[];
}

export interface Stage3Input {
  image: string;
}

const STAGE3_PROMPT = `
# VISUAL EFFECT EXTRACTOR

Analyze this UI image and identify any special visual effects that require CSS beyond basic styling.

## WHAT TO LOOK FOR
- Blurred backgrounds (frosted glass effects)
- Gradient backgrounds (linear, radial, or complex multi-color)
- Shadows (standard, colored, layered, inner shadows)
- Transparency and opacity effects
- Blend modes
- Filters (blur, brightness, contrast)
- Animations hints (if elements appear to be in motion)
- Borders with special effects (gradient borders, glowing borders)
- Text effects (gradients, shadows, outlines)
- Any visual effect that isn't just a solid color or simple border

## FOR EACH EFFECT, PROVIDE:
1. elementId: Describe which element has this effect (e.g., "header-background", "hero-section", "card-1")
2. css: The EXACT CSS properties needed to recreate this effect
3. description: What the effect looks like visually

## CSS FORMAT
Write the CSS as you would in a stylesheet - property: value pairs separated by semicolons.

## OUTPUT FORMAT (JSON ONLY)
{
  "effects": [
    {
      "elementId": "header-background",
      "css": "backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.2);",
      "description": "Frosted glass effect - semi-transparent white with blur showing content behind"
    },
    {
      "elementId": "hero-section",
      "css": "background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);",
      "description": "Diagonal gradient from purple-blue to pink"
    },
    {
      "elementId": "cta-button",
      "css": "box-shadow: 0 4px 14px -3px rgba(99, 102, 241, 0.5), 0 2px 4px -1px rgba(99, 102, 241, 0.2);",
      "description": "Colored shadow matching button color, gives floating appearance"
    },
    {
      "elementId": "card-container",
      "css": "background: linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 8px 32px rgba(0,0,0,0.1);",
      "description": "Glass card with gradient transparency and soft shadow"
    }
  ]
}

If no special effects are detected, return:
{
  "effects": []
}

DESCRIBE THE CSS NEEDED, not the category name. "backdrop-filter: blur(12px)" not "glassmorphism".
`;

function cleanJson(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export async function executeStage3(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  input: Stage3Input
): Promise<Stage3Output> {
  console.log('[Stage3] Detecting visual effects...');

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: input.image } },
      { text: STAGE3_PROMPT },
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(cleanJson(responseText)) as Stage3Output;

    if (!parsed.effects || !Array.isArray(parsed.effects)) {
      parsed.effects = [];
    }

    console.log(`[Stage3] Detected ${parsed.effects.length} visual effects`);
    return parsed;
  } catch (error) {
    console.error('[Stage3] Effect detection failed:', error);
    return { effects: [] };
  }
}
