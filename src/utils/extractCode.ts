/**
 * Extract clean code from AI model output.
 *
 * AI models (especially Gemini) often wrap code in conversational text
 * like "Here's the implementation:" before the code and "This creates
 * a realistic scene..." after the code. When systemInstruction tells
 * the model to omit markdown fences, the conversational wrapping has
 * no delimiters — this utility detects code boundaries heuristically.
 *
 * Strategies (applied in order):
 *   1. Extract from markdown fences (```tsx ... ```)
 *   2. Detect first/last lines that look like code, strip the rest
 *   3. Fallback: strip any stray fence markers and trim
 */
export function extractCode(raw: string): string {
  if (!raw?.trim()) return '';

  // Strategy 1: Extract from markdown fences
  const fenceMatch = raw.match(/```(?:tsx?|jsx?|typescript|javascript)?\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Strategy 2: Detect and strip leading/trailing conversational text
  const lines = raw.split('\n');

  // Find first line that looks like code
  const CODE_START =
    /^(import\s|export\s|'use |"use |const\s|let\s|var\s|function\s|class\s|interface\s|type\s|enum\s|async\s|declare\s|\/\/\s*===|\/\*)/;
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (CODE_START.test(lines[i].trimStart())) {
      start = i;
      break;
    }
  }

  // Find last line that looks like code (walk backwards, skip blanks)
  const CODE_END = /[;\}\)\>,\{]$|^\s*\/\/|^\s*\/\*|^\s*\*|^export\s|^import\s/;
  let end = lines.length - 1;
  while (end > start) {
    const trimmed = lines[end].trim();
    if (trimmed === '') {
      end--;
      continue;
    }
    if (CODE_END.test(trimmed)) break;
    end--;
  }

  if (start > 0 || end < lines.length - 1) {
    return lines.slice(start, end + 1).join('\n').trim();
  }

  // Strategy 3: Fallback — strip fence markers
  return raw.replace(/^```\w*\n?/gm, '').replace(/\n?```$/gm, '').trim();
}
