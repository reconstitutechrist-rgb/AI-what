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
  RepoContext,
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
// 3D BUILDER SUPPLEMENT (React Three Fiber)
// ============================================================================

const BUILDER_3D_SUPPLEMENT = `

## 3D MODE INSTRUCTIONS (React Three Fiber)

**IMPORTANT: When building a 3D scene, IGNORE the 2D instructions above and follow these instead.**

### Required Imports
\`\`\`tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, useGLTF, Sky, KeyboardControls, PointerLockControls, useKeyboardControls } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, BallCollider, CapsuleCollider, CylinderCollider } from '@react-three/rapier';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
\`\`\`
Only import what you use. The above shows the full set of available imports.

### Mandatory Scene Structure
Every 3D scene MUST have this structure:
\`\`\`tsx
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }} gl={{ antialias: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}

function Scene() {
  return (
    <>
      {/* THREE-POINT LIGHTING — REQUIRED */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-5, -5, -3]} intensity={0.3} />

      {/* ENVIRONMENT — use HDRI preset for realistic reflections */}
      <Environment preset="studio" />

      {/* SCENE CONTENT */}
      <YourObjects />

      {/* GROUND SHADOWS */}
      <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} far={4} />

      {/* ORBIT CONTROLS — always include for interactivity */}
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={20} />
    </>
  );
}
\`\`\`

### Three-Point Lighting Rules (CRITICAL FOR QUALITY)
1. **Ambient light** — Low intensity (0.2-0.4), provides baseline illumination
2. **Key light** — Directional, high intensity (0.8-1.5), from 45° angle, castShadow=true
3. **Fill light** — Directional, low intensity (0.2-0.5), opposite side of key light
4. **NEVER skip lighting** — A scene without proper lights renders as black

### PBR Material Presets (meshStandardMaterial)
Use these as starting points:
- **Polished Metal**: metalness=0.9, roughness=0.1, color="#C0C0C0"
- **Brushed Metal**: metalness=0.85, roughness=0.3, color="#A0A0A0"
- **Gold**: metalness=0.95, roughness=0.15, color="#FFD700"
- **Plastic**: metalness=0.0, roughness=0.4, color=any
- **Rubber**: metalness=0.0, roughness=0.9, color=any
- **Wood**: metalness=0.0, roughness=0.7, color="#8B4513"
- **Ceramic**: metalness=0.0, roughness=0.3, color=any
- **Glass**: Use meshPhysicalMaterial with transmission=1.0, roughness=0.0, metalness=0.0, ior=1.5, transparent=true, thickness=0.5

### Geometry Types (with args)
- Box: \`<boxGeometry args={[width, height, depth]} />\`
- Sphere: \`<sphereGeometry args={[radius, 32, 32]} />\` (always use 32+ segments)
- Cylinder: \`<cylinderGeometry args={[radiusTop, radiusBottom, height, 32]} />\`
- Cone: \`<coneGeometry args={[radius, height, 32]} />\`
- Torus: \`<torusGeometry args={[radius, tube, 16, 100]} />\`
- Torus Knot: \`<torusKnotGeometry args={[radius, tube, 100, 16]} />\`
- Plane: \`<planeGeometry args={[width, height]} />\`

### Animation Pattern (useFrame)
\`\`\`tsx
function RotatingMesh({ speed = 0.5 }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * speed;
  });
  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.2} />
    </mesh>
  );
}
\`\`\`

### Post-Processing (ONLY if explicitly requested)
\`\`\`tsx
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';

// Inside Canvas:
<EffectComposer>
  <Bloom intensity={0.5} luminanceThreshold={0.9} luminanceSmoothing={0.025} />
  <SSAO intensity={20} radius={5} samples={16} />
</EffectComposer>
\`\`\`

### Camera & Controls
- Default FOV: 50 (not 75 — narrower FOV looks more professional)
- Camera position: [5, 3, 5] for product shots, [0, 2, 8] for front-facing
- OrbitControls: always enable damping for smooth feel
- maxPolarAngle={Math.PI / 2} prevents going below ground plane

### Performance Rules
1. Keep total polycount under 100k triangles
2. Use 32 segments for round objects (not 64 or 128)
3. Use instancedMesh for repeated objects (>10 instances)
4. Avoid multiple transparent materials (expensive GPU)
5. Set reasonable camera far plane (100 units max)

### Environment Presets (drei)
Choose based on scene mood:
- "studio" — Neutral product photography (DEFAULT)
- "sunset" — Warm golden light
- "dawn" — Soft morning light
- "night" — Dark with cool tones
- "warehouse" — Industrial, directional
- "city" — Urban reflections
- "forest" — Green, natural
- "apartment" — Indoor, warm
- "park" — Outdoor, balanced
- "lobby" — Architectural, clean

### Complete Product Visualization Example
\`\`\`tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';

function Product() {
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.5}>
      <group>
        <mesh castShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 1, 32]} />
          <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.15} envMapIntensity={1.5} />
        </mesh>
        <mesh castShadow position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>
    </Float>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <Canvas shadows camera={{ position: [3, 2, 3], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, -5, -3]} intensity={0.3} />
        <Environment preset="studio" />
        <Product />
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={1.5} maxDistance={10} />
      </Canvas>
    </div>
  );
}
\`\`\`

### Physics (@react-three/rapier)

#### Physics World Setup
Wrap ALL physics objects inside \`<Physics>\`. Non-physics objects can be outside.
\`\`\`tsx
<Canvas>
  <Physics gravity={[0, -9.81, 0]}>
    {/* Static ground */}
    <RigidBody type="fixed">
      <mesh receiveShadow>
        <boxGeometry args={[20, 0.5, 20]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
    </RigidBody>

    {/* Dynamic ball */}
    <RigidBody type="dynamic" position={[0, 5, 0]} restitution={0.7}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.3} />
      </mesh>
    </RigidBody>
  </Physics>

  <ambientLight intensity={0.3} />
  <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
  <Environment preset="studio" />
  <OrbitControls />
</Canvas>
\`\`\`

#### RigidBody Types
- **fixed** — Static (walls, floors). Never moves.
- **dynamic** — Fully simulated (balls, crates). Affected by gravity and forces.
- **kinematicPosition** — Code-controlled, affects other bodies (moving platforms).
- **kinematicVelocity** — Velocity-controlled (conveyor belts).

#### Collider Shapes
- **Automatic**: RigidBody infers collider from child mesh geometry.
- **Manual**: Use explicit colliders for custom shapes:
  - \`<CuboidCollider args={[halfW, halfH, halfD]} />\`
  - \`<BallCollider args={[radius]} />\`
  - \`<CapsuleCollider args={[halfHeight, radius]} />\`
  - \`<CylinderCollider args={[halfHeight, radius]} />\`

#### Physics Properties
\`\`\`tsx
<RigidBody
  type="dynamic"
  position={[0, 5, 0]}
  gravityScale={1.0}
  linearDamping={0.5}
  angularDamping={0.5}
  friction={0.7}
  restitution={0.3}
  enabledRotations={[true, true, true]}
>
  <mesh castShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="orange" />
  </mesh>
</RigidBody>
\`\`\`

### First-Person Controls (PointerLockControls + Physics)

For first-person games, combine KeyboardControls, PointerLockControls, and a physics-based player capsule.

\`\`\`tsx
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
];

function Player() {
  const rbRef = useRef<any>(null);
  const [, getKeys] = useKeyboardControls();

  useFrame(() => {
    if (!rbRef.current) return;
    const { forward, backward, left, right, jump } = getKeys();
    const impulse = { x: 0, y: 0, z: 0 };
    const speed = 0.5;

    if (forward) impulse.z -= speed;
    if (backward) impulse.z += speed;
    if (left) impulse.x -= speed;
    if (right) impulse.x += speed;

    rbRef.current.applyImpulse(impulse, true);
    if (jump) rbRef.current.applyImpulse({ x: 0, y: 5, z: 0 }, true);
  });

  return (
    <RigidBody ref={rbRef} type="dynamic" position={[0, 3, 0]} enabledRotations={[false, false, false]} linearDamping={0.95}>
      <CapsuleCollider args={[0.75, 0.5]} />
    </RigidBody>
  );
}

export default function App() {
  return (
    <KeyboardControls map={keyboardMap}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas shadows camera={{ position: [0, 2, 5], fov: 60 }}>
          <Physics gravity={[0, -9.81, 0]}>
            <Player />
            {/* Ground */}
            <RigidBody type="fixed">
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#22c55e" />
              </mesh>
            </RigidBody>
          </Physics>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <Sky sunPosition={[100, 20, 100]} />
          <PointerLockControls />
        </Canvas>
      </div>
    </KeyboardControls>
  );
}
\`\`\`

#### FPC Rules
1. **Lock player rotation**: \`enabledRotations={[false, false, false]}\` prevents physics from rotating player
2. **Use CapsuleCollider**: Better than box for character controllers (slides over edges)
3. **Add linearDamping**: Prevents ice-skating (0.9-0.95 feels natural)
4. **PointerLockControls**: Must be inside Canvas but OUTSIDE Physics

### GLTF Model Loading (useGLTF)

\`\`\`tsx
import { useGLTF } from '@react-three/drei';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// Preload for performance
useGLTF.preload('/models/character.glb');
\`\`\`

#### GLTF with Physics
\`\`\`tsx
function PhysicsModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <RigidBody type="dynamic" colliders="hull">
      <primitive object={scene} />
    </RigidBody>
  );
}
\`\`\`

#### Auto Collider Modes
- \`colliders="cuboid"\` — Bounding box (fast, imprecise)
- \`colliders="ball"\` — Bounding sphere (fast)
- \`colliders="hull"\` — Convex hull (recommended for complex models)
- \`colliders="trimesh"\` — Exact mesh (expensive — use for static/fixed only)

### Procedural Terrain

\`\`\`tsx
function Terrain({ size = 100, segments = 100, heightScale = 10 }: {
  size?: number; segments?: number; heightScale?: number;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const vertices = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      // Simple noise (replace with Perlin/Simplex for better results)
      const noise = Math.sin(x * 0.05) * Math.cos(y * 0.05) +
                    Math.sin(x * 0.1 + 1.3) * 0.5 +
                    Math.cos(y * 0.08 + 0.7) * 0.3;
      vertices[i + 2] = noise * heightScale;
    }

    geo.computeVertexNormals();
    return geo;
  }, [size, segments, heightScale]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#4ade80" roughness={0.8} />
    </mesh>
  );
}
\`\`\`

#### Terrain with Physics
\`\`\`tsx
<RigidBody type="fixed" colliders="trimesh">
  <Terrain size={100} segments={50} heightScale={5} />
</RigidBody>
\`\`\`
**Warning**: trimesh colliders are expensive. Use segments=50 max for physics terrain. Visual mesh can be higher detail.

### Skybox & Advanced Environment

#### Solid Color Background
\`\`\`tsx
<color attach="background" args={['#87CEEB']} />
\`\`\`

#### HDRI Environment (with visible background)
\`\`\`tsx
<Environment preset="sunset" background />
\`\`\`

#### Procedural Sky (Drei Sky component)
\`\`\`tsx
import { Sky } from '@react-three/drei';

<Sky
  sunPosition={[100, 20, 100]}
  turbidity={8}
  rayleigh={0.5}
  mieCoefficient={0.005}
  mieDirectionalG={0.8}
/>
\`\`\`

Environment presets for background: "sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "park", "lobby".

### Multi-Scene Navigation

Use React state to switch between scenes inside a single Canvas.

\`\`\`tsx
function App() {
  const [activeScene, setActiveScene] = useState<string>('main');

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ position: [5, 3, 5], fov: 50 }}>
        {activeScene === 'main' && (
          <MainScene onPortal={() => setActiveScene('dungeon')} />
        )}
        {activeScene === 'dungeon' && (
          <DungeonScene onExit={() => setActiveScene('main')} />
        )}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <OrbitControls />
      </Canvas>
    </div>
  );
}

function MainScene({ onPortal }: { onPortal: () => void }) {
  return (
    <>
      <Environment preset="park" background />
      {/* Portal door */}
      <mesh position={[0, 1.5, -3]} onClick={onPortal}>
        <boxGeometry args={[2, 3, 0.3]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}
\`\`\`

For fade transitions, wrap the Canvas div with CSS opacity transitions.

### Output
Return ONLY the full App.tsx code. No markdown. No explanations.`;

// 3D keyword detection patterns
// NOTE: Avoid overly generic words (scene, shadows, lighting, camera, etc.)
// that also appear in 2D CSS/UI contexts. Only match unambiguous 3D terms
// or compound phrases that clearly indicate 3D intent.
const THREE_D_KEYWORDS = /\b(3[dD]|three\.?js|webgl|mesh(?:es)?|geometry|orbit\s*controls|metalness|roughness|PBR|HDRI|environment\s*map|product\s*visual|R3F|react[\s-]*three|torus|cast\s*shadow|ray\s*cast|normal\s*map|useFrame|Canvas\s*shadows|post[\s-]*process|bloom|ssao|depth\s*of\s*field|physics|rigid\s*body|collider|rapier|first[\s-]?person|FPC|pointer[\s-]?lock|terrain|heightmap|procedural\s*terrain|skybox|cubemap|gltf|glb|useGLTF|multi[\s-]?scene)\b/i;

// ============================================================================
// BUILDER FUNCTION
// ============================================================================

/**
 * Assemble final React code from manifests, physics, and assets.
 * When repoContext is provided, the builder will follow the repo's coding style
 * and reuse patterns from the pattern library for consistent code generation.
 */
export async function assembleCode(
  _structure: ComponentStructure | null,
  manifests: VisualManifest[],
  physics: MotionPhysics | null,
  strategy: MergeStrategy,
  _currentCode: string | null,
  instructions: string,
  assets: Record<string, string>,
  repoContext?: RepoContext
): Promise<AppFile[]> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_PRO_MODEL,
    systemInstruction: CODE_ONLY_SYSTEM_INSTRUCTION,
  });

  // Detect 3D mode from strategy flag or instruction keywords
  const is3D = strategy.execution_plan.enable_3d || THREE_D_KEYWORDS.test(instructions);

  const hasAssets = Object.keys(assets).length > 0;
  const assetContext = hasAssets
    ? is3D
      ? `\n\n  ### 3D ASSET CONTEXT
These assets were generated for the 3D scene:
${Object.entries(assets).map(([name, url]) => {
  const isHdri = name.includes('hdri') || name.includes('environment');
  return `  - "${name}" (${isHdri ? 'HDRI Environment' : 'Texture'}): ${url}`;
}).join('\n')}
Use HDRI assets via <Environment files={url} />. Use texture assets via useTexture() or map property.`
      : `\n\n  ### ASSET CONTEXT
These texture/material images were generated for the user's request:
${Object.entries(assets).map(([name, url]) => `  - "${name}" -> ${url}`).join('\n')}
Apply them via backgroundImage on the matching elements. Combine with clip-path for shaped elements.`
    : '';

  // Build prompt: append 3D supplement when in 3D mode
  const basePrompt = is3D ? `${BUILDER_PROMPT}${BUILDER_3D_SUPPLEMENT}` : BUILDER_PROMPT;

  // Build RepoContext injection if provided (Ultimate Developer mode)
  let repoContextSection = '';
  if (repoContext) {
    repoContextSection = `
  ### REPO CONTEXT (CRITICAL - Follow These Rules!)
  You are generating code for an EXISTING repository. Match the existing style exactly.

  **Style Guide (Follow These Conventions):**
  ${repoContext.styleGuide}

  **Pattern Library (Reuse These Templates):**
  ${repoContext.patternLibrary.length > 0
    ? repoContext.patternLibrary
        .map((p) => `- ${p.name} (from ${p.sourceFile}):\n\`\`\`\n${p.codeSnippet.slice(0, 500)}\n\`\`\``)
        .join('\n')
    : 'No patterns extracted.'}

  **Tech Stack:** ${repoContext.techStack.join(', ')}
  `;
  }

  const prompt = `${basePrompt}
${repoContextSection}
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
