/**
 * Builder Step (Step 4)
 *
 * Code synthesis - generates final React code from manifests, physics, and assets.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AppFile } from '@/types/railway';
import type {
  VisualManifest,
  ComponentStructure,
  MotionPhysics,
  MergeStrategy,
} from '@/types/titanPipeline';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { extractCode } from '@/utils/extractCode';
import { getGeminiApiKey, GEMINI_PRO_MODEL, CODE_ONLY_SYSTEM_INSTRUCTION } from './config';

// ============================================================================
// BUILDER PROMPT
// ============================================================================

const BUILDER_PROMPT = `### Role
You are the **Universal Builder**. Write the final React code.

### Instructions
1. **Use the Assets (Priority #1):** - If an asset URL is provided, apply it via CSS \`backgroundImage\` or \`img\` tags.
   - Do NOT set a \`backgroundColor\` property if a background image is active (it creates fog).
   - Do NOT use CSS gradients if an image asset is available.

2. **REPLICATION MODE (CRITICAL):**
   - If the Manifests contain a 'dom_tree', you MUST recursively build that exact structure.
   - Map 'type' to HTML tags. Map 'styles' to Tailwind classes.
   - Do NOT simplify the structure. Pixel-perfect accuracy is key.

3. **Physics:** Implement the physics using Framer Motion.
4. **Data-IDs:** Preserve all data-id attributes for the inspector.

5. **Icons (Rendering):**
   - **Priority 1:** If \`iconSvgPath\` exists -> render inline \`<svg>\` with the path data.
   - **Priority 2:** If only \`iconName\` exists -> import from \`lucide-react\`.

6. **Shaped & Textured Elements (CRITICAL for photorealism):**
   - When the user asks for an element that "looks like" a real object (cloud, stone, wood, etc.),
     create BOTH the shape AND the texture:
     a) **Shape:** Use CSS clip-path, SVG clipPath, or creative border-radius to form the silhouette.
        Examples: cloud -> clip-path with rounded bumps, leaf -> custom polygon, stone -> irregular rounded.
     b) **Texture:** If an asset URL exists, apply it as backgroundImage with backgroundSize: cover.
        If no asset, use CSS gradients, box-shadows, and filters to approximate the material.
     c) **Depth:** Add box-shadow, inner highlights, and subtle gradients for 3D realism.
     d) **Interactivity:** The element must still function (clickable, hover states).
   - Example: "photorealistic cloud button" ->
     clip-path: path('M25,60 a20,20 0,0,1 0,-40 a20,20 0,0,1 35,0 a20,20 0,0,1 0,40 z');
     backgroundImage: url(cloud_texture.png); backgroundSize: cover;
     box-shadow for depth; filter: drop-shadow for floating effect.
   - Do NOT just set a backgroundColor. Use real CSS shape techniques.

### Output
Return ONLY the full App.tsx code. No markdown.`;

// ============================================================================
// BUILDER FUNCTION
// ============================================================================

/**
 * Assemble final React code from manifests, physics, and assets
 */
export async function assembleCode(
  _structure: ComponentStructure | null,
  manifests: VisualManifest[],
  physics: MotionPhysics | null,
  _strategy: MergeStrategy,
  _currentCode: string | null,
  instructions: string,
  assets: Record<string, string>
): Promise<AppFile[]> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_PRO_MODEL,
    systemInstruction: CODE_ONLY_SYSTEM_INSTRUCTION,
  });

  const hasAssets = Object.keys(assets).length > 0;
  const assetContext = hasAssets
    ? `\n\n  ### ASSET CONTEXT
These texture/material images were generated for the user's request:
${Object.entries(assets).map(([name, url]) => `  - "${name}" -> ${url}`).join('\n')}
Apply them via backgroundImage on the matching elements. Combine with clip-path for shaped elements.`
    : '';

  const prompt = `${BUILDER_PROMPT}

  ### ASSETS (Use these URLs!)
  ${JSON.stringify(assets, null, 2)}
  ${assetContext}

  ### INSTRUCTIONS
  ${instructions}

  ### MANIFESTS (Look for dom_tree)
  ${JSON.stringify(manifests, null, 2)}

  ### PHYSICS
  ${JSON.stringify(physics)}
  `;

  const result = await withGeminiRetry(() => model.generateContent(prompt));
  const code = extractCode(result.response.text());

  return [
    { path: '/src/App.tsx', content: code },
    {
      path: '/src/index.tsx',
      content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './inspector';\n\nconst root = createRoot(document.getElementById('root')!);\nroot.render(<React.StrictMode><App /></React.StrictMode>);`,
    },
  ];
}
