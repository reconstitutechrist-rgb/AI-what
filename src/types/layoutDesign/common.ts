/**
 * Common foundational types and utilities
 * Used across all layout design modules
 */

// VisualAnalysis was from deleted GeminiLayoutService
// Using a generic record type for backward compatibility
export type VisualAnalysis = Record<string, unknown>;

// ============================================================================
// CUSTOMIZABLE VALUE WRAPPER
// ============================================================================

/**
 * Wrapper type for values that can be preset or custom
 * Allows pixel-level control while maintaining preset options
 */
export interface CustomizableValue<T extends string> {
  preset?: T;
  custom?: string; // Allows '16px', '1rem', '2.5em', etc.
}

/**
 * Helper to get the actual value from a CustomizableValue
 */
export function getCustomizableValue<T extends string>(
  value: CustomizableValue<T> | T | undefined,
  presetMap: Record<T, string>,
  defaultValue: string
): string {
  if (!value) return defaultValue;
  if (typeof value === 'string') return presetMap[value] || defaultValue;
  if (value.custom) return value.custom;
  if (value.preset) return presetMap[value.preset] || defaultValue;
  return defaultValue;
}

/**
 * Helper to extract the preset key from a CustomizableValue or string
 * Returns the preset key for use as an index, or undefined if custom-only
 */
export function getPresetKey<T extends string>(
  value: CustomizableValue<T> | T | undefined,
  defaultKey: T
): T {
  if (!value) return defaultKey;
  if (typeof value === 'string') return value;
  if (value.preset) return value.preset;
  return defaultKey;
}
