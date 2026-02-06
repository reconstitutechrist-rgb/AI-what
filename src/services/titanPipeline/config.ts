/**
 * Titan Pipeline Configuration
 *
 * Model constants, API key getters, and system instructions.
 */

// ============================================================================
// MODEL CONSTANTS (2026 SPECS)
// ============================================================================

export const GEMINI_FLASH_MODEL = 'gemini-3-flash-preview';
export const GEMINI_PRO_MODEL = 'gemini-3-pro-preview';
export const GEMINI_DEEP_THINK_MODEL = 'gemini-3-pro-preview';
export const CLAUDE_OPUS_MODEL = 'claude-opus-4-5-20251101';

export const CODE_ONLY_SYSTEM_INSTRUCTION =
  'You are a code generator. Output ONLY valid TypeScript/React code. ' +
  'Never include explanations, markdown fences (```), or conversational text. ' +
  'Start directly with import statements or code. Any non-code text will break the build.';

// ============================================================================
// API KEY GETTERS
// ============================================================================

export function getGeminiApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Anthropic API key missing');
  return key;
}
