/**
 * Video Analysis Module
 *
 * Analyze video keyframes to extract motion and animation configurations.
 */

import type { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { VideoMotionAnalysis } from '@/types/motionConfig';
import { MODEL_FLASH } from './config';
import { fileToPart } from './helpers';

/**
 * Analyze video keyframes to extract motion and flow
 * @param client GoogleGenerativeAI client instance
 * @param frames Array of base64 images (Start, Middle, End)
 * @param instructions Optional user instructions
 */
export async function analyzeVideoFlow(
  client: GoogleGenerativeAI,
  frames: string[],
  instructions?: string
): Promise<VideoMotionAnalysis> {
  const model = client.getGenerativeModel({
    model: MODEL_FLASH,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
    Analyze these 3 video frames (Start, Middle, End) to reverse-engineer the web animations.
    
    USER INSTRUCTIONS: ${instructions || 'Analyze the natural motion flow.'}

    Look for:
    1. **Entrance Animations**: Do elements fade in? Slide up? Scale up?
    2. **Timing**: Based on the difference between frames, estimate duration.
    3. **Scroll Parallax**: Do background elements move slower than foreground?
    
    Return a 'VideoMotionAnalysis' JSON object describing the detected framer-motion configs.
  `;

  // Convert all frames to parts
  const imageParts = frames.map((f) => fileToPart(f));

  const result = await withGeminiRetry(() => model.generateContent([prompt, ...imageParts]));
  const response = result.response;

  try {
    return JSON.parse(response.text()) as VideoMotionAnalysis;
  } catch (e) {
    console.error('[analyzeVideoFlow] Failed to parse Video Motion response', e);
    return {
      keyframes: { start: 0, end: 1 },
      transitions: [],
      hoverEffects: false,
      scrollEffects: false,
    };
  }
}
