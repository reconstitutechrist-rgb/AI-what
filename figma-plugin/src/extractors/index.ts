/**
 * Main export for all extractors
 */

export { extractColors, inferColorRoles } from './colorExtractor';
export { extractTypography, inferTypographySettings } from './typographyExtractor';
export { extractSpacing, inferSpacingSettings } from './spacingExtractor';
export {
  extractComponents,
  extractEffects,
  extractCornerRadius,
  inferEffectsSettings,
  inferLayoutStructure,
} from './componentExtractor';
