/**
 * Physicist Step (Step 2)
 *
 * Motion physics extraction - analyzes videos to extract spring physics and timing.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MotionPhysics, FileInput, MergeStrategy } from '@/types/titanPipeline';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getGeminiApiKey, GEMINI_DEEP_THINK_MODEL } from './config';
import { uploadFileToGemini } from './helpers';

// ============================================================================
// PHYSICIST PROMPT
// ============================================================================

const PHYSICIST_PROMPT = `### Role
You are the **Physicist**. Analyze the video. Extract spring physics, gravity, and timing.
Return JSON: { "component_motions": [] }`;

// ============================================================================
// PHYSICIST FUNCTION
// ============================================================================

/**
 * Extract motion physics from video files
 */
export async function extractPhysics(
  files: FileInput[],
  _strategy?: MergeStrategy
): Promise<MotionPhysics> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_DEEP_THINK_MODEL });

  const parts: unknown[] = [{ text: PHYSICIST_PROMPT }];
  for (const f of files) {
    const up = await uploadFileToGemini(apiKey, f);
    parts.push({ fileData: { mimeType: up.mimeType, fileUri: up.uri } });
  }

  if (files.length === 0) return { component_motions: [] };

  const result = await withGeminiRetry(() => model.generateContent(parts as Parameters<typeof model.generateContent>[0]));
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { component_motions: [] };
  } catch (e) {
    console.warn('[Physicist] JSON parse failed:', e);
    console.warn('[Physicist] Raw response (first 500 chars):', text.slice(0, 500));
    return { component_motions: [] };
  }
}
