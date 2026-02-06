/**
 * Gemini Layout Service - Barrel Export
 *
 * Re-exports the GeminiLayoutService class and singleton accessor.
 * Maintains backward compatibility with existing imports.
 */

// Re-export the service class
export { GeminiLayoutService } from './GeminiLayoutService';

// Re-export config types and constants
export { MODEL_FLASH, type LayoutCritique, getDefaultDesignSpec } from './config';

// Re-export helper functions for advanced usage
export { fileToPart, normalizeCoordinates, validateTypographyScaling } from './helpers';

// Re-export stage functions for direct access if needed
export { extractDesignSpec } from './extractDesignSpec';
export { buildComponentsFromSpec } from './buildComponents';
export { analyzeVideoFlow } from './videoAnalysis';
export { critiqueLayout, critiqueLayoutEnhanced } from './critique';
export { editComponent } from './editComponent';

// Import the class to create the singleton
import { GeminiLayoutService } from './GeminiLayoutService';

// Singleton instance
let geminiLayoutService: GeminiLayoutService | null = null;

/**
 * Get or create the singleton GeminiLayoutService instance
 */
export function getGeminiLayoutService(): GeminiLayoutService {
  if (!geminiLayoutService) {
    geminiLayoutService = new GeminiLayoutService();
  }
  return geminiLayoutService;
}
