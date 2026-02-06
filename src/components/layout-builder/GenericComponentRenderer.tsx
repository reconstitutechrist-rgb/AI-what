/**
 * Generic Component Renderer
 *
 * The "Atom" of the Zero-Preset Layout Builder.
 * Renders ANY component detected by Gemini 3 Flash by mapping
 * enhanced style properties directly to CSS/Tailwind.
 *
 * This file now serves as a barrel export for backward compatibility.
 * All implementation has been split into smaller modules in ./renderers/
 */

// Re-export everything from the modular implementation
export { GenericComponentRenderer } from './renderers/index';
export type { GenericComponentRendererProps } from './renderers/index';
