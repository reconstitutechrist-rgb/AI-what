/**
 * Titan Pipeline Service - Barrel Export
 *
 * Re-exports the TitanPipelineService class, step functions, and singleton accessor.
 * Maintains backward compatibility with existing imports.
 */

// Re-export the service class
export { TitanPipelineServiceInstance, runPipeline } from './TitanPipelineService';

// Re-export config constants
export {
  GEMINI_FLASH_MODEL,
  GEMINI_PRO_MODEL,
  GEMINI_DEEP_THINK_MODEL,
  CLAUDE_OPUS_MODEL,
  CODE_ONLY_SYSTEM_INSTRUCTION,
  getGeminiApiKey,
  getAnthropicApiKey,
} from './config';

// Re-export helper functions
export { uploadFileToGemini, parseAutonomyOutput } from './helpers';

// Re-export step functions for direct access if needed
export { routeIntent } from './router';
export { surveyLayout } from './surveyor';
export { buildStructure } from './architect';
export { extractPhysics } from './physicist';
export { assembleCode } from './builder';
export { liveEdit } from './liveEditor';
export { getRepoAnalyst } from './analyst';

// Import the class to create the singleton
import { TitanPipelineServiceInstance } from './TitanPipelineService';

// ============================================================================
// SINGLETON ACCESSOR
// ============================================================================

let _instance: TitanPipelineServiceInstance | null = null;

/**
 * Get or create the singleton TitanPipelineService instance
 */
export function getTitanPipelineService(): TitanPipelineServiceInstance {
  if (!_instance) {
    _instance = new TitanPipelineServiceInstance();
  }
  return _instance;
}
