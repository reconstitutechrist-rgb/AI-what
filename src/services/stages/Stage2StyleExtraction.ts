/**
 * Stage 2: Style Extraction
 *
 * OPEN-ENDED: Extract exact CSS values as observed, not categorized.
 * No defaults, no assumptions - just measure what's visible.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DetectedComponent } from './Stage1ComponentDetection';

// Open-ended style object - any CSS property Gemini observes
export interface ComponentStyle {
  [key: string]: string | number | undefined;
}

export interface Stage2Output {
  styles: Record<string, ComponentStyle>;
}

export interface Stage2Input {
  image: string;
  components: DetectedComponent[];
}

function buildStage2Prompt(components: DetectedComponent[]): string {
  const componentList = components
    .map(
      (c) =>
        `- ${c.id}: "${c.visualDescription}" at [${Math.round(c.bounds.x)}%, ${Math.round(c.bounds.y)}%]`
    )
    .join('\n');

  return `
# CSS VALUE EXTRACTOR

For each element listed below, extract the EXACT CSS values you observe in the image.

## ELEMENTS TO ANALYZE
${componentList}

## YOUR MISSION
- Measure and estimate EXACT values - pixels, colors, percentages
- DO NOT use vague terms like "large", "small", "rounded"
- DO NOT apply defaults or assumptions
- If you can't determine a value, omit it (don't guess)

## EXTRACTION GUIDE

### Typography (measure in pixels)
- fontSize: "48px", "16px", "14px" (estimate from visual size)
- fontWeight: 400, 500, 600, 700, 800, 900
- lineHeight: "1.2" or "56px"
- letterSpacing: "-0.02em" or "0.5px"
- textAlign: "left", "center", "right"
- color: "#hex" (the text color you see)

### Backgrounds
- backgroundColor: "#hex" or "transparent"
- backgroundImage: "linear-gradient(...)" or "radial-gradient(...)"
- backgroundSize: "cover", "contain", "100% 100%"

### Spacing (measure in pixels)
- padding: "24px" or "16px 24px" or "8px 16px 8px 16px"
- margin: same format
- gap: "16px" (space between children)

### Borders
- borderWidth: "1px", "2px"
- borderColor: "#hex"
- borderRadius: "8px", "16px", "50%" (for circles), "9999px" (for pills)
- borderStyle: "solid", "dashed", "none"

### Effects
- boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" (full CSS value)
- opacity: 0.8
- backdropFilter: "blur(12px)"
- filter: "drop-shadow(...)" or "blur(...)"

### Layout
- display: "flex", "grid", "block", "inline-flex"
- flexDirection: "row", "column"
- alignItems: "flex-start", "center", "flex-end", "stretch"
- justifyContent: "flex-start", "center", "flex-end", "space-between"
- position: "relative", "absolute"

### Dimensions (if apparent)
- width: "200px" or "100%"
- height: "48px" or "auto"
- minHeight: "100vh"

## OUTPUT FORMAT (JSON ONLY)
{
  "styles": {
    "element-id-1": {
      "backgroundColor": "#1e40af",
      "color": "#ffffff",
      "fontSize": "16px",
      "fontWeight": 600,
      "padding": "12px 24px",
      "borderRadius": "9999px",
      "boxShadow": "0 4px 14px -3px rgba(30, 64, 175, 0.4)"
    },
    "element-id-2": {
      "fontSize": "64px",
      "fontWeight": 700,
      "lineHeight": "1.1",
      "letterSpacing": "-0.02em",
      "color": "#0f172a"
    }
  }
}

MEASURE WHAT YOU SEE. Every value should be your best estimate of the actual CSS.
`;
}

function cleanJson(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export async function executeStage2(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  input: Stage2Input
): Promise<Stage2Output> {
  console.log(`[Stage2] Extracting styles for ${input.components.length} elements...`);

  try {
    const prompt = buildStage2Prompt(input.components);

    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: input.image } },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(cleanJson(responseText)) as Stage2Output;

    // Don't add defaults - if Gemini didn't return styles, leave empty
    if (!parsed.styles) {
      parsed.styles = {};
    }

    const styleCount = Object.keys(parsed.styles).length;
    console.log(`[Stage2] Extracted styles for ${styleCount} elements`);

    return parsed;
  } catch (error) {
    console.error('[Stage2] Style extraction failed:', error);
    // Return empty - no assumptions
    return { styles: {} };
  }
}
