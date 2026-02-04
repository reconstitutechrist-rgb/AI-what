/**
 * Titan Pipeline Service (Full Agentic Stack)
 *
 * Orchestrator for:
 * - Router (Traffic Control)
 * - Surveyor (Vision Analysis via Python)
 * - Architect (Structure via Claude)
 * - Physicist (Animation Math)
 * - Photographer (Asset Generation)
 * - Builder (Code Synthesis)
 * - Live Editor (Refinement)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import Anthropic from '@anthropic-ai/sdk';
import type { AppFile } from '@/types/railway';
import type {
  PipelineInput,
  MergeStrategy,
  VisualManifest,
  ComponentStructure,
  MotionPhysics,
  PipelineResult,
  LiveEditResult,
  FileInput,
} from '@/types/titanPipeline';
import { geminiImageService } from '@/services/GeminiImageService';
import { getAssetExtractionService } from '@/services/AssetExtractionService';
import { getVisionLoopEngine } from '@/services/VisionLoopEngine';
import { domTreeToComponents } from '@/utils/domTreeToComponents';
import { autonomyCore } from '@/agents/AutonomyCore';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { extractCode } from '@/utils/extractCode';

// ============================================================================
// CONFIGURATION (CONFIRMED 2026 SPECS)
// ============================================================================

const GEMINI_FLASH_MODEL = 'gemini-3-flash-preview';
const GEMINI_PRO_MODEL = 'gemini-3-pro-preview';
const GEMINI_DEEP_THINK_MODEL = 'gemini-3-pro-preview';
const CLAUDE_OPUS_MODEL = 'claude-opus-4-5-20251101';

const CODE_ONLY_SYSTEM_INSTRUCTION =
  'You are a code generator. Output ONLY valid TypeScript/React code. ' +
  'Never include explanations, markdown fences (```), or conversational text. ' +
  'Start directly with import statements or code. Any non-code text will break the build.';

function getGeminiApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Anthropic API key missing');
  return key;
}

// ============================================================================
// SHARED HELPER: FILE UPLOAD
// ============================================================================

async function uploadFileToGemini(apiKey: string, file: FileInput) {
  const fileManager = new GoogleAIFileManager(apiKey);
  const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadResult = await fileManager.uploadFile(buffer, {
    mimeType: file.mimeType,
    displayName: file.filename,
  });

  let fileState = uploadResult.file;
  while (fileState.state === 'PROCESSING') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    fileState = await fileManager.getFile(fileState.name);
  }

  if (fileState.state === 'FAILED') throw new Error(`Upload failed: ${file.filename}`);
  return fileState;
}

// ============================================================================
// STEP -1: UNIVERSAL ROUTER
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

export async function routeIntent(input: PipelineInput): Promise<MergeStrategy> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_FLASH_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `${ROUTER_PROMPT}

  User Request: "${input.instructions}"
  Files: ${input.files.length}
  Code Exists: ${!!input.currentCode}
  `;

  const result = await withGeminiRetry(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
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

// ============================================================================
// STEP 0: SURVEYOR (Visual Reverse Engineering)
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

export async function surveyLayout(file: FileInput, fileIndex: number): Promise<VisualManifest> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const fileState = await uploadFileToGemini(apiKey, file);

  const model = genAI.getGenerativeModel({
    model: GEMINI_FLASH_MODEL,
  });

  const result = await withGeminiRetry(() => model.generateContent([
    { fileData: { mimeType: fileState.mimeType, fileUri: fileState.uri } },
    { text: SURVEYOR_PROMPT },
  ]));

  try {
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const data = JSON.parse(jsonMatch[0]);

    return {
      file_index: fileIndex,
      canvas: data.canvas,
      global_theme: { dom_tree: data.dom_tree, assets: data.assets_needed },
      measured_components: [],
    };
  } catch (e) {
    console.error('Surveyor Failed:', e);
    return {
      file_index: fileIndex,
      measured_components: [],
      canvas: { width: 1440, height: 900 },
      global_theme: {},
    };
  }
}

// ============================================================================
// STEP 1: ARCHITECT (Structure)
// ============================================================================

const ARCHITECT_PROMPT = `### Role
You are the **Architect**. Output a clean structure.json (DOM Tree).
If 'dom_tree' is provided in manifests, RESPECT IT.
Use semantic tags. Add data-id to everything. Return JSON.`;

export async function buildStructure(
  manifests: VisualManifest[],
  strategy: MergeStrategy,
  instructions: string
): Promise<ComponentStructure> {
  const apiKey = getAnthropicApiKey();
  const anthropic = new Anthropic({ apiKey });

  const msg = await anthropic.messages.create({
    model: CLAUDE_OPUS_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `${ARCHITECT_PROMPT}\nInstructions: ${instructions}\nManifests: ${JSON.stringify(manifests)}`,
      },
    ],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { tree: [], layout_strategy: 'flex' };
  } catch {
    return { tree: [], layout_strategy: 'flex' };
  }
}

// ============================================================================
// STEP 2: PHYSICIST (Motion)
// ============================================================================

const PHYSICIST_PROMPT = `### Role
You are the **Physicist**. Analyze the video. Extract spring physics, gravity, and timing.
Return JSON: { "component_motions": [] }`;

export async function extractPhysics(
  files: FileInput[],
  _strategy?: MergeStrategy
): Promise<MotionPhysics> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_DEEP_THINK_MODEL });

  const parts: any[] = [{ text: PHYSICIST_PROMPT }];
  for (const f of files) {
    const up = await uploadFileToGemini(apiKey, f);
    parts.push({ fileData: { mimeType: up.mimeType, fileUri: up.uri } });
  }

  if (files.length === 0) return { component_motions: [] };

  const result = await withGeminiRetry(() => model.generateContent(parts));
  try {
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { component_motions: [] };
  } catch {
    return { component_motions: [] };
  }
}

// ============================================================================
// STEP 4: BUILDER (Code Synthesis)
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

// extractCode imported from @/utils/extractCode (shared utility with robust 3-strategy extraction)

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

// ============================================================================
// STEP 5: LIVE EDITOR (RESTORED)
// ============================================================================

const LIVE_EDITOR_PROMPT = `### Role
You are a **Live Code Editor**.

### Input
1. **Current Code:** The full component file.
2. **Selected Element:** The data-id of the element the user selected.
3. **Instruction:** What the user wants to change.

### Task
Return the COMPLETE updated component file with the requested changes applied.
* Preserve all existing logic, event handlers, and imports.
* Only modify the parts related to the user's instruction.
* If the user says "Make this blue", only change the relevant className/style.
* If the user says "Add a button", add it in the appropriate location.
* Keep all data-id attributes intact.

### Output
Return ONLY the updated code. No markdown fences, no explanations.`;

export async function liveEdit(
  currentCode: string,
  selectedDataId: string,
  instruction: string
): Promise<LiveEditResult> {
  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: GEMINI_PRO_MODEL,
      systemInstruction: CODE_ONLY_SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.2, maxOutputTokens: 16384 },
    });

    const prompt = `${LIVE_EDITOR_PROMPT}

### Current Code
\`\`\`tsx
${currentCode}
\`\`\`

### Selected Element
data-id="${selectedDataId}"

### Instruction
"${instruction}"`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    const updatedCode = extractCode(result.response.text());

    return { updatedCode, success: true };
  } catch (error) {
    return {
      updatedCode: currentCode,
      success: false,
      error: error instanceof Error ? error.message : 'Live edit failed',
    };
  }
}

// ============================================================================
// AUTONOMY OUTPUT PARSER
// ============================================================================

/**
 * Parse autonomy output into multiple AppFiles.
 * If the output contains file markers like `// === /src/filename.tsx ===`,
 * split into separate files. Otherwise, treat entire output as App.tsx.
 */
export function parseAutonomyOutput(output: string): AppFile[] {
  const fileMarkerRegex = /\/\/\s*===\s*(\/[^\s]+)\s*===/g;
  const matches = [...output.matchAll(fileMarkerRegex)];

  if (matches.length === 0) {
    // No markers — treat as single App.tsx
    const code = extractCode(output);
    return [{ path: '/src/App.tsx', content: code }];
  }

  // Split output by file markers
  const files: AppFile[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const path = match[1];
    const matchIndex = match.index;
    
    if (matchIndex === undefined) {
      console.warn('[TitanPipeline] Regex match missing index, skipping file');
      continue;
    }
    
    const startIndex = matchIndex + match[0].length;
    const nextMatchIndex = i < matches.length - 1 ? matches[i + 1].index : undefined;
    const endIndex = nextMatchIndex !== undefined ? nextMatchIndex : output.length;
    const content = extractCode(output.slice(startIndex, endIndex));

    if (content.length > 0) {
      files.push({ path, content });
    }
  }

  // Ensure we always have at least an App.tsx
  if (files.length === 0) {
    return [{ path: '/src/App.tsx', content: output.trim() }];
  }

  return files;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const warnings: string[] = [];
  const stepTimings: Record<string, number> = {};

  const routeStart = Date.now();
  const strategy = await routeIntent(input);
  stepTimings.router = Date.now() - routeStart;

  // AUTOPOIETIC/LEARNING PATH
  if (strategy.mode === 'RESEARCH_AND_BUILD') {
     console.log('[TitanPipeline] Triggering Autonomy Core for Unknown Task...');
     const autonomyStart = Date.now();
     const result = await autonomyCore.solveUnknown({
        id: `auto_${Date.now()}`,
        description: input.instructions,
        context: `Files: ${input.files.length}${input.currentCode ? '\nExisting code present.' : ''}`,
        technical_constraints: []
     });
     stepTimings.autonomy = Date.now() - autonomyStart;

     // Parse autonomy output into multiple files if markers are present
     // Agents may output: // === /src/filename.tsx ===\n<code>
     // Agents may output: // === /src/filename.tsx ===\n<code>
     const autonomyFiles = parseAutonomyOutput(result.output);

     return {
        files: autonomyFiles,
        strategy,
        manifests: [],
        physics: null,
        warnings: result.success ? [] : [result.error || 'Autonomy failed'],
        stepTimings,
        command: result.command,
        suspendedState: result.suspendedState
     };
  }

  const manifests: VisualManifest[] = [];
  let physics: MotionPhysics | null = null;
  const generatedAssets: Record<string, string> = {};

  await Promise.all([
    // Surveyor
    (async () => {
      if (strategy.execution_plan.measure_pixels.length && input.files.length > 0) {
        manifests.push(await surveyLayout(input.files[0], 0));
      }
    })(),
    // Physicist
    (async () => {
      if (strategy.execution_plan.extract_physics.length) {
        const videoFiles = input.files.filter((f) => f.mimeType.startsWith('video'));
        physics = await extractPhysics(videoFiles, strategy);
      }
    })(),
    // Photographer
    (async () => {
      if (strategy.execution_plan.generate_assets) {
        for (const asset of strategy.execution_plan.generate_assets) {
          try {
            const result = await geminiImageService.generateBackgroundFromReference({
              vibe: asset.vibe || 'photorealistic',
              vibeKeywords: [asset.description],
              referenceImage: '',
              targetElement: asset.name,
            });
            if (result.imageUrl) generatedAssets[asset.name] = result.imageUrl;
          } catch (e) {
            console.error('Asset generation failed', e);
          }
        }
      }
    })(),
  ]);

  // Asset Extraction: crop custom visuals from original image
  // Extracted assets override generated ones (fidelity > hallucination)
  if (manifests.length > 0 && input.files.length > 0) {
    const extractStart = Date.now();
    try {
      const domTree = manifests[0]?.global_theme?.dom_tree;
      if (domTree) {
        const extractor = getAssetExtractionService();
        const extractedAssets = await extractor.extractFromDomTree(
          domTree,
          input.files[0].base64
        );
        // Extracted assets take priority over generated ones
        Object.assign(generatedAssets, extractedAssets);
        if (Object.keys(extractedAssets).length > 0) {
          warnings.push(
            `Extracted ${Object.keys(extractedAssets).length} custom visuals from reference`
          );
        }
      }
    } catch (e) {
      console.error('[TitanPipeline] Asset extraction failed:', e);
      warnings.push('Asset extraction failed, using generated assets only');
    }
    stepTimings.extraction = Date.now() - extractStart;
  }

  const structStart = Date.now();
  const structure = await buildStructure(manifests, strategy, input.instructions);
  stepTimings.architect = Date.now() - structStart;

  const buildStart = Date.now();
  let files = await assembleCode(
    structure,
    manifests,
    physics,
    strategy,
    input.currentCode,
    input.instructions,
    generatedAssets
  );
  stepTimings.builder = Date.now() - buildStart;

  // Convert dom_tree to DetectedComponentEnhanced[] for component-level healing
  let domTreeComponents: import('@/types/layoutDesign').DetectedComponentEnhanced[] | undefined;
  if (manifests.length > 0 && manifests[0]?.global_theme?.dom_tree) {
    try {
      const conversionResult = domTreeToComponents(
        manifests[0].global_theme.dom_tree,
        manifests[0].canvas
      );
      domTreeComponents = conversionResult.components;
      if (conversionResult.warnings.length > 0) {
        warnings.push(
          ...conversionResult.warnings.map((w) => `[domTreeConversion] ${w}`)
        );
      }
      if (domTreeComponents.length > 0) {
        console.log(`[TitanPipeline] Converted dom_tree to ${domTreeComponents.length} components`);
      }
    } catch (e) {
      console.error('[TitanPipeline] dom_tree conversion failed:', e);
      warnings.push('dom_tree conversion failed, healing loop will use regeneration only');
    }
  }

  // Vision Healing Loop: screenshot → critique → patch/regenerate
  // Only runs when we have a reference image to compare against
  let healingResult: PipelineResult['healingResult'] | undefined;
  if (!input.skipHealing && input.files.length > 0 && manifests.length > 0) {
    const healStart = Date.now();
    try {
      const visionLoop = getVisionLoopEngine();
      const loopResult = await visionLoop.runLoop({
        files,
        originalImageBase64: `data:${input.files[0].mimeType};base64,${input.files[0].base64}`,
        manifests,
        physics,
        strategy,
        currentCode: input.currentCode,
        instructions: input.instructions,
        assets: generatedAssets,
        components: domTreeComponents,
        canvasBackground: manifests[0]?.canvas?.background,
        regenerate: async (critiqueContext: string) => {
          // Regenerate code with critique feedback appended to instructions
          return assembleCode(
            structure,
            manifests,
            physics,
            strategy,
            input.currentCode,
            `${input.instructions}\n\n${critiqueContext}`,
            generatedAssets
          );
        },
      });

      files = loopResult.files;
      healingResult = {
        fidelityScore: loopResult.fidelityScore,
        iterations: loopResult.iterations,
        stopReason: loopResult.stopReason,
        usedPatching: loopResult.usedPatching,
      };
      warnings.push(
        `Healing loop: ${loopResult.stopReason} after ${loopResult.iterations} iteration(s), fidelity=${loopResult.fidelityScore}%${loopResult.usedPatching ? ' (used component patching)' : ''}`
      );
    } catch (e) {
      console.error('[TitanPipeline] Healing loop error:', e);
      warnings.push('Healing loop encountered an error but pipeline continued');
    }
    stepTimings.healing = Date.now() - healStart;
  }

  return { files, strategy, manifests, physics, warnings, stepTimings, healingResult };
}

// ============================================================================
// SINGLETON ACCESSOR (RESTORED)
// ============================================================================

let _instance: TitanPipelineServiceInstance | null = null;

class TitanPipelineServiceInstance {
  async runPipeline(input: PipelineInput): Promise<PipelineResult> {
    return runPipeline(input);
  }

  async liveEdit(
    currentCode: string,
    selectedDataId: string,
    instruction: string
  ): Promise<LiveEditResult> {
    return liveEdit(currentCode, selectedDataId, instruction);
  }
}

export function getTitanPipelineService(): TitanPipelineServiceInstance {
  if (!_instance) {
    _instance = new TitanPipelineServiceInstance();
  }
  return _instance;
}
