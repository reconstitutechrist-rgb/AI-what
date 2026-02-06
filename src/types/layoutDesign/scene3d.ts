/**
 * 3D Scene Type Definitions
 *
 * Type definitions for React Three Fiber scene configuration.
 * Used by the Builder prompt and Visual Critic for 3D quality assessment.
 *
 * Phase 1: Product visualization (PBR, studio lighting, orbit controls)
 * Phase 2: Interactive worlds (physics, terrain, first-person controls)
 */

// ============================================================================
// RENDERER CONFIGURATION
// ============================================================================

export interface Scene3DConfig {
  renderer?: {
    antialias?: boolean;
    shadows?: boolean;
    toneMapping?: 'ACESFilmic' | 'Linear' | 'Reinhard' | 'Cinematic';
    outputColorSpace?: 'srgb' | 'linear';
  };
  camera?: CameraConfig3D;
  controls?: ControlsConfig3D;
}

export interface CameraConfig3D {
  type?: 'perspective' | 'orthographic';
  position?: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
  zoom?: number;
}

export interface ControlsConfig3D {
  type?: 'orbit' | 'trackball' | 'fly' | 'pointer-lock' | 'map';
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  maxPolarAngle?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

// ============================================================================
// LIGHTING
// ============================================================================

export type LightType3D = 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere' | 'area';

export interface Light3D {
  type: LightType3D;
  position?: [number, number, number];
  target?: [number, number, number];
  intensity?: number;
  color?: string;
  castShadow?: boolean;
  /** Hemisphere light ground color */
  groundColor?: string;
  /** Spot light angle (radians) */
  angle?: number;
  /** Spot light penumbra (0-1) */
  penumbra?: number;
  /** Point/spot light decay */
  decay?: number;
}

// ============================================================================
// MATERIALS (PBR)
// ============================================================================

export type MaterialType3D =
  | 'standard'
  | 'physical'
  | 'basic'
  | 'lambert'
  | 'phong'
  | 'toon'
  | 'shader';

export interface Material3D {
  type: MaterialType3D;
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  map?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  envMap?: string;
  envMapIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  /** MeshPhysicalMaterial properties */
  transmission?: number;
  thickness?: number;
  ior?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
}

// ============================================================================
// GEOMETRY & OBJECTS
// ============================================================================

export type GeometryType3D =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'torusKnot'
  | 'plane'
  | 'ring'
  | 'dodecahedron'
  | 'icosahedron'
  | 'octahedron'
  | 'capsule'
  | 'extrude'
  | 'lathe'
  | 'custom';

export interface Geometry3D {
  type: GeometryType3D;
  /** Constructor args (e.g., [width, height, depth] for box) */
  args?: number[];
  /** Segment counts for smooth surfaces */
  segments?: number;
}

export interface Object3D {
  id: string;
  type: 'mesh' | 'group' | 'instance' | 'line' | 'points';
  geometry?: Geometry3D;
  material?: Material3D;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: Object3D[];
  /** GLTF/GLB model URL */
  modelUrl?: string;
  /** Instance count for instanced meshes */
  instanceCount?: number;
  /** Physics rigid body (Phase 2) */
  rigidBody?: RigidBody3D;
}

// ============================================================================
// POST-PROCESSING
// ============================================================================

export interface PostProcessing3D {
  bloom?: {
    intensity?: number;
    threshold?: number;
    smoothing?: number;
  };
  ssao?: {
    intensity?: number;
    radius?: number;
    samples?: number;
  };
  depthOfField?: {
    focusDistance?: number;
    focalLength?: number;
    bokehScale?: number;
  };
  chromaticAberration?: {
    offset?: [number, number];
  };
  vignette?: {
    offset?: number;
    darkness?: number;
  };
  toneMapping?: {
    mode?: 'ACESFilmic' | 'Linear' | 'Reinhard';
  };
}

// ============================================================================
// ENVIRONMENT
// ============================================================================

export type EnvironmentPreset3D =
  | 'sunset'
  | 'dawn'
  | 'night'
  | 'warehouse'
  | 'forest'
  | 'apartment'
  | 'studio'
  | 'city'
  | 'park'
  | 'lobby';

export interface Environment3D {
  /** Background color or gradient */
  background?: string;
  /** Drei Environment preset for HDRI lighting */
  preset?: EnvironmentPreset3D;
  /** Custom HDRI URL */
  hdriUrl?: string;
  /** Enable fog */
  fog?: {
    color?: string;
    near?: number;
    far?: number;
  };
  /** Ground plane */
  ground?: {
    color?: string;
    receiveShadow?: boolean;
    size?: number;
  };
}

// ============================================================================
// PHYSICS (Phase 2 — @react-three/rapier)
// ============================================================================

export type ColliderShape3D =
  | 'cuboid'
  | 'ball'
  | 'capsule'
  | 'cylinder'
  | 'cone'
  | 'trimesh'
  | 'heightfield';

export type RigidBodyType3D = 'fixed' | 'dynamic' | 'kinematicPosition' | 'kinematicVelocity';

export interface Collider3D {
  shape: ColliderShape3D;
  /** Shape-specific args (e.g., [halfW, halfH, halfD] for cuboid, [radius] for ball) */
  args?: number[];
  sensor?: boolean;
  friction?: number;
  restitution?: number;
  density?: number;
}

export interface RigidBody3D {
  type: RigidBodyType3D;
  position?: [number, number, number];
  rotation?: [number, number, number];
  gravityScale?: number;
  linearVelocity?: [number, number, number];
  angularVelocity?: [number, number, number];
  enabledRotations?: [boolean, boolean, boolean];
  colliders: Collider3D[];
}

export interface PhysicsConfig3D {
  gravity?: [number, number, number];
  /** Physics update rate (hz) */
  timeStep?: number;
  debug?: boolean;
}

// ============================================================================
// FIRST-PERSON CONTROLS (Phase 2)
// ============================================================================

export interface FirstPersonConfig3D {
  moveSpeed?: number;
  jumpForce?: number;
  mouseSensitivity?: number;
  /** Player capsule collider height */
  height?: number;
  /** Player capsule collider radius */
  radius?: number;
  /** Lock pointer on click */
  autoLock?: boolean;
}

// ============================================================================
// TERRAIN GENERATION (Phase 2)
// ============================================================================

export type TerrainType3D = 'perlin' | 'simplex' | 'heightmap' | 'flat';

export interface TerrainConfig3D {
  type: TerrainType3D;
  /** Grid dimensions [width, depth] */
  size?: [number, number];
  /** Grid resolution [segmentsX, segmentsZ] */
  segments?: [number, number];
  /** Terrain height range [min, max] */
  heightRange?: [number, number];
  /** Noise frequency (for procedural terrain) */
  frequency?: number;
  /** Noise octaves (detail level) */
  octaves?: number;
  /** Heightmap image URL (for heightmap type) */
  heightmapUrl?: string;
  /** Terrain material */
  material?: Material3D;
  /** Generate physics collider */
  physics?: boolean;
}

// ============================================================================
// SKYBOX & ADVANCED ENVIRONMENT (Phase 2)
// ============================================================================

export type SkyboxType3D = 'color' | 'gradient' | 'cubemap' | 'hdri' | 'procedural';

export interface SkyboxConfig3D {
  type: SkyboxType3D;
  /** Solid color or gradient colors [top, bottom] */
  colors?: string[];
  /** Cubemap face URLs [px, nx, py, ny, pz, nz] */
  cubemapUrls?: string[];
  /** HDRI URL */
  hdriUrl?: string;
  /** Procedural sky params */
  sunPosition?: [number, number, number];
  turbidity?: number;
  rayleigh?: number;
}

// ============================================================================
// MULTI-SCENE NAVIGATION (Phase 2)
// ============================================================================

export interface SceneTransition3D {
  type: 'fade' | 'crossfade' | 'wipe' | 'instant';
  duration?: number;
}

export interface SceneGraph3D {
  /** Scene ID (unique identifier) */
  id: string;
  /** Human-readable scene name */
  name: string;
  /** Scene configuration */
  scene: Scene3DDefinition;
  /** Initial scene flag */
  isInitial?: boolean;
  /** Scene transition config */
  transition?: SceneTransition3D;
}

export interface MultiSceneConfig3D {
  scenes: SceneGraph3D[];
  /** Navigation triggers (e.g., click object to change scene) */
  navigationTriggers?: Array<{
    sceneId: string;
    targetSceneId: string;
    objectId: string;
  }>;
}

// ============================================================================
// COMPLETE SCENE DEFINITION
// ============================================================================

export interface Scene3DDefinition {
  config: Scene3DConfig;
  lights: Light3D[];
  objects: Object3D[];
  environment?: Environment3D;
  postProcessing?: PostProcessing3D;
  /** Physics world configuration (Phase 2) */
  physics?: PhysicsConfig3D;
  /** Terrain (Phase 2) */
  terrain?: TerrainConfig3D;
  /** Skybox (Phase 2) */
  skybox?: SkyboxConfig3D;
  /** First-person controls (Phase 2) */
  firstPerson?: FirstPersonConfig3D;
  /** Multi-scene configuration (Phase 2) */
  multiScene?: MultiSceneConfig3D;
}
