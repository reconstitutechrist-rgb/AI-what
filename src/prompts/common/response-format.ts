/**
 * Standard response format delimiters
 * Used by ai-builder and full-app routes
 */

export const DELIMITER_FORMAT = `
RESPONSE FORMAT:
Use EXACT delimiters (NO JSON, NO markdown):
- ===NAME=== Component/app name
- ===DESCRIPTION=== or ===EXPLANATION=== Brief description
- ===CODE=== or ===FILE:path=== Code content
- ===END=== End marker
Do NOT add text before ===NAME=== or after ===END===
`.trim();
