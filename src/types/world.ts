/**
 * World Builder Types
 *
 * Type definitions for the 3D World Builder feature.
 * The SceneManifest is a structured JSON that separates spatial content
 * (what exists, where, and how it looks) from implementation (R3F components).
 *
 * The WorldArchitect generates a SceneManifest from a natural language prompt.
 * The Builder then converts the manifest into React Three Fiber code.
 */

// ============================================================================
// PRIMITIVES
// ============================================================================

/** A 3D vector as a tuple [x, y, z] */
export type Vector3 = [number, number, number];

/** Supported primitive geometry types */
export type PrimitiveShape =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'plane';

/** Named PBR material presets that map to known metalness/roughness combos */
export type MaterialPreset =
  | 'polished_metal'
  | 'brushed_metal'
  | 'gold'
  | 'plastic'
  | 'rubber'
  | 'wood'
  | 'ceramic'
  | 'glass'
  | 'stone'
  | 'grass'
  | 'water'
  | 'custom';

// ============================================================================
// MATERIALS
// ============================================================================

/** PBR material definition for a world object */
export interface WorldMaterial {
  /** Base color (hex string, e.g. "#8B4513") */
  color: string;
  /** 0 = dielectric (plastic, wood), 1 = metal */
  metalness?: number;
  /** 0 = mirror-smooth, 1 = fully rough */
  roughness?: number;
  /** Emissive glow color (hex string) — for neon, lava, screens */
  emissive?: string;
  /** Emissive intensity (default 0) */
  emissiveIntensity?: number;
  /** Transparency (0 = opaque, 1 = fully transparent) */
  opacity?: number;
  /** Named preset — overrides metalness/roughness if set */
  preset?: MaterialPreset;
  /** URL to a texture image for this surface */
  textureUrl?: string;
}

// ============================================================================
// WORLD ENTITIES
// ============================================================================

/** Physics configuration for a world entity */
export interface EntityPhysics {
  /** 'fixed' = static (ground, walls), 'dynamic' = movable (balls, crates) */
  type: 'fixed' | 'dynamic' | 'kinematic';
  /** Mass in kg (only for dynamic) */
  mass?: number;
  /** Bounciness — 0 = no bounce, 1 = full bounce */
  restitution?: number;
  /** Surface friction — 0 = ice, 1 = sticky */
  friction?: number;
}

/** Animation behavior for an entity */
export interface EntityAnimation {
  /** Type of animation */
  type: 'rotate' | 'float' | 'sway' | 'pulse';
  /** Rotations/oscillations per second */
  speed?: number;
  /** Movement amplitude (units) */
  amplitude?: number;
  /** Axis to animate on */
  axis?: 'x' | 'y' | 'z';
}

/** A single entity (object) in the 3D world */
export interface WorldEntity {
  /** Unique identifier */
  id: string;
  /** Human-readable name (e.g. "oak_tree_1", "house_main") */
  name: string;
  /** Geometry type — primitives only for Phase 1 */
  shape: PrimitiveShape;
  /** Geometry dimensions [width, height, depth] or [radius, height, segments] depending on shape */
  dimensions?: number[];
  /** Position in world space */
  position: Vector3;
  /** Rotation in radians [x, y, z] */
  rotation?: Vector3;
  /** Scale multiplier [x, y, z] */
  scale?: Vector3;
  /** Surface material */
  material: WorldMaterial;
  /** Physics body configuration */
  physics?: EntityPhysics;
  /** Animation configuration */
  animation?: EntityAnimation;
  /** Whether this entity casts shadows */
  castShadow?: boolean;
  /** Whether this entity receives shadows */
  receiveShadow?: boolean;
  /** Nested child entities (for composite objects like "tree = trunk + canopy") */
  children?: WorldEntity[];
  /** Semantic label for the AI to reference in refinement (e.g. "river", "church") */
  label?: string;
}

// ============================================================================
// ENVIRONMENT
// ============================================================================

/** Light source in the scene */
export interface WorldLight {
  /** Light type */
  type: 'ambient' | 'directional' | 'point' | 'spot';
  /** Light color (hex) */
  color?: string;
  /** Intensity (0-2 typical range) */
  intensity: number;
  /** Position for directional/point/spot lights */
  position?: Vector3;
  /** Whether this light casts shadows */
  castShadow?: boolean;
}

/** Particle system definition */
export interface ParticleSystem {
  /** Particle type */
  type: 'rain' | 'snow' | 'dust' | 'fireflies' | 'sparks' | 'leaves';
  /** Particle density (1-100) */
  density: number;
  /** Spawn volume size */
  area?: Vector3;
}

/** Scene environment configuration */
export interface WorldEnvironment {
  /** drei Environment preset name for HDRI reflections */
  skyPreset?: 'studio' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'city' | 'forest' | 'apartment' | 'park' | 'lobby';
  /** Whether to show sky as visible background (not just reflections) */
  skyBackground?: boolean;
  /** Use procedural Sky component instead of HDRI */
  proceduralSky?: {
    sunPosition: Vector3;
    turbidity?: number;
    rayleigh?: number;
  };
  /** Scene background color (fallback if no sky) */
  backgroundColor?: string;
  /** Fog configuration */
  fog?: {
    color: string;
    /** Near distance where fog starts */
    near: number;
    /** Far distance where fog is fully opaque */
    far: number;
  };
  /** All light sources in the scene */
  lights: WorldLight[];
  /** Particle systems active in the scene */
  particles?: ParticleSystem[];
}

// ============================================================================
// GROUND
// ============================================================================

/** Ground/terrain configuration */
export interface WorldGround {
  /** Ground type */
  type: 'flat' | 'terrain';
  /** Size of the ground plane [width, depth] */
  size: [number, number];
  /** Ground material */
  material: WorldMaterial;
  /** Terrain height scale (only for type: 'terrain') */
  heightScale?: number;
  /** Terrain resolution / segments (only for type: 'terrain') */
  segments?: number;
}

// ============================================================================
// CAMERA
// ============================================================================

/** Camera and controls configuration */
export interface WorldCamera {
  /** Initial camera position */
  position: Vector3;
  /** Point the camera looks at */
  target?: Vector3;
  /** Field of view in degrees */
  fov?: number;
  /** Control scheme */
  controls: 'orbit' | 'first_person' | 'fly';
}

// ============================================================================
// SCENE MANIFEST (THE CORE TYPE)
// ============================================================================

/**
 * SceneManifest — the structured representation of a 3D world.
 *
 * Generated by the WorldArchitect from a natural language prompt.
 * Consumed by the Builder to generate React Three Fiber code.
 *
 * Separates spatial content (WHAT) from rendering implementation (HOW).
 */
export interface SceneManifest {
  /** Human-readable scene name */
  name: string;
  /** Brief description of the scene */
  description: string;
  /** All objects in the scene */
  entities: WorldEntity[];
  /** Environment settings (sky, lighting, fog, particles) */
  environment: WorldEnvironment;
  /** Ground/terrain configuration */
  ground?: WorldGround;
  /** Camera settings */
  camera: WorldCamera;
  /** Physics world settings */
  physics?: {
    /** Whether physics simulation is enabled */
    enabled: boolean;
    /** Gravity vector (default: [0, -9.81, 0]) */
    gravity: Vector3;
  };
}
