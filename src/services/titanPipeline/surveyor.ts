/**
 * Surveyor Step (Step 0)
 *
 * Visual Reverse Engineering - analyzes images to extract DOM tree structure.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VisualManifest, FileInput } from '@/types/titanPipeline';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getGeminiApiKey, GEMINI_FLASH_MODEL } from './config';
import { uploadFileToGemini } from './helpers';

// ============================================================================
// SURVEYOR PROMPT
// ============================================================================

const SURVEYOR_PROMPT = `### Role
You are the **UI Reverse Engineer**.

### Task
Analyze the image and reconstruct the **exact DOM Component Tree**.
1. **Structure:** Identify Flex Rows vs Columns. Group elements logically (e.g., "Card", "Navbar").
2. **Styles:** Extract hex codes, border-radius, shadows, font-weights, gradients, clip-paths, and all CSS properties.
3. **Content:** You MUST extract the text inside buttons, headings, and paragraphs.
4. **Custom Visuals:** For ANY non-standard visual element (textured buttons, custom icons, logos, artistic gradients, photographic textures), flag it for extraction from the original image.

### Critical Instruction
Do NOT just list bounding boxes. Output a recursive JSON tree.
If an element contains text, use the "text" field.
If an element has a custom icon (not a standard icon library), set "hasCustomVisual": true and provide "extractionBounds".
If an element has a photographic texture or artistic background, set "hasCustomVisual": true and provide "extractionBounds".

### Output Schema (Strict JSON)
{
  "canvas": { "width": number, "height": number, "background": string },
  "dom_tree": {
    "type": "div" | "button" | "p" | "img" | "h1" | "svg" | "section" | "nav" | "span",
    "id": "main_container",
    "styles": {
      "display": "flex",
      "flexDirection": "column",
      "backgroundColor": "#ffffff",
      "borderRadius": "8px",
      "boxShadow": "0 4px 6px rgba(0,0,0,0.1)"
    },
    "text": "Click Me",
    "hasCustomVisual": false,
    "extractionBounds": { "top": 10, "left": 20, "width": 30, "height": 15 },
    "iconSvgPath": "M12 2L2 7l10 5 10-5-10-5z",
    "children": [
      // Recursive nodes...
    ]
  },
  "assets_needed": []
}

### Custom Visual Detection Rules
- "hasCustomVisual": true if the element has a unique texture, hand-drawn icon, logo, artistic gradient, or photographic background
- "extractionBounds": normalized coordinates (0-100 percentage of full image) for cropping this element from the original
- "iconSvgPath": if you can trace the icon shape, provide the SVG path data directly
- Standard UI icons (arrows, chevrons, hamburger menus, close X) do NOT need hasCustomVisual
- Logos, brand icons, illustrations, and custom artwork DO need hasCustomVisual`;

// ============================================================================
// SURVEYOR FUNCTION
// ============================================================================

/**
 * Survey a layout image to extract DOM tree structure
 */
export async function surveyLayout(file: FileInput, fileIndex: number): Promise<VisualManifest> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const fileState = await uploadFileToGemini(apiKey, file);

  const model = genAI.getGenerativeModel({
    model: GEMINI_FLASH_MODEL,
  });

  const result = await withGeminiRetry(() =>
    model.generateContent([
      { fileData: { mimeType: fileState.mimeType, fileUri: fileState.uri } },
      { text: SURVEYOR_PROMPT },
    ])
  );

  try {
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const data = JSON.parse(jsonMatch[0]);

    if (!data.canvas || typeof data.canvas.width !== 'number' || typeof data.canvas.height !== 'number') {
      console.error('[Surveyor] Invalid response structure: missing or malformed canvas', Object.keys(data));
      throw new Error('Surveyor returned invalid structure: missing canvas dimensions');
    }

    if (!data.dom_tree || typeof data.dom_tree !== 'object') {
      console.error('[Surveyor] Invalid response structure: missing dom_tree', Object.keys(data));
      throw new Error('Surveyor returned invalid structure: missing dom_tree');
    }

    return {
      file_index: fileIndex,
      canvas: data.canvas,
      global_theme: { dom_tree: data.dom_tree, assets: data.assets_needed },
      measured_components: [],
    };
  } catch (e) {
    console.error('[Surveyor] Failed:', e);
    try {
      console.error('[Surveyor] Raw response (first 500 chars):', result.response.text().slice(0, 500));
    } catch { /* response may not be available */ }
    return {
      file_index: fileIndex,
      measured_components: [],
      canvas: { width: 1440, height: 900 },
      global_theme: {},
    };
  }
}
