/**
 * Layout Validation Utilities
 *
 * Provides Zod schemas and sanitization functions for DetectedComponentEnhanced
 * to ensure AI-generated layout data is valid before rendering.
 *
 * This file now serves as a barrel export for backward compatibility.
 * All utilities have been split into smaller modules in ./layoutValidation/
 */

// Re-export all utilities from the modular implementation
export * from './layoutValidation/index';
