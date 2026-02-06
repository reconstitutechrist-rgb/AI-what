/**
 * Edit Component Module
 *
 * AI-powered component editing based on natural language instructions.
 */

import type { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { sanitizeComponents } from '@/utils/layoutValidation';
import { MODEL_FLASH } from './config';

/**
 * Edit a specific component based on User Instruction
 * @param client GoogleGenerativeAI client instance
 * @param component The component to edit
 * @param prompt User's natural language edit request
 */
export async function editComponent(
  client: GoogleGenerativeAI,
  component: DetectedComponentEnhanced,
  prompt: string
): Promise<DetectedComponentEnhanced> {
  const model = client.getGenerativeModel({
    model: MODEL_FLASH,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const systemPrompt = `
    You constitute the "Mutation Engine" of a Zero-Preset Layout Builder.
    
    Task: Modify the given JSON component based on the User's Request.
    User Request: "${prompt}"
    
    Input Component:
    ${JSON.stringify(component, null, 2)}
    
    Rules:
    1. Return ONLY the modified component JSON.
    2. If the request implies a style change (e.g. "make blue"), update 'style'.
    3. If the request implies content change (e.g. "change text"), update 'content'.
    4. Maintain the 'id' and 'type' unless explicitly asked to change structure.
  `;

  const result = await withGeminiRetry(() => model.generateContent(systemPrompt));
  const response = result.response;

  try {
    const rawData = JSON.parse(response.text());
    // Merge with original component to preserve bounds if AI omits them
    const merged = { ...component, ...rawData };
    const { components } = sanitizeComponents([merged]);
    return components[0] || component; // Fallback to original if validation fails
  } catch (e) {
    console.error('[editComponent] Failed to parse Edit response', e);
    return component; // Fallback to original
  }
}
