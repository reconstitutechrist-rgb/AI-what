/**
 * Layout Validation Helper Functions
 */

import { DEFAULT_BOUNDS } from './constants';

/**
 * Helper to convert bounds value to percentage.
 * Handles both 0-100 (percentage) and 0-1000 (normalized) scales.
 * Values > 100 are assumed to be 0-1000 scale and converted to percentage.
 */
export function toPercentage(val: number | string, defaultVal: number): number {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return defaultVal;
  // If value > 100, assume 0-1000 scale and convert to percentage
  if (num > 100) {
    return Math.max(0, Math.min(100, num / 10));
  }
  return Math.max(0, Math.min(100, num));
}

/**
 * Helper for width/height - ensures minimum value for visibility.
 */
export function toPercentageWithMin(
  val: number | string,
  defaultVal: number,
  min: number = 1
): number {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) return defaultVal;
  // If value > 100, assume 0-1000 scale and convert to percentage
  if (num > 100) {
    return Math.max(min, Math.min(100, num / 10));
  }
  return Math.max(min, Math.min(100, num));
}

/**
 * Safely convert a value to a number with bounds checking.
 * Handles both 0-100 (percentage) and 0-1000 (normalized) scales.
 * Values > 100 are assumed to be 0-1000 scale and converted to percentage.
 */
export function safeNumber(
  value: unknown,
  defaultValue: number,
  minValue: number = 0,
  maxValue: number = 100
): number {
  if (value === null || value === undefined) return defaultValue;

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  if (isNaN(num)) return defaultValue;

  // Convert 0-1000 scale to percentage if value > 100
  const converted = num > 100 ? num / 10 : num;

  return Math.max(minValue, Math.min(maxValue, converted));
}

/**
 * Sanitize bounds with safe defaults
 */
export function sanitizeBounds(rawBounds: Record<string, unknown> | undefined): {
  top: number;
  left: number;
  width: number;
  height: number;
} {
  return {
    top: safeNumber(rawBounds?.top, DEFAULT_BOUNDS.top),
    left: safeNumber(rawBounds?.left, DEFAULT_BOUNDS.left),
    width: safeNumber(rawBounds?.width, DEFAULT_BOUNDS.width, 1),
    height: safeNumber(rawBounds?.height, DEFAULT_BOUNDS.height, 1),
  };
}
