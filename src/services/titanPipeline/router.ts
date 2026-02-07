/**
 * Router Step (Step -1)
 *
 * Universal traffic controller that determines pipeline mode and execution plan.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PipelineInput, MergeStrategy } from '@/types/titanPipeline';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getGeminiApiKey, GEMINI_FLASH_MODEL } from './config';

// ============================================================================
// ROUTER PROMPT
// ============================================================================

const ROUTER_PROMPT = `### Role
You are the **Pipeline Traffic Controller**.

### Rules
- If current_code exists and no new files -> mode: "EDIT"
- If new files uploaded -> mode: "CREATE" or "MERGE"
- **PHOTOREALISM TRIGGER:** If user mentions ANY specific material, texture, photographic element, or realistic visual effect (e.g., "photorealistic", "texture", "realistic", "wood", "glass", "cloud", "grain", "marble", "metal", "fabric", "leather", "stone", "water", "iridescent", "holographic", "crystalline", or any other material/texture/visual reference), you MUST add a "generate_assets" task.
- Images -> measure_pixels. Videos -> extract_physics.
- **UNKNOWN/COMPLEX:** If the request involves concepts, libraries, or capabilities you don't know (e.g., "WebGPU", "Quantum", "L-System", "3D Metaverse"), mode: "RESEARCH_AND_BUILD".

### Output Schema (JSON)
{
  "mode": "CREATE" | "MERGE" | "EDIT" | "RESEARCH_AND_BUILD",
  "base_source": "codebase" | "file_0" | null,
  "file_roles": [],
  "execution_plan": {
    "measure_pixels": [0],
    "extract_physics": [],
    "preserve_existing_code": false,
    "generate_assets": [
      { "name": "cloud_texture", "description": "fluffy white realistic cloud texture", "vibe": "photorealistic" }
    ]
  }
}`;

// ============================================================================
// ROUTER FUNCTION
// ============================================================================

/**
 * Route intent to determine pipeline mode and execution plan
 */
export async function routeIntent(input: PipelineInput): Promise<MergeStrategy> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_FLASH_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `${ROUTER_PROMPT}

  User Request:
\`\`\`
${input.instructions}
\`\`\`
  Files: ${input.files.length}
  Code Exists: ${!!input.currentCode}
  `;

  const result = await withGeminiRetry(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('[Router] JSON parse failed, using fallback strategy:', e);
    console.warn('[Router] Raw response (first 500 chars):', text.slice(0, 500));
    return {
      mode: input.currentCode ? 'EDIT' : 'CREATE',
      base_source: input.currentCode ? 'codebase' : null,
      file_roles: [],
      execution_plan: {
        measure_pixels: [],
        extract_physics: [],
        preserve_existing_code: false,
      },
    };
  }
}
