/**
 * Titan Pipeline Service
 *
 * Orchestrator for:
 * - Router (Traffic Control)
 * - Surveyor (Vision Analysis via Python)
 * - Architect (Structure via Claude)
 * - Physicist (Animation Math)
 * - Photographer (Asset Generation)
 * - Builder (Code Synthesis)
 * - Live Editor (Refinement)
 *
 * This file now serves as a barrel export for backward compatibility.
 * All implementation has been split into smaller modules in ./titanPipeline/
 */

// Re-export everything from the modular implementation
export * from './titanPipeline/index';
