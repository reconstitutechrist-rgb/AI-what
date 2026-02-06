/**
 * Live Editor Step (Step 5)
 *
 * Quick code refinement - edits existing code based on user instructions.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LiveEditResult } from '@/types/titanPipeline';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { extractCode } from '@/utils/extractCode';
import { getGeminiApiKey, GEMINI_PRO_MODEL, CODE_ONLY_SYSTEM_INSTRUCTION } from './config';

// ============================================================================
// LIVE EDITOR PROMPT
// ============================================================================

const LIVE_EDITOR_PROMPT = `### Role
You are a **Live Code Editor**.

### Input
1. **Current Code:** The full component file.
2. **Selected Element:** The data-id of the element the user selected.
3. **Instruction:** What the user wants to change.

### Task
Return the COMPLETE updated component file with the requested changes applied.
* Preserve all existing logic, event handlers, and imports.
* Only modify the parts related to the user's instruction.
* If the user says "Make this blue", only change the relevant className/style.
* If the user says "Add a button", add it in the appropriate location.
* Keep all data-id attributes intact.

### Output
Return ONLY the updated code. No markdown fences, no explanations.`;

// ============================================================================
// LIVE EDITOR FUNCTION
// ============================================================================

/**
 * Live edit code based on user instructions
 */
export async function liveEdit(
  currentCode: string,
  selectedDataId: string,
  instruction: string
): Promise<LiveEditResult> {
  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: GEMINI_PRO_MODEL,
      systemInstruction: CODE_ONLY_SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.2, maxOutputTokens: 16384 },
    });

    const prompt = `${LIVE_EDITOR_PROMPT}

### Current Code
\`\`\`tsx
${currentCode}
\`\`\`

### Selected Element
data-id="${selectedDataId}"

### Instruction
"${instruction}"`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    const updatedCode = extractCode(result.response.text());

    return { updatedCode, success: true };
  } catch (error) {
    return {
      updatedCode: currentCode,
      success: false,
      error: error instanceof Error ? error.message : 'Live edit failed',
    };
  }
}
