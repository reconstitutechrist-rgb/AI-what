/**
 * Architect Step (Step 1)
 *
 * Structure building using Claude Opus - creates component structure from manifests.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisualManifest, MergeStrategy, ComponentStructure } from '@/types/titanPipeline';
import { getAnthropicApiKey, CLAUDE_OPUS_MODEL } from './config';

// ============================================================================
// ARCHITECT PROMPT
// ============================================================================

const ARCHITECT_PROMPT = `### Role
You are the **Architect**. Output a clean structure.json (DOM Tree).
If 'dom_tree' is provided in manifests, RESPECT IT.
Use semantic tags. Add data-id to everything. Return JSON.`;

// ============================================================================
// ARCHITECT FUNCTION
// ============================================================================

/**
 * Build component structure from visual manifests using Claude
 */
export async function buildStructure(
  manifests: VisualManifest[],
  _strategy: MergeStrategy,
  instructions: string
): Promise<ComponentStructure> {
  const apiKey = getAnthropicApiKey();
  const anthropic = new Anthropic({ apiKey });

  const msg = await anthropic.messages.create({
    model: CLAUDE_OPUS_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `${ARCHITECT_PROMPT}\nInstructions: ${instructions}\nManifests: ${JSON.stringify(manifests)}`,
      },
    ],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Architect] No JSON found in response');
      return { tree: [], layout_strategy: 'flex' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.tree || !Array.isArray(parsed.tree)) {
      console.error('[Architect] Invalid response structure: missing or non-array tree', Object.keys(parsed));
      return { tree: [], layout_strategy: parsed.layout_strategy || 'flex' };
    }

    return parsed;
  } catch (e) {
    console.error('[Architect] JSON parse failed:', e);
    console.error('[Architect] Raw response (first 500 chars):', text.slice(0, 500));
    return { tree: [], layout_strategy: 'flex' };
  }
}
