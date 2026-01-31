/**
 * Responsive Typography Utilities
 *
 * Provides validation and calculation functions for preventing
 * typography-induced layout overlaps in the layout builder.
 *
 * Used by:
 * - GenericComponentRenderer (runtime minHeight calculation)
 * - GeminiLayoutService (post-processing validation)
 */

/**
 * Parse a font size value to numeric pixels.
 * Handles: "48px", "3rem", "2em", 48 (number), undefined
 */
export function parseFontSize(fontSize: string | number | undefined): number {
  if (fontSize === undefined || fontSize === null || fontSize === '') return 16;
  if (typeof fontSize === 'number') return fontSize;

  const str = String(fontSize).trim();
  const match = str.match(/^(-?[\d.]+)\s*(px|rem|em|pt)?$/i);
  if (!match) return 16;

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'px').toLowerCase();

  switch (unit) {
    case 'rem':
    case 'em':
      return value * 16;
    case 'pt':
      return value * (4 / 3);
    default:
      return value;
  }
}

/**
 * Calculate the minimum container height needed to display text content
 * without overflow, based on font size, line height, and container width.
 *
 * @param text - The text content to measure
 * @param fontSize - Font size (e.g., "48px", 48)
 * @param lineHeight - Line height (unitless multiplier like 1.4, or "24px")
 * @param containerWidthPercent - Container width as percentage of viewport (0-100)
 * @param viewportWidth - Reference viewport width in pixels (default: 1280)
 * @returns Minimum height in pixels needed to contain the text
 */
export function calculateMinHeightForText(
  text: string | undefined,
  fontSize: string | number | undefined,
  lineHeight: number | string | undefined,
  containerWidthPercent: number,
  viewportWidth: number = 1280
): number {
  if (!text || text.length === 0) return 0;

  const fontSizePx = parseFontSize(fontSize);

  // Parse line height
  let lineHeightPx: number;
  if (typeof lineHeight === 'number') {
    // Unitless multiplier (e.g., 1.4)
    lineHeightPx = fontSizePx * lineHeight;
  } else if (typeof lineHeight === 'string' && lineHeight.endsWith('px')) {
    lineHeightPx = parseFloat(lineHeight);
  } else {
    // Default line height
    lineHeightPx = fontSizePx * 1.4;
  }

  // Calculate container width in pixels
  const containerWidthPx = (containerWidthPercent / 100) * viewportWidth;

  // Estimate characters per line
  // Average character width ~0.6 * fontSize for proportional fonts
  const avgCharWidth = fontSizePx * 0.6;
  const charsPerLine = Math.max(1, Math.floor(containerWidthPx / avgCharWidth));

  // Estimate number of lines
  const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLine));

  // Calculate total text height plus padding buffer
  const textHeight = estimatedLines * lineHeightPx;
  const paddingBuffer = 16; // Account for padding

  return Math.ceil(textHeight + paddingBuffer);
}

/**
 * Validate whether a font size is proportional to a container's height.
 * Returns the recommended font size if the current one would cause overflow.
 *
 * @param fontSize - Font size (e.g., "48px", 48)
 * @param containerHeightPercent - Container height as percentage of viewport (0-100)
 * @param viewportHeight - Reference viewport height in pixels (default: 800)
 * @returns Validation result with optional recommended font size
 */
export function validateFontSizeForContainer(
  fontSize: string | number | undefined,
  containerHeightPercent: number,
  viewportHeight: number = 800
): { valid: boolean; recommendedFontSize?: number } {
  const fontSizePx = parseFontSize(fontSize);
  const containerHeightPx = (containerHeightPercent / 100) * viewportHeight;

  // Font size should not exceed 40% of container height
  // This allows ~2 lines of text with standard line height
  const maxFontSize = containerHeightPx * 0.4;

  if (fontSizePx > maxFontSize && maxFontSize > 0) {
    return {
      valid: false,
      recommendedFontSize: Math.floor(maxFontSize),
    };
  }

  return { valid: true };
}
