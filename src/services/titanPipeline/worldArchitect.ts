/**
 * World Architect Step
 *
 * Converts a natural language prompt into a structured SceneManifest.
 * Uses LLM spatial reasoning to determine object types, positions,
 * materials, lighting, and environment — all as JSON, not code.
 *
 * The Builder then converts this manifest into React Three Fiber code.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SceneManifest } from '@/types/world';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getGeminiApiKey, GEMINI_PRO_MODEL } from './config';

// ============================================================================
// WORLD ARCHITECT PROMPT
// ============================================================================

const WORLD_ARCHITECT_PROMPT = `### Role
You are a **3D Spatial Architect**. Convert a natural language description into a structured 3D Scene Manifest (JSON).

### Coordinate System
- **Y is UP** (standard Three.js convention)
- Ground plane is at y=0
- 1 unit ≈ 1 meter

### Spatial Reasoning Rules
1. Objects MUST sit ON the ground — their y position should be half their height
   Example: A box of height 2 should have position y=1
2. Objects MUST NOT overlap — leave realistic spacing
3. Use composite entities for complex objects:
   - Tree = Cylinder trunk (brown) + Cone/Sphere canopy (green)
   - House = Box body (wall color) + smaller Box roof (darker) rotated 45°
   - Car = Box body + 4 Cylinder wheels as children
4. Scale appropriately — a person is ~1.8m tall, a house is ~5-8m, a tree 4-10m
5. Spread objects across the ground plane realistically

### Material Rules
1. Use hex color codes (e.g. "#8B4513" for brown, "#228B22" for forest green)
2. Set metalness=0 for organic materials (wood, grass, stone)
3. Set metalness>0.5 for metals (car body, railing, lamp post)
4. Use roughness=0.7-0.9 for natural materials, 0.1-0.3 for polished surfaces
5. Use emissive for glowing objects (lamps, neon signs, lava)

### Lighting Rules
1. ALWAYS include at least 3 lights:
   - 1 ambient light (intensity 0.3-0.4)
   - 1 directional key light (intensity 0.8-1.2, castShadow=true)
   - 1 directional fill light (intensity 0.2-0.4)
2. Match lighting to mood: warm sunset, cool night, neutral day

### Scene Scale Guidelines
- "Small" scene: 5-15 entities, 20x20 ground
- "Medium" scene: 15-40 entities, 50x50 ground
- "Large" scene: 40-80 entities, 100x100 ground
- Keep total entity count under 100 for performance

### Output Schema
Return ONLY valid JSON matching this exact structure:
\`\`\`json
{
  "name": "string",
  "description": "string",
  "entities": [
    {
      "id": "string",
      "name": "string",
      "shape": "box" | "sphere" | "cylinder" | "cone" | "torus" | "plane",
      "dimensions": [number, number, number],
      "position": [x, y, z],
      "rotation": [x, y, z],
      "scale": [x, y, z],
      "material": {
        "color": "#hex",
        "metalness": 0-1,
        "roughness": 0-1,
        "emissive": "#hex",
        "emissiveIntensity": 0-2,
        "opacity": 0-1
      },
      "physics": { "type": "fixed" | "dynamic", "mass": number, "restitution": 0-1, "friction": 0-1 },
      "animation": { "type": "rotate" | "float" | "sway" | "pulse", "speed": number, "axis": "x" | "y" | "z" },
      "castShadow": boolean,
      "receiveShadow": boolean,
      "children": [ ...same entity structure... ],
      "label": "semantic_label"
    }
  ],
  "environment": {
    "skyPreset": "sunset" | "dawn" | "night" | "studio" | "city" | "forest" | "park" | "warehouse" | "apartment" | "lobby",
    "skyBackground": true,
    "fog": { "color": "#hex", "near": number, "far": number },
    "lights": [
      { "type": "ambient" | "directional" | "point" | "spot", "color": "#hex", "intensity": number, "position": [x, y, z], "castShadow": boolean }
    ],
    "particles": [
      { "type": "rain" | "snow" | "dust" | "fireflies" | "sparks" | "leaves", "density": 1-100, "area": [x, y, z] }
    ]
  },
  "ground": {
    "type": "flat" | "terrain",
    "size": [width, depth],
    "material": { "color": "#hex", "roughness": number },
    "heightScale": number,
    "segments": number
  },
  "camera": {
    "position": [x, y, z],
    "target": [x, y, z],
    "fov": number,
    "controls": "orbit" | "first_person" | "fly"
  },
  "physics": {
    "enabled": boolean,
    "gravity": [0, -9.81, 0]
  }
}
\`\`\`

### CRITICAL
- Return ONLY valid JSON. No markdown fences, no explanations, no comments.
- Every entity MUST have an id, name, shape, position, and material.
- Use composite children for complex objects (trees, buildings, vehicles).
- Ground plane is SEPARATE from entities — do not add a ground plane entity.`;

// ============================================================================
// WORLD ARCHITECT FUNCTION
// ============================================================================

/**
 * Build a SceneManifest from a natural language prompt.
 *
 * @param instructions - Natural language description of the desired 3D world
 * @returns Structured SceneManifest for the Builder to render
 */
export async function buildWorldManifest(
  instructions: string
): Promise<SceneManifest> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_PRO_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `${WORLD_ARCHITECT_PROMPT}

### USER REQUEST
${instructions}

Generate a SceneManifest for this world. Use composite primitives to approximate real objects.`;

  const result = await withGeminiRetry(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    const manifest: SceneManifest = JSON.parse(text);

    // Validate required fields
    if (!manifest.entities || !Array.isArray(manifest.entities)) {
      console.error('[WorldArchitect] Invalid manifest: missing entities array');
      return createFallbackManifest(instructions);
    }

    if (!manifest.environment || !manifest.camera) {
      console.error('[WorldArchitect] Invalid manifest: missing environment or camera');
      return createFallbackManifest(instructions);
    }

    console.log(
      `[WorldArchitect] Generated manifest: "${manifest.name}" with ${manifest.entities.length} entities`
    );

    return manifest;
  } catch (e) {
    console.error('[WorldArchitect] JSON parse failed:', e);
    console.error('[WorldArchitect] Raw response (first 500 chars):', text.slice(0, 500));
    return createFallbackManifest(instructions);
  }
}

// ============================================================================
// FALLBACK
// ============================================================================

/**
 * Create a minimal valid SceneManifest as fallback when generation fails.
 * Shows a simple ground plane so the user sees something instead of an error.
 */
function createFallbackManifest(description: string): SceneManifest {
  return {
    name: 'Fallback Scene',
    description: `Fallback for: ${description}`,
    entities: [
      {
        id: 'fallback_cube',
        name: 'placeholder',
        shape: 'box',
        dimensions: [1, 1, 1],
        position: [0, 0.5, 0],
        material: { color: '#6366f1', metalness: 0.3, roughness: 0.5 },
        castShadow: true,
        animation: { type: 'rotate', speed: 0.5, axis: 'y' },
      },
    ],
    environment: {
      skyPreset: 'park',
      skyBackground: true,
      lights: [
        { type: 'ambient', intensity: 0.4 },
        { type: 'directional', intensity: 1, position: [10, 10, 5], castShadow: true },
        { type: 'directional', intensity: 0.3, position: [-5, -5, -3] },
      ],
    },
    ground: {
      type: 'flat',
      size: [20, 20],
      material: { color: '#4ade80', roughness: 0.8 },
    },
    camera: {
      position: [5, 5, 5],
      target: [0, 0, 0],
      fov: 50,
      controls: 'orbit',
    },
    physics: {
      enabled: true,
      gravity: [0, -9.81, 0],
    },
  };
}
